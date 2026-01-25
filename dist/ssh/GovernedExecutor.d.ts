import { SSHSession } from './SSHSession';
import { Recorder } from '../audit/Recorder';
/**
 * 执行决策
 */
export type ExecDecision = {
    allowed: true;
    normalizedCmd: string;
    reasoning?: string;
} | {
    allowed: false;
    reason: string;
    riskLevel?: string;
    disclosure?: RiskDisclosure;
};
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
export declare enum ElevationState {
    USER = "USER",// 普通用户
    AWAITING_APPROVAL = "AWAITING_APPROVAL",// 等待审批
    PENDING_PWD = "PENDING_PWD",// 正在输入密码
    ROOT = "ROOT"
}
/**
 * 敏感流拦截器 (密码保护)
 */
export declare class SensitiveStreamInterceptor {
    private active;
    enter(): void;
    exit(): void;
    isActive(): boolean;
    /**
     * 返回 false 表示: 不允许进入 AI / Audit
     */
    shouldRecord(): boolean;
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
export declare class SSHGovernedExecutor {
    private session;
    private governance;
    private recorder?;
    private elevation;
    private sensitive;
    private static readonly SUDO_PASSWORD_PROMPT;
    private static readonly SUDO_FAILURE;
    private static readonly ROOT_PROMPT;
    constructor(session: SSHSession, governance: GovernanceService, recorder?: Recorder | undefined);
    /**
     * 处理命令 (Enter 键触发)
     */
    /**
     * 处理命令 (Enter 键触发)
     * @param unsentCommand 尚未发送给服务器的命令部分 (用于解决打字回显重复问题)
     */
    handleCommand(cmd: string, host?: string, user?: string, unsentCommand?: string): Promise<void>;
    /**
     * 处理提权请求 (sudo/su)
     */
    private handleElevationRequest;
    /**
     * 处理 PTY 输出 (状态跃迁)
     */
    private handlePTYOutput;
    /**
     * 渲染拦截信息
     */
    private renderBlock;
    /**
     * 获取当前提权状态
     */
    getElevationState(): ElevationState;
    /**
     * 检查是否在敏感阶段
     */
    isSensitive(): boolean;
}
