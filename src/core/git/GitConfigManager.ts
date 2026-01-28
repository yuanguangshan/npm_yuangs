import fs from 'fs';
import path from 'path';

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

const DEFAULT_CONFIG: Required<GitWorkflowConfig> = {
    auto: {
        model: 'Assistant',
        maxTasks: 5,
        minScore: 85,
        maxRetryAttempts: 2,
        skipReview: false,
        saveOnly: false,
        commit: false,
        commitMessage: '',
        reviewLevel: 'standard',
        cleanOldBackups: true,
        keepBackupCount: 5
    },
    plan: {
        rounds: 2,
        architectModel: 'Assistant',
        reviewerModel: 'gemini-2.5-flash-lite'
    },
    review: {
        level: 'standard'
    }
};

const CONFIG_FILENAMES = [
    'yuangs-git.config.json',
    '.yuangs-git.config.json',
    'yuangs-git.config.js',
    '.yuangs-git.config.js'
];

export class GitConfigManager {
    private config: GitWorkflowConfig;
    private configPath: string | null;

    constructor(private baseDir: string = process.cwd()) {
        this.config = this.loadDefault();
        this.configPath = null;
    }

    /**
     * 加载默认配置
     */
    private loadDefault(): GitWorkflowConfig {
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    /**
     * 查找配置文件
     */
    findConfigFile(): string | null {
        for (const filename of CONFIG_FILENAMES) {
            const filePath = path.join(this.baseDir, filename);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }
        
        // 检查父目录
        let parentDir = path.dirname(this.baseDir);
        let depth = 0;
        while (depth < 5) {
            for (const filename of CONFIG_FILENAMES) {
                const filePath = path.join(parentDir, filename);
                if (fs.existsSync(filePath)) {
                    return filePath;
                }
            }
            
            const newParent = path.dirname(parentDir);
            if (newParent === parentDir) break;
            parentDir = newParent;
            depth++;
        }
        
        return null;
    }

    /**
     * 加载配置文件
     */
    async loadConfig(): Promise<void> {
        const configPath = this.findConfigFile();
        
        if (!configPath) {
            return;
        }
        
        this.configPath = configPath;
        
        try {
            let userConfig: GitWorkflowConfig;
            
            if (configPath.endsWith('.js')) {
                delete require.cache[require.resolve(configPath)];
                userConfig = require(configPath);
            } else {
                const content = await fs.promises.readFile(configPath, 'utf8');
                userConfig = JSON.parse(content);
            }
            
            // 合并配置（用户配置覆盖默认配置）
            this.config = this.mergeConfig(this.config, userConfig);
        } catch (error: any) {
            throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
        }
    }

    /**
     * 合并配置
     */
    private mergeConfig(
        base: GitWorkflowConfig,
        override: GitWorkflowConfig
    ): GitWorkflowConfig {
        return {
            auto: { ...base.auto, ...override.auto },
            plan: { ...base.plan, ...override.plan },
            review: { ...base.review, ...override.review }
        };
    }

    /**
     * 获取 git auto 配置
     */
    getAutoConfig(options: Partial<GitAutoConfig> = {}): Required<GitAutoConfig> {
        const autoConfig = this.config.auto || {};
        
        const cliOptions = {
            model: options.model,
            maxTasks: options.maxTasks !== undefined ? parseInt(options.maxTasks.toString()) : undefined,
            minScore: options.minScore !== undefined ? parseInt(options.minScore.toString()) : undefined,
            skipReview: options.skipReview,
            saveOnly: options.saveOnly,
            commit: options.commit,
            commitMessage: options.commitMessage,
            reviewLevel: options.reviewLevel
        };
        
        return {
            model: (cliOptions.model ?? autoConfig.model ?? DEFAULT_CONFIG.auto.model) as string,
            maxTasks: (cliOptions.maxTasks ?? autoConfig.maxTasks ?? DEFAULT_CONFIG.auto.maxTasks) as number,
            minScore: (cliOptions.minScore ?? autoConfig.minScore ?? DEFAULT_CONFIG.auto.minScore) as number,
            maxRetryAttempts: (autoConfig.maxRetryAttempts ?? DEFAULT_CONFIG.auto.maxRetryAttempts) as number,
            skipReview: (cliOptions.skipReview ?? autoConfig.skipReview ?? DEFAULT_CONFIG.auto.skipReview) as boolean,
            saveOnly: (cliOptions.saveOnly ?? autoConfig.saveOnly ?? DEFAULT_CONFIG.auto.saveOnly) as boolean,
            commit: (cliOptions.commit ?? autoConfig.commit ?? DEFAULT_CONFIG.auto.commit) as boolean,
            commitMessage: (cliOptions.commitMessage ?? autoConfig.commitMessage ?? DEFAULT_CONFIG.auto.commitMessage) as string,
            reviewLevel: (cliOptions.reviewLevel ?? autoConfig.reviewLevel ?? DEFAULT_CONFIG.auto.reviewLevel) as 'quick' | 'standard' | 'deep',
            cleanOldBackups: (autoConfig.cleanOldBackups ?? DEFAULT_CONFIG.auto.cleanOldBackups) as boolean,
            keepBackupCount: (autoConfig.keepBackupCount ?? DEFAULT_CONFIG.auto.keepBackupCount) as number
        };
    }

    /**
     * 获取 git plan 配置
     */
    getPlanConfig(options: { rounds?: string } = {}): typeof DEFAULT_CONFIG.plan {
        const rounds = options.rounds !== undefined ? parseInt(options.rounds) : undefined;
        
        return {
            rounds: rounds || this.config.plan?.rounds || DEFAULT_CONFIG.plan.rounds,
            architectModel: this.config.plan?.architectModel || DEFAULT_CONFIG.plan.architectModel,
            reviewerModel: this.config.plan?.reviewerModel || DEFAULT_CONFIG.plan.reviewerModel
        };
    }

    /**
     * 获取 git review 配置
     */
    getReviewConfig(options: { level?: string } = {}): typeof DEFAULT_CONFIG.review {
        return {
            level: (options.level as any) || this.config.review?.level || DEFAULT_CONFIG.review.level
        };
    }

    /**
     * 获取当前配置
     */
    getConfig(): GitWorkflowConfig {
        return this.config;
    }

    /**
     * 获取配置文件路径
     */
    getConfigPath(): string | null {
        return this.configPath;
    }

    /**
     * 验证配置
     */
    validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const auto = this.config.auto;
        
        if (auto) {
            if (auto.minScore !== undefined && (auto.minScore < 0 || auto.minScore > 100)) {
                errors.push('minScore 必须在 0-100 之间');
            }
            
            if (auto.maxTasks !== undefined && (auto.maxTasks < 1 || auto.maxTasks > 100)) {
                errors.push('maxTasks 必须在 1-100 之间');
            }
            
            if (auto.maxRetryAttempts !== undefined && (auto.maxRetryAttempts < 0 || auto.maxRetryAttempts > 10)) {
                errors.push('maxRetryAttempts 必须在 0-10 之间');
            }
            
            if (auto.keepBackupCount !== undefined && (auto.keepBackupCount < 1 || auto.keepBackupCount > 50)) {
                errors.push('keepBackupCount 必须在 1-50 之间');
            }
        }
        
        if (this.config.plan) {
            const plan = this.config.plan;
            if (plan.rounds !== undefined && plan.rounds < 1) {
                errors.push('plan.rounds 必须大于 0');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 创建示例配置文件
     */
    static async createExampleConfig(baseDir: string = process.cwd()): Promise<string> {
        const examplePath = path.join(baseDir, 'yuangs-git.config.json');
        
        const exampleConfig: GitWorkflowConfig = {
            auto: {
                model: 'Assistant',
                maxTasks: 5,
                minScore: 85,
                maxRetryAttempts: 2,
                skipReview: false,
                saveOnly: false,
                commit: false,
                reviewLevel: 'standard',
                cleanOldBackups: true,
                keepBackupCount: 5
            },
            plan: {
                rounds: 2,
                architectModel: 'Assistant',
                reviewerModel: 'gemini-2.5-flash-lite'
            },
            review: {
                level: 'standard'
            }
        };
        
        const content = JSON.stringify(exampleConfig, null, 2);
        const header = `// Yuangs Git Workflow Configuration
// 更多选项请参考文档
`;
        
        await fs.promises.writeFile(examplePath, header + content, 'utf8');
        
        return examplePath;
    }
}
