import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { z } from 'zod';
import { ConfigError } from './errors';

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

const userConfigSchema = z.object({
  defaultModel: z.string().optional(),
  aiProxyUrl: z.string().url().optional(),
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
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: MergedConfig = {
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
    const userConfig = this.loadUserConfig();

    // Merge: defaults < project < user < env < overrides
    this.config = this.deepMerge(
      this.deepMerge(
        this.deepMerge(DEFAULT_CONFIG, projectConfig),
        userConfig
      ),
      this.loadEnvConfig()
    );

    if (Object.keys(this.overrides).length > 0) {
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
   * Get the full merged config.
   */
  getAll(): MergedConfig {
    return { ...this.config };
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
      return result.success ? result.data : {};
    } catch {
      return {};
    }
  }

  private loadEnvConfig(): Partial<MergedConfig> {
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

/**
 * Reset the global singleton (useful for testing).
 */
export function resetConfigService(): void {
  _instance = null;
}
