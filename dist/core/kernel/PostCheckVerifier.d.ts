/**
 * Post-Check Verifier for Atomic Transactions
 *
 * 后验证检查器 - 确保代码修改后的工程质量
 *
 * 核心功能：
 * 1. 执行 TypeScript 类型检查
 * 2. 运行自定义验证命令
 * 3. 捕获并结构化错误信息
 * 4. 为 AI 提供可修复的反馈
 */
/**
 * 验证结果
 */
export interface VerificationResult {
    /** 验证是否通过 */
    passed: boolean;
    /** 输出日志（标准输出） */
    stdout?: string;
    /** 错误日志（标准错误） */
    stderr?: string;
    /** 完整的错误信息 */
    error?: string;
    /** 验证耗时（毫秒） */
    duration: number;
}
/**
 * 验证器配置
 */
export interface VerifierConfig {
    /** TypeScript 检查命令（默认: npx tsc --noEmit） */
    typeCheckCommand: string;
    /** 自定义验证命令（可选） */
    customCheckCommand?: string;
    /** 工作目录（默认: 当前目录） */
    cwd?: string;
    /** 超时时间（毫秒） */
    timeout?: number;
}
/**
 * 后验证检查器
 *
 * 执行编译检查和自定义验证，确保代码修改不会破坏项目
 */
export declare class PostCheckVerifier {
    private config;
    constructor(config?: Partial<VerifierConfig>);
    /**
     * 执行类型检查
     *
     * @returns 验证结果
     */
    verifyTypeCheck(): Promise<VerificationResult>;
    /**
     * 执行自定义验证
     *
     * @returns 验证结果
     */
    verifyCustomCheck(): Promise<VerificationResult>;
    /**
     * 执行所有验证
     *
     * @returns 验证结果（任何一项失败即整体失败）
     */
    verifyAll(): Promise<VerificationResult>;
    /**
     * 运行单个检查命令
     */
    private runCheck;
    /**
     * 格式化错误信息，便于 AI 理解
     */
    formatErrorForAI(result: VerificationResult): string;
    /**
     * 提取文件路径和行号（用于定位错误）
     */
    extractErrorLocations(result: VerificationResult): Array<{
        file: string;
        line: number;
        message: string;
    }>;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<VerifierConfig>): void;
}
