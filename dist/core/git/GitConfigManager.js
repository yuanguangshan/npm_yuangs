"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitConfigManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DEFAULT_CONFIG = {
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
class GitConfigManager {
    baseDir;
    config;
    configPath;
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        this.config = this.loadDefault();
        this.configPath = null;
    }
    /**
     * 加载默认配置
     */
    loadDefault() {
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    /**
     * 查找配置文件
     */
    findConfigFile() {
        for (const filename of CONFIG_FILENAMES) {
            const filePath = path_1.default.join(this.baseDir, filename);
            if (fs_1.default.existsSync(filePath)) {
                return filePath;
            }
        }
        // 检查父目录
        let parentDir = path_1.default.dirname(this.baseDir);
        let depth = 0;
        while (depth < 5) {
            for (const filename of CONFIG_FILENAMES) {
                const filePath = path_1.default.join(parentDir, filename);
                if (fs_1.default.existsSync(filePath)) {
                    return filePath;
                }
            }
            const newParent = path_1.default.dirname(parentDir);
            if (newParent === parentDir)
                break;
            parentDir = newParent;
            depth++;
        }
        return null;
    }
    /**
     * 加载配置文件
     */
    async loadConfig() {
        const configPath = this.findConfigFile();
        if (!configPath) {
            return;
        }
        this.configPath = configPath;
        try {
            let userConfig;
            if (configPath.endsWith('.js')) {
                delete require.cache[require.resolve(configPath)];
                userConfig = require(configPath);
            }
            else {
                const content = await fs_1.default.promises.readFile(configPath, 'utf8');
                userConfig = JSON.parse(content);
            }
            // 合并配置（用户配置覆盖默认配置）
            this.config = this.mergeConfig(this.config, userConfig);
        }
        catch (error) {
            throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
        }
    }
    /**
     * 合并配置
     */
    mergeConfig(base, override) {
        return {
            auto: { ...base.auto, ...override.auto },
            plan: { ...base.plan, ...override.plan },
            review: { ...base.review, ...override.review }
        };
    }
    /**
     * 获取 git auto 配置
     */
    getAutoConfig(options = {}) {
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
            model: (cliOptions.model ?? autoConfig.model ?? DEFAULT_CONFIG.auto.model),
            maxTasks: (cliOptions.maxTasks ?? autoConfig.maxTasks ?? DEFAULT_CONFIG.auto.maxTasks),
            minScore: (cliOptions.minScore ?? autoConfig.minScore ?? DEFAULT_CONFIG.auto.minScore),
            maxRetryAttempts: (autoConfig.maxRetryAttempts ?? DEFAULT_CONFIG.auto.maxRetryAttempts),
            skipReview: (cliOptions.skipReview ?? autoConfig.skipReview ?? DEFAULT_CONFIG.auto.skipReview),
            saveOnly: (cliOptions.saveOnly ?? autoConfig.saveOnly ?? DEFAULT_CONFIG.auto.saveOnly),
            commit: (cliOptions.commit ?? autoConfig.commit ?? DEFAULT_CONFIG.auto.commit),
            commitMessage: (cliOptions.commitMessage ?? autoConfig.commitMessage ?? DEFAULT_CONFIG.auto.commitMessage),
            reviewLevel: (cliOptions.reviewLevel ?? autoConfig.reviewLevel ?? DEFAULT_CONFIG.auto.reviewLevel),
            cleanOldBackups: (autoConfig.cleanOldBackups ?? DEFAULT_CONFIG.auto.cleanOldBackups),
            keepBackupCount: (autoConfig.keepBackupCount ?? DEFAULT_CONFIG.auto.keepBackupCount)
        };
    }
    /**
     * 获取 git plan 配置
     */
    getPlanConfig(options = {}) {
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
    getReviewConfig(options = {}) {
        return {
            level: options.level || this.config.review?.level || DEFAULT_CONFIG.review.level
        };
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return this.config;
    }
    /**
     * 获取配置文件路径
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * 验证配置
     */
    validateConfig() {
        const errors = [];
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
    static async createExampleConfig(baseDir = process.cwd()) {
        const examplePath = path_1.default.join(baseDir, 'yuangs-git.config.json');
        const exampleConfig = {
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
        await fs_1.default.promises.writeFile(examplePath, header + content, 'utf8');
        return examplePath;
    }
}
exports.GitConfigManager = GitConfigManager;
//# sourceMappingURL=GitConfigManager.js.map