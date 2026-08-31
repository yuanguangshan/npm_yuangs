import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { z } from 'zod';
import { ConfigError } from './errors';

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

const providerConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  compat: z
    .object({
      supportsFinishReason: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
  models: z
    .array(
      z.object({
        id: z.string().min(1),
        reasoning: z.boolean().optional(),
        contextWindow: z.number().optional(),
        maxTokens: z.number().optional(),
      }),
    )
    .optional(),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;

const userConfigSchema = z.object({
  defaultModel: z.string().optional(),
  defaultProvider: z.string().optional(),
  providers: z.array(providerConfigSchema).optional(),
  aiProxyUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  accountType: z.enum(['free', 'pro', 'paid']).optional(),
  contextWindow: z.number().optional(),
  maxFileTokens: z.number().optional(),
  maxTotalTokens: z.number().optional(),
}).passthrough();

const projectConfigSchema = z.object({
  git: z.object({
    auto: z.object({
      model: z.string().optional(),
      maxTasks: z.number().optional(),
      minScore: z.number().optional(),
      autoCommit: z.boolean().optional(),
      reviewLevel: z.enum(['quick', 'standard', 'deep']).optional(),
    }).optional(),
    reviewThreshold: z.number().optional(),
  }).optional(),
  ui: z.object({
    theme: z.enum(['dark', 'light', 'auto']).optional(),
    showProgress: z.boolean().optional(),
    useEmoji: z.boolean().optional(),
  }).optional(),
  ai: z.object({
    defaultModel: z.string().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
  }).optional(),
}).passthrough();

// Merged config schema
export const mergedConfigSchema = userConfigSchema.merge(projectConfigSchema);
export type MergedConfig = z.infer<typeof mergedConfigSchema>;

// ---------------------------------------------------------------------------
// Config source tracking
// ---------------------------------------------------------------------------

export type ConfigSource = 'built-in' | 'user-global' | 'project' | 'command-override' | 'env';

export interface ConfigFieldSource<T = unknown> {
  value: T;
  source: ConfigSource;
  filePath?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: MergedConfig = {
  defaultModel: '',                            // 默认禁止内置模型：须由用户配置 providers 或隐藏开关 YUANGS_UNLOCK 解锁
  aiProxyUrl: '',                              // 默认不指向任何后端
  apiKey: '',                                  // 用户自配端点的鉴权 token（如 wx.want.biz/weclaw 需要）
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

const USER_CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

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

export class ConfigService {
  private config: MergedConfig;
  private sourceMap: Map<string, ConfigFieldSource> = new Map();
  private initialized = false;

  constructor(
    private cwd: string = process.cwd(),
    private overrides: Partial<MergedConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Load and merge all config sources.
   * Priority: overrides > env vars > user config > project config > defaults
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const projectConfig = this.loadProjectConfig();
    const projectConfigPath = this.findProjectConfigFile();
    const userConfig = this.loadUserConfig();

    // Record sources for top-level fields
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      this.sourceMap.set(key, {
        value: (DEFAULT_CONFIG as any)[key],
        source: 'built-in',
      });
    });

    if (userConfig) {
      Object.keys(userConfig).forEach(key => {
        this.sourceMap.set(key, {
          value: (userConfig as any)[key],
          source: 'user-global',
          filePath: USER_CONFIG_FILE,
        });
      });
    }

    if (projectConfig && projectConfigPath) {
      Object.keys(projectConfig).forEach(key => {
        this.sourceMap.set(key, {
          value: (projectConfig as any)[key],
          source: 'project',
          filePath: projectConfigPath,
        });
      });
    }

    const envConfig = this.loadEnvConfig(userConfig, projectConfig);
    if (Object.keys(envConfig).length > 0) {
      Object.keys(envConfig).forEach(key => {
        this.sourceMap.set(key, {
          value: (envConfig as any)[key],
          source: 'env',
        });
      });
    }

    // Merge: defaults < project < user < env < overrides
    this.config = this.deepMerge(
      this.deepMerge(
        this.deepMerge(DEFAULT_CONFIG, projectConfig),
        userConfig
      ),
      envConfig
    );

    if (Object.keys(this.overrides).length > 0) {
      Object.keys(this.overrides).forEach(key => {
        this.sourceMap.set(key, {
          value: (this.overrides as any)[key],
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
  get<T>(dotPath: string): T | undefined {
    const parts = dotPath.split('.');
    let value: any = this.config;
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    return value as T;
  }

  /**
   * Get source info for a top-level config key.
   */
  getSourceInfo<T>(key: string): ConfigFieldSource<T> | undefined {
    return this.sourceMap.get(key) as ConfigFieldSource<T> | undefined;
  }

  /**
   * Get the full merged config.
   */
  getAll(): MergedConfig {
    return { ...this.config };
  }

  /**
   * Dump config snapshot with source information.
   */
  dumpConfigSnapshot(): string {
    const output: Record<string, any> = {};

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
  getAiProxyUrl(): string {
    return this.get<string>('aiProxyUrl') ?? DEFAULT_CONFIG.aiProxyUrl!;
  }

  /**
   * Convenience: get default model.
   */
  getDefaultModel(): string {
    return this.get<string>('defaultModel') ?? DEFAULT_CONFIG.defaultModel!;
  }

  /**
   * Convenience: get account type.
   */
  getAccountType(): 'free' | 'pro' | 'paid' {
    return this.get<'free' | 'pro' | 'paid'>('accountType') ?? 'free';
  }

  /**
   * Convenience: get API key for user-configured endpoint.
   */
  getApiKey(): string {
    return this.get<string>('apiKey') ?? DEFAULT_CONFIG.apiKey!;
  }

  // --- Private helpers ---

  private loadProjectConfig(): Partial<MergedConfig> {
    const configPath = this.findProjectConfigFile();
    if (!configPath) return {};

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      let parsed: unknown;

      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml') || !configPath.includes('.')) {
        parsed = yaml.load(content);
      } else {
        parsed = JSON.parse(content);
      }

      const result = projectConfigSchema.safeParse(parsed);
      if (!result.success) {
        console.warn(`⚠️  项目配置验证失败: ${result.error.issues.map(i => i.message).join('; ')}`);
      }
      return result.success ? result.data : {};
    } catch {
      return {};
    }
  }

  private loadUserConfig(): Partial<MergedConfig> {
    if (!fs.existsSync(USER_CONFIG_FILE)) return {};

    try {
      const content = fs.readFileSync(USER_CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(content);
      const result = userConfigSchema.safeParse(parsed);
      if (!result.success) {
        console.warn(`⚠️  ~/.yuangs.json 验证失败: ${result.error.issues.map(i => i.message).join('; ')}`);
      }
      return result.success ? result.data : {};
    } catch {
      return {};
    }
  }

  private loadEnvConfig(
    userConfig: Partial<MergedConfig> = {},
    projectConfig: Partial<MergedConfig> = {}
  ): Partial<MergedConfig> {
    const env: Partial<MergedConfig> = {};

    if (process.env.YUANGS_AI_PROXY_URL) {
      env.aiProxyUrl = process.env.YUANGS_AI_PROXY_URL;
    }
    if (process.env.YUANGS_DEFAULT_MODEL) {
      env.defaultModel = process.env.YUANGS_DEFAULT_MODEL;
    }
    if (process.env.YUANGS_ACCOUNT_TYPE) {
      const t = process.env.YUANGS_ACCOUNT_TYPE as 'free' | 'pro' | 'paid';
      if (['free', 'pro', 'paid'].includes(t)) env.accountType = t;
    }

    // --- 隐藏开关：解锁内置免费模型（仅作者自用，不写文档 / 不进 --help / 不进 config model list）---
    // 设 YUANGS_UNLOCK=1 时允许使用内置免费模型（aiproxy.want.biz 的 Assistant 档）。
    // 默认（不设）则禁止内置模型，用户须自行配置 providers。
    // 只注入顶层字段（fallback 路径用）；不注入 providers，避免覆盖用户 ~/.yuangs.json 的配置。
    // 该字符串对源码阅读者可见但无文档；改名只需改这一处。
    // 仅当值为 1 / true / yes / on 时启用；空字符串、"0"、未设置均视为关闭
    // （防止 shell 中 YUANGS_UNLOCK=0 被 JS 当作真值，导致开关关不掉）。
    // 关键：当用户「已显式配置」端点/模型（env 显式变量、或 ~/.yuangs.json、或项目配置）时，
    // unlock 不再覆盖，避免隐藏开关静默劫持用户自建端点导致 401。
    const unlockOn =
      process.env.YUANGS_UNLOCK === '1' ||
      process.env.YUANGS_UNLOCK === 'true' ||
      process.env.YUANGS_UNLOCK === 'yes' ||
      process.env.YUANGS_UNLOCK === 'on';
    if (unlockOn) {
      const userHasProxy =
        !!(env.aiProxyUrl || userConfig.aiProxyUrl || projectConfig.aiProxyUrl);
      const userHasModel =
        !!(env.defaultModel || userConfig.defaultModel || projectConfig.defaultModel);

      if (!userHasProxy) {
        env.aiProxyUrl = process.env.YUANGS_UNLOCK_URL || 'https://aiproxy.want.biz/v1/chat/completions';
      }
      if (!userHasModel) {
        env.defaultModel = process.env.YUANGS_UNLOCK_MODEL || 'Assistant';
      }
      // 用户未显式设定 accountType 时才回落免费档
      if (!env.accountType) {
        env.accountType = 'free';
      }
    }

    return env;
  }

  private findProjectConfigFile(): string | null {
    for (const file of PROJECT_CONFIG_FILES) {
      const fullPath = path.join(this.cwd, file);
      if (fs.existsSync(fullPath)) return fullPath;
    }

    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir) {
      for (const file of PROJECT_CONFIG_FILES) {
        const fullPath = path.join(homeDir, file);
        if (fs.existsSync(fullPath)) return fullPath;
      }
    }

    return null;
  }

  private deepMerge(target: Partial<MergedConfig>, source: Partial<MergedConfig>): MergedConfig {
    const result: any = { ...target };

    for (const key of Object.keys(source)) {
      const sourceVal = (source as any)[key];
      const targetVal = (target as any)[key];

      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        result[key] = this.deepMerge(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }

    return result as MergedConfig;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: ConfigService | null = null;

/**
 * Get or create the global ConfigService singleton.
 */
export function getConfigService(): ConfigService {
  if (!_instance) {
    _instance = new ConfigService();
  }
  return _instance;
}
