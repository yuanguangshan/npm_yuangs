import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ConfigError } from './errors';
import { logger } from '../utils/Logger';

export interface YuangsConfig {
    git?: {
        auto?: {
            model?: string;
            maxTasks?: number;
            minScore?: number;
            autoCommit?: boolean;
            reviewLevel?: 'quick' | 'standard' | 'deep';
        };
        reviewThreshold?: number;
    };
    ui?: {
        theme?: 'dark' | 'light' | 'auto';
        showProgress?: boolean;
        useEmoji?: boolean;
    };
    ai?: {
        defaultModel?: string;
        temperature?: number;
        maxTokens?: number;
    };
}

const DEFAULT_CONFIG: YuangsConfig = {
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

const CONFIG_FILES = [
    '.yuangsrc',
    '.yuangsrc.json',
    '.yuangsrc.yaml',
    '.yuangsrc.yml',
    'yuangs.config.json',
];

export class ConfigManager {
    private config: YuangsConfig = DEFAULT_CONFIG;
    private configPath: string | null = null;

    constructor(private cwd: string = process.cwd()) { }

    /**
     * Initialize and load configuration from disk
     */
    public async init(): Promise<void> {
        const configPath = this.findConfigFile();
        if (configPath) {
            this.configPath = configPath;
            await this.loadConfig(configPath);
        }
    }

    private findConfigFile(): string | null {
        for (const file of CONFIG_FILES) {
            const fullPath = path.join(this.cwd, file);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }

        // Check home directory as well
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            for (const file of CONFIG_FILES) {
                const fullPath = path.join(homeDir, file);
                if (fs.existsSync(fullPath)) {
                    return fullPath;
                }
            }
        }

        return null;
    }

    private async loadConfig(filePath: string): Promise<void> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            let parsed: any;

            if (filePath.endsWith('.yaml') || filePath.endsWith('.yml') || !filePath.includes('.')) {
                parsed = yaml.load(content);
            } else {
                parsed = JSON.parse(content);
            }

            this.config = this.deepMerge(DEFAULT_CONFIG, parsed || {});
            logger.debug('Config', `Configuration loaded from ${filePath}`);
        } catch (error: any) {
            throw new ConfigError(`Failed to load config: ${error.message}`, [
                `Check if ${filePath} is a valid JSON or YAML file.`,
            ]);
        }
    }

    private deepMerge(target: any, source: any): any {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    public get<T>(path: string): T {
        const parts = path.split('.');
        let value: any = this.config;
        for (const part of parts) {
            if (value === undefined || value === null) return undefined as any;
            value = value[part];
        }
        return value as T;
    }

    public getAll(): YuangsConfig {
        return this.config;
    }

    public getConfigPath(): string | null {
        return this.configPath;
    }
}

export const configManager = new ConfigManager();
