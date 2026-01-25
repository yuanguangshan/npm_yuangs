import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SSHSession } from '../../ssh/SSHSession';
import { InputBuffer } from '../../ssh/InputBuffer';
import { SSHGovernedExecutor, GovernanceService, ExecutionContext, ExecDecision } from '../../ssh/GovernedExecutor';
import { Recorder } from '../../audit/Recorder';

/**
 * 简单的治理服务实现 (MVP)
 * TODO: 接入完整的 GovernanceService
 */
class SimpleGovernanceService implements GovernanceService {
  async evaluate(ctx: ExecutionContext): Promise<ExecDecision> {
    const cmd = ctx.command.trim();

    // 危险命令黑名单
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,           // rm -rf /
      /dd\s+if=.*of=\/dev\//,    // dd 写入设备
      /mkfs/,                    // 格式化
      /:\(\)\{\s*:\|:&\s*\};:/,  // fork bomb
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cmd)) {
        return {
          allowed: false,
          reason: 'Detected potentially destructive command',
          riskLevel: 'R3',
          disclosure: {
            command: cmd,
            riskLevel: 'R3',
            impact: 'This command could cause irreversible system damage',
            requiresConfirmation: true,
          },
        };
      }
    }

    // sudo 命令需要额外检查
    if (cmd.startsWith('sudo ')) {
      const sudoCmd = cmd.substring(5).trim();
      
      // 递归检查 sudo 后的命令
      const sudoDecision = await this.evaluate({
        ...ctx,
        command: sudoCmd,
      });

      if (!sudoDecision.allowed) {
        return {
          allowed: false,
          reason: `Sudo execution blocked: ${sudoDecision.reason}`,
          riskLevel: 'R2',
        };
      }

      return {
        allowed: true,
        normalizedCmd: cmd,
        reasoning: 'Privileged command approved with caution',
      };
    }

    // 默认允许
    return {
      allowed: true,
      normalizedCmd: cmd,
    };
  }
}

/**
 * SSH 配置
 */
interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  privateKey?: string;
  password?: string;
}

/**
 * 加载 SSH 配置
 */
function loadSSHConfig(host: string): SSHConfig | null {
  const configPath = path.join(os.homedir(), '.yuangs', 'ssh_config.json');
  
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.hosts?.[host] || null;
  } catch (error) {
    console.error(`Failed to load SSH config: ${error}`);
    return null;
  }
}

/**
 * 解析 SSH 连接字符串
 * 支持格式: user@host, user@host:port
 */
function parseSSHString(connectionString: string): Partial<SSHConfig> {
  const match = connectionString.match(/^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/);
  
  if (!match) {
    throw new Error(`Invalid SSH connection string: ${connectionString}`);
  }

  const [, username, host, port] = match;

  return {
    host,
    username: username || os.userInfo().username,
    port: port ? parseInt(port, 10) : 22,
  };
}

/**
 * SSH 命令实现
 */
export function registerSSHCommand(program: Command): void {
  program
    .command('ssh <connection>')
    .description('Connect to remote host with AI governance')
    .option('-p, --port <port>', 'SSH port', '22')
    .option('-i, --identity <file>', 'Private key file')
    .option('--password <password>', 'Password (not recommended)')
    .action(async (connection: string, options: any) => {
      try {
        // 解析连接字符串
        const parsed = parseSSHString(connection);
        
        // 尝试加载配置
        const savedConfig = loadSSHConfig(parsed.host!);
        
        // 合并配置
        const config: SSHConfig = {
          host: parsed.host!,
          username: parsed.username!,
          port: parseInt(options.port, 10) || parsed.port || 22,
        };

        // 处理认证
        if (options.identity) {
          config.privateKey = fs.readFileSync(options.identity, 'utf-8');
        } else if (savedConfig?.privateKey) {
          config.privateKey = fs.readFileSync(savedConfig.privateKey, 'utf-8');
        } else if (options.password) {
          config.password = options.password;
        } else if (savedConfig?.password) {
          config.password = savedConfig.password;
        } else {
          // 尝试默认密钥
          const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
          if (fs.existsSync(defaultKeyPath)) {
            config.privateKey = fs.readFileSync(defaultKeyPath, 'utf-8');
          } else {
            throw new Error('No authentication method provided');
          }
        }

        console.log(`🔐 Connecting to ${config.username}@${config.host}:${config.port}...`);

        // 创建 SSH 会话
        const session = new SSHSession();
        await session.connect(config);

        console.log(`✅ Connected to ${config.host}`);
        console.log(`🛡️  AI Governance enabled`);
        
        // 获取初始终端尺寸
        const width = process.stdout.columns || 80;
        const height = process.stdout.rows || 24;

        // 初始化录像机
        const recorder = new Recorder({
          user: config.username,
          host: config.host,
          width,
          height,
          command: `yuangs ssh ${connection}`
        });

        console.log(`📝 Session recording started: ${recorder.getFilePath()}\n`);

        // 创建治理服务
        const governance = new SimpleGovernanceService();

        // 创建治理执行器 (传入 recorder)
        const executor = new SSHGovernedExecutor(session, governance, recorder);

        // 创建输入缓冲区
        const inputBuffer = new InputBuffer();

        // 处理终端 resize
        // 关键: 同时更新 SSH PTY 和 录像机
        process.stdout.on('resize', () => {
          const { columns, rows } = process.stdout;
          const w = columns || 80;
          const h = rows || 24;
          session.resize(w, h);
          recorder.recordResize(w, h);
        });

        // 设置原始模式
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        // 处理用户输入
        process.stdin.on('data', async (chunk: Buffer) => {
          const input = chunk.toString();

          // 检查是否是完整命令
          const cmd = inputBuffer.push(input);

          if (cmd) {
            // 完整命令: 进入治理流程
            // 记录完整命令 input (包含换行符)
            if (!executor.isSensitive()) {
              recorder.recordInput(cmd + '\n'); // Record the complete command with newline
            }
            await executor.handleCommand(cmd, config.host, config.username);
          } else {
            // 非完整命令: 不透传到远程会话, 仅用于本地显示 (打字体验)
            // 也要记录输入! 否则回放时看不到打字过程
            // 注意: 这里记录的是原始按键 (比如 'l', 's', Backspace 等)
            // 只有当 GovernedExecutor.isSensitive() 为 false 时才记录
            if (!executor.isSensitive()) {
               recorder.recordInput(input);
            }
            // Send to local stdout for typing experience, but not to remote session
            // This prevents duplication while maintaining typing feedback
            process.stdout.write(input);
          }
        });

        // 处理会话关闭
        session.on('close', () => {
          recorder.close();
          console.log('\n\n🔌 Connection closed');
          process.exit(0);
        });

        // 处理 Ctrl+C
        process.on('SIGINT', () => {
          recorder.close();
          console.log('\n\n👋 Disconnecting...');
          session.close();
          process.exit(0);
        });

      } catch (error: any) {
        console.error(`❌ SSH connection failed: ${error.message}`);
        process.exit(1);
      }
    });
}
