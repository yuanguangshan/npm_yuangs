"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = exports.mergedConfigSchema = void 0;
exports.getConfigService = getConfigService;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------
const providerConfigSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().optional(),
    baseUrl: zod_1.z.string().url().optional(),
    apiKey: zod_1.z.string().optional(),
    models: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        reasoning: zod_1.z.boolean().optional(),
        contextWindow: zod_1.z.number().optional(),
        maxTokens: zod_1.z.number().optional(),
    }))
        .optional(),
});
const userConfigSchema = zod_1.z.object({
    defaultModel: zod_1.z.string().optional(),
    defaultProvider: zod_1.z.string().optional(),
    providers: zod_1.z.array(providerConfigSchema).optional(),
    aiProxyUrl: zod_1.z.string().url().optional(),
    accountType: zod_1.z.enum(['free', 'pro', 'paid']).optional(),
    contextWindow: zod_1.z.number().optional(),
    maxFileTokens: zod_1.z.number().optional(),
    maxTotalTokens: zod_1.z.number().optional(),
}).passthrough();
const projectConfigSchema = zod_1.z.object({
    git: zod_1.z.object({
        auto: zod_1.z.object({
            model: zod_1.z.string().optional(),
            maxTasks: zod_1.z.number().optional(),
            minScore: zod_1.z.number().optional(),
            autoCommit: zod_1.z.boolean().optional(),
            reviewLevel: zod_1.z.enum(['quick', 'standard', 'deep']).optional(),
        }).optional(),
        reviewThreshold: zod_1.z.number().optional(),
    }).optional(),
    ui: zod_1.z.object({
        theme: zod_1.z.enum(['dark', 'light', 'auto']).optional(),
        showProgress: zod_1.z.boolean().optional(),
        useEmoji: zod_1.z.boolean().optional(),
    }).optional(),
    ai: zod_1.z.object({
        defaultModel: zod_1.z.string().optional(),
        temperature: zod_1.z.number().optional(),
        maxTokens: zod_1.z.number().optional(),
    }).optional(),
}).passthrough();
// Merged config schema
exports.mergedConfigSchema = userConfigSchema.merge(projectConfigSchema);
// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_CONFIG = {
    defaultModel: 'Assistant',
    aiProxyUrl: 'https://aiproxy.want.biz/v1/chat/completions',
    accountType: 'free',
    git: {
        auto: {
            model: 'Assistant',
            maxTasks: 5,
            minScore: 85,
            autoCommit: false,
            reviewLevel: 'standard',
        },
        reviewThreshold: 7,
    },
    ui: {
        theme: 'auto',
        showProgress: true,
        useEmoji: true,
    },
    ai: {
        defaultModel: 'Assistant',
        temperature: 0.7,
        maxTokens: 2000,
    },
};
// ---------------------------------------------------------------------------
// Config file discovery
// ---------------------------------------------------------------------------
const USER_CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
const PROJECT_CONFIG_FILES = [
    '.yuangsrc',
    '.yuangsrc.json',
    '.yuangsrc.yaml',
    '.yuangsrc.yml',
    'yuangs.config.json',
];
// ---------------------------------------------------------------------------
// ConfigService
// ---------------------------------------------------------------------------
class ConfigService {
    cwd;
    overrides;
    config;
    sourceMap = new Map();
    initialized = false;
    constructor(cwd = process.cwd(), overrides = {}) {
        this.cwd = cwd;
        this.overrides = overrides;
        this.config = { ...DEFAULT_CONFIG };
    }
    /**
     * Load and merge all config sources.
     * Priority: overrides > env vars > user config > project config > defaults
     */
    async init() {
        if (this.initialized)
            return;
        const projectConfig = this.loadProjectConfig();
        const projectConfigPath = this.findProjectConfigFile();
        const userConfig = this.loadUserConfig();
        // Record sources for top-level fields
        Object.keys(DEFAULT_CONFIG).forEach(key => {
            this.sourceMap.set(key, {
                value: DEFAULT_CONFIG[key],
                source: 'built-in',
            });
        });
        if (userConfig) {
            Object.keys(userConfig).forEach(key => {
                this.sourceMap.set(key, {
                    value: userConfig[key],
                    source: 'user-global',
                    filePath: USER_CONFIG_FILE,
                });
            });
        }
        if (projectConfig && projectConfigPath) {
            Object.keys(projectConfig).forEach(key => {
                this.sourceMap.set(key, {
                    value: projectConfig[key],
                    source: 'project',
                    filePath: projectConfigPath,
                });
            });
        }
        const envConfig = this.loadEnvConfig();
        if (Object.keys(envConfig).length > 0) {
            Object.keys(envConfig).forEach(key => {
                this.sourceMap.set(key, {
                    value: envConfig[key],
                    source: 'env',
                });
            });
        }
        // Merge: defaults < project < user < env < overrides
        this.config = this.deepMerge(this.deepMerge(this.deepMerge(DEFAULT_CONFIG, projectConfig), userConfig), envConfig);
        if (Object.keys(this.overrides).length > 0) {
            Object.keys(this.overrides).forEach(key => {
                this.sourceMap.set(key, {
                    value: this.overrides[key],
                    source: 'command-override',
                });
            });
            this.config = this.deepMerge(this.config, this.overrides);
        }
        this.initialized = true;
    }
    /**
     * Get a value by dot path (e.g. "git.auto.maxTasks").
     */
    get(dotPath) {
        const parts = dotPath.split('.');
        let value = this.config;
        for (const part of parts) {
            if (value === undefined || value === null)
                return undefined;
            value = value[part];
        }
        return value;
    }
    /**
     * Get source info for a top-level config key.
     */
    getSourceInfo(key) {
        return this.sourceMap.get(key);
    }
    /**
     * Get the full merged config.
     */
    getAll() {
        return { ...this.config };
    }
    /**
     * Dump config snapshot with source information.
     */
    dumpConfigSnapshot() {
        const output = {};
        Object.entries(this.config).forEach(([key, value]) => {
            const sourceInfo = this.sourceMap.get(key);
            output[key] = {
                value,
                source: sourceInfo?.source ?? 'unknown',
                filePath: sourceInfo?.filePath,
            };
        });
        return JSON.stringify(output, null, 2);
    }
    /**
     * Convenience: get AI proxy URL.
     */
    getAiProxyUrl() {
        return this.get('aiProxyUrl') ?? DEFAULT_CONFIG.aiProxyUrl;
    }
    /**
     * Convenience: get default model.
     */
    getDefaultModel() {
        return this.get('defaultModel') ?? DEFAULT_CONFIG.defaultModel;
    }
    /**
     * Convenience: get account type.
     */
    getAccountType() {
        return this.get('accountType') ?? 'free';
    }
    // --- Private helpers ---
    loadProjectConfig() {
        const configPath = this.findProjectConfigFile();
        if (!configPath)
            return {};
        try {
            const content = fs_1.default.readFileSync(configPath, 'utf8');
            let parsed;
            if (configPath.endsWith('.yaml') || configPath.endsWith('.yml') || !configPath.includes('.')) {
                parsed = js_yaml_1.default.load(content);
            }
            else {
                parsed = JSON.parse(content);
            }
            const result = projectConfigSchema.safeParse(parsed);
            if (!result.success) {
                console.warn(`⚠️  项目配置验证失败: ${result.error.issues.map(i => i.message).join('; ')}`);
            }
            return result.success ? result.data : {};
        }
        catch {
            return {};
        }
    }
    loadUserConfig() {
        if (!fs_1.default.existsSync(USER_CONFIG_FILE))
            return {};
        try {
            const content = fs_1.default.readFileSync(USER_CONFIG_FILE, 'utf8');
            const parsed = JSON.parse(content);
            const result = userConfigSchema.safeParse(parsed);
            if (!result.success) {
                console.warn(`⚠️  ~/.yuangs.json 验证失败: ${result.error.issues.map(i => i.message).join('; ')}`);
            }
            return result.success ? result.data : {};
        }
        catch {
            return {};
        }
    }
    loadEnvConfig() {
        const env = {};
        if (process.env.YUANGS_AI_PROXY_URL) {
            env.aiProxyUrl = process.env.YUANGS_AI_PROXY_URL;
        }
        if (process.env.YUANGS_DEFAULT_MODEL) {
            env.defaultModel = process.env.YUANGS_DEFAULT_MODEL;
        }
        if (process.env.YUANGS_ACCOUNT_TYPE) {
            const t = process.env.YUANGS_ACCOUNT_TYPE;
            if (['free', 'pro', 'paid'].includes(t))
                env.accountType = t;
        }
        return env;
    }
    findProjectConfigFile() {
        for (const file of PROJECT_CONFIG_FILES) {
            const fullPath = path_1.default.join(this.cwd, file);
            if (fs_1.default.existsSync(fullPath))
                return fullPath;
        }
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            for (const file of PROJECT_CONFIG_FILES) {
                const fullPath = path_1.default.join(homeDir, file);
                if (fs_1.default.existsSync(fullPath))
                    return fullPath;
            }
        }
        return null;
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            const sourceVal = source[key];
            const targetVal = target[key];
            if (sourceVal &&
                typeof sourceVal === 'object' &&
                !Array.isArray(sourceVal) &&
                targetVal &&
                typeof targetVal === 'object' &&
                !Array.isArray(targetVal)) {
                result[key] = this.deepMerge(targetVal, sourceVal);
            }
            else {
                result[key] = sourceVal;
            }
        }
        return result;
    }
}
exports.ConfigService = ConfigService;
// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------
let _instance = null;
/**
 * Get or create the global ConfigService singleton.
 */
function getConfigService() {
    if (!_instance) {
        _instance = new ConfigService();
    }
    return _instance;
}
//# sourceMappingURL=ConfigService.js.map