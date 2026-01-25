import { SSHSession } from './SSHSession';
import { Recorder } from '../audit/Recorder';

/**
 * 执行决策
 */
export type ExecDecision =
  | { allowed: true; normalizedCmd: string; reasoning?: string }
  | { allowed: false; reason: string; riskLevel?: string; disclosure?: RiskDisclosure };

/**
 * 风险披露信息
 */
export interface RiskDisclosure {
  command: string;
  riskLevel: string;
  impact: string;
  alternatives?: string[];
  requiresConfirmation: boolean;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  kind: 'ssh_cmd' | 'local_shell' | 'batch' | 'plan';
  command: string;
  host?: string;
  user?: string;
  cwd?: string;
  environment?: string;
}

/**
 * 治理服务接口
 */
export interface GovernanceService {
  evaluate(ctx: ExecutionContext): Promise<ExecDecision>;
}

/**
 * 提权状态
 */
export enum ElevationState {
  USER = 'USER',                     // 普通用户
  AWAITING_APPROVAL = 'AWAITING_APPROVAL', // 等待审批
  PENDING_PWD = 'PENDING_PWD',       // 正在输入密码
  ROOT = 'ROOT'                      // 已获得 Root 权限
}

/**
 * 敏感流拦截器 (密码保护)
 */
export class SensitiveStreamInterceptor {
  private active = false;

  enter(): void {
    this.active = true;
  }

  exit(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  /**
   * 返回 false 表示: 不允许进入 AI / Audit
   */
  shouldRecord(): boolean {
    return !this.active;
  }
}

/**
 * SSH 治理执行器
 * 
 * 这是整个系统最值钱的类
 * 
 * 职责:
 * - 拦截 SSH 命令
 * - 调用治理服务
 * - 处理 sudo/su 提权
 * - 保护密码流
 */
export class SSHGovernedExecutor {
  private elevation = ElevationState.USER;
  private sensitive = new SensitiveStreamInterceptor();

  // Prompt 识别正则
  private static readonly SUDO_PASSWORD_PROMPT = /(\[sudo\] password for .+:|Password:)/i;
  private static readonly SUDO_FAILURE = /(sorry, try again|authentication failure)/i;
  private static readonly ROOT_PROMPT = /(^|\n).*#\s?$/;

  constructor(
    private session: SSHSession,
    private governance: GovernanceService,
    private recorder?: Recorder
  ) {
    // 监听 PTY 输出,进行状态跃迁
    this.session.on('data', (buf: Buffer) => {
      this.handlePTYOutput(buf);
    });
  }

  /**
   * 处理命令 (Enter 键触发)
   */
  /**
   * 处理命令 (Enter 键触发)
   * @param unsentCommand 尚未发送给服务器的命令部分 (用于解决打字回显重复问题)
   */
  async handleCommand(cmd: string, host?: string, user?: string, unsentCommand: string = cmd): Promise<void> {
    // 密码输入阶段: 绝不治理,直接透传
    if (this.elevation === ElevationState.PENDING_PWD) {
      // 密码也不记录到审计日志
      // 注意：这里我们只发送 unsent 部分 + 回车
      this.session.write(unsentCommand + '\n');
      return;
    }

    const isSudo = cmd.trim().startsWith('sudo ');
    const isSu = cmd.trim().startsWith('su ');

    // sudo 命令处理
    if ((isSudo || isSu) && this.elevation === ElevationState.USER) {
      // 透传 unsentCommand 给 sudo 处理逻辑
      await this.handleElevationRequest(cmd, host, user, unsentCommand);
      return;
    }

    // 普通命令: 调用治理服务
    const decision = await this.governance.evaluate({
      kind: 'ssh_cmd',
      command: cmd,
      host,
      user,
    });

    if (!decision.allowed) {
      this.renderBlock(decision);
      // 记录拦截事件
      if (this.recorder && this.sensitive.shouldRecord()) {
        this.recorder.recordGovernance('blocked', {
          command: cmd,
          reason: decision.reason,
          risk: decision.riskLevel
        });
      }
      
      // 发送 Ctrl+C (\x03) 给服务器以清除已输入的缓冲字符
      this.session.write('\x03');
      return;
    }

    // 记录审计 (如果不在敏感阶段)
    if (this.recorder && this.sensitive.shouldRecord()) {
      // 记录治理批准事件
      if (decision.reasoning) {
        this.recorder.recordGovernance('allowed', {
          command: cmd,
          reasoning: decision.reasoning
        });
      }
      
      // 记录输入
      this.recorder.recordInput(cmd + '\n', {
        elevation: this.elevation,
      });
    }

    // 执行命令
    // 智能补发: 如果命令没有被治理层修改，我们只需要发送未发送的部分 + 回车
    if (decision.normalizedCmd === cmd) {
      if (unsentCommand) {
        this.session.write(unsentCommand + '\r');
      } else {
        // 如果没有未发送部分，只发回车
        this.session.write('\r');
      }
    } else {
      // 如果命令被修改了 (例如自动纠错)，我们需要先清除已有输入
      // 发送 Ctrl+C (清除行) + 新命令 + 回车
      this.session.write('\x03' + decision.normalizedCmd + '\r');
    }
  }

  /**
   * 处理提权请求 (sudo/su)
   */
  private async handleElevationRequest(cmd: string, host?: string, user?: string, unsentCommand: string = cmd): Promise<void> {
    this.elevation = ElevationState.AWAITING_APPROVAL;

    const decision = await this.governance.evaluate({
      kind: 'ssh_cmd',
      command: cmd,
      host,
      user,
    });

    if (!decision.allowed) {
      this.elevation = ElevationState.USER;
      this.renderBlock(decision);
       // 记录拦截
       if (this.recorder && this.sensitive.shouldRecord()) {
        this.recorder.recordGovernance('elevation_blocked', {
          command: cmd,
          reason: decision.reason
        });
      }
      // 清除已输入的 sudo 命令
      this.session.write('\x03');
      return;
    }

    // 审批通过,允许进入密码阶段
    this.elevation = ElevationState.PENDING_PWD;
    this.sensitive.enter();
    
    // 记录提权请求被批准 (在进入敏感模式前记录)
    if (this.recorder) {
      this.recorder.recordGovernance('elevation_started', {
        command: cmd
      });
    }

    // 只发送 unsent 部分 + 回车
    this.session.write(unsentCommand + '\r');
  }

  /**
   * 处理 PTY 输出 (状态跃迁)
   */
  private handlePTYOutput(buf: Buffer): void {
    const text = buf.toString('utf8');

    // sudo 密码提示出现
    if (
      this.elevation === ElevationState.PENDING_PWD &&
      SSHGovernedExecutor.SUDO_PASSWORD_PROMPT.test(text)
    ) {
      // 不记录、不分析,直接透传
      // 但需要在治理日志中标记这是一个敏感提示
      if (this.recorder) {
        // 不要记录具体 text，只记录事件
        this.recorder.recordGovernance('sensitive_prompt_displayed');
      }
      process.stdout.write(text);
      return;
    }

    // sudo 失败
    if (
      this.elevation === ElevationState.PENDING_PWD &&
      SSHGovernedExecutor.SUDO_FAILURE.test(text)
    ) {
      this.elevation = ElevationState.USER;
      this.sensitive.exit();
      if (this.recorder) {
        this.recorder.recordGovernance('elevation_failed');
      }
    }

    // root shell 成功
    if (SSHGovernedExecutor.ROOT_PROMPT.test(text)) {
      this.elevation = ElevationState.ROOT;
      this.sensitive.exit();
      if (this.recorder) {
        this.recorder.recordGovernance('elevation_success_root');
      }
    }

    // 审计控制
    if (this.recorder && this.sensitive.shouldRecord()) {
      this.recorder.recordOutput(buf);
    }

    process.stdout.write(buf);
  }

  /**
   * 渲染拦截信息
   */
  private renderBlock(decision: ExecDecision & { allowed: false }): void {
    console.error('\n🚫 [GOVERNANCE BLOCK]');
    console.error(`   Reason: ${decision.reason}`);
    if (decision.riskLevel) {
      console.error(`   Risk Level: ${decision.riskLevel}`);
    }
    if (decision.disclosure) {
      console.error(`   Impact: ${decision.disclosure.impact}`);
      if (decision.disclosure.alternatives && decision.disclosure.alternatives.length > 0) {
        console.error(`   Alternatives:`);
        decision.disclosure.alternatives.forEach((alt) => {
          console.error(`     - ${alt}`);
        });
      }
    }
    console.error('');
  }

  /**
   * 获取当前提权状态
   */
  getElevationState(): ElevationState {
    return this.elevation;
  }

  /**
   * 检查是否在敏感阶段
   */
  isSensitive(): boolean {
    return this.sensitive.isActive();
  }
}
