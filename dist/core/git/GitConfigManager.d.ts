export interface GitAutoConfig {
    /** AI 模型 */
    model?: string;
    /** 最大任务数 */
    maxTasks?: number;
    /** 最低审查分数 */
    minScore?: number;
    /** 最大重试次数 */
    maxRetryAttempts?: number;
    /** 是否跳过代码审查 */
    skipReview?: boolean;
    /** 是否只保存不写入 */
    saveOnly?: boolean;
    /** 是否自动提交 */
    commit?: boolean;
    /** 自定义提交消息 */
    commitMessage?: string;
    /** 审查级别 */
    reviewLevel?: 'quick' | 'standard' | 'deep';
    /** 是否清理旧备份 */
    cleanOldBackups?: boolean;
    /** 保留的备份数量 */
    keepBackupCount?: number;
}
export interface GitWorkflowConfig {
    /** git auto 配置 */
    auto: GitAutoConfig;
    /** git plan 配置 */
    plan?: {
        /** 对话轮数 */
        rounds?: number;
        /** 架构师模型 */
        architectModel?: string;
        /** 审查员模型 */
        reviewerModel?: string;
    };
    /** git review 配置 */
    review?: {
        /** 默认审查级别 */
        level?: 'quick' | 'standard' | 'deep';
    };
}
declare const DEFAULT_CONFIG: Required<GitWorkflowConfig>;
export declare class GitConfigManager {
    private baseDir;
    private config;
    private configPath;
    constructor(baseDir?: string);
    /**
     * 加载默认配置
     */
    private loadDefault;
    /**
     * 查找配置文件
     */
    findConfigFile(): string | null;
    /**
     * 加载配置文件
     */
    loadConfig(): Promise<void>;
    /**
     * 合并配置
     */
    private mergeConfig;
    /**
     * 获取 git auto 配置
     */
    getAutoConfig(options?: Partial<GitAutoConfig>): Required<GitAutoConfig>;
    /**
     * 获取 git plan 配置
     */
    getPlanConfig(options?: {
        rounds?: string;
    }): typeof DEFAULT_CONFIG.plan;
    /**
     * 获取 git review 配置
     */
    getReviewConfig(options?: {
        level?: string;
    }): typeof DEFAULT_CONFIG.review;
    /**
     * 获取当前配置
     */
    getConfig(): GitWorkflowConfig;
    /**
     * 获取配置文件路径
     */
    getConfigPath(): string | null;
    /**
     * 验证配置
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 创建示例配置文件
     */
    static createExampleConfig(baseDir?: string): Promise<string>;
}
export {};
