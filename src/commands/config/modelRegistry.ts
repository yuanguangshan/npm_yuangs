import chalk from 'chalk';

/**
 * 支持的 AI 模型列表
 */
export const SUPPORTED_MODELS = [
    // OpenAI Models
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',

    // Claude Models
    'claude-3.5-sonnet',
    'claude-3.5-haiku',

    // Gemini Models
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',

    // Legacy
    'Assistant'
] as const;

export type SupportedModel = typeof SUPPORTED_MODELS[number];

/**
 * 模型元数据
 */
export interface ModelMetadata {
    name: string;
    provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Legacy';
    category: 'pro' | 'flash' | 'turbo' | 'mini' | 'haiku';
    description: string;
    recommended?: boolean;
}

/**
 * 模型元数据映射
 */
const MODEL_METADATA: Record<SupportedModel, ModelMetadata> = {
    'gpt-4o': {
        name: 'GPT-4o',
        provider: 'OpenAI',
        category: 'pro',
        description: 'OpenAI 最先进的 GPT-4 模型',
        recommended: true
    },
    'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        category: 'mini',
        description: 'GPT-4o 的轻量版本',
    },
    'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        category: 'turbo',
        description: 'GPT-4 的快速版本',
    },
    'claude-3.5-sonnet': {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        category: 'pro',
        description: 'Anthropic 的高性能模型',
    },
    'claude-3.5-haiku': {
        name: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        category: 'haiku',
        description: 'Claude 的快速响应模型',
    },
    'gemini-2.5-flash': {
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        category: 'flash',
        description: 'Google 的快速响应模型',
    },
    'gemini-2.5-flash-lite': {
        name: 'Gemini 2.5 Flash Lite',
        provider: 'Google',
        category: 'flash',
        description: 'Gemini 2.5 的超轻量版本',
    },
    'gemini-3-flash-preview': {
        name: 'Gemini 3 Flash Preview',
        provider: 'Google',
        category: 'flash',
        description: 'Gemini 3 预览版',
    },
    'gemini-2.5-pro': {
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        category: 'pro',
        description: 'Google 的高性能模型',
    },
    'Assistant': {
        name: 'Assistant',
        provider: 'Legacy',
        category: 'pro',
        description: '默认助手模型',
    }
};

/**
 * 检查模型是否支持
 */
export function isSupportedModel(model: string): model is SupportedModel {
    return (SUPPORTED_MODELS as readonly string[]).includes(model);
}

/**
 * 获取模型元数据
 */
export function getModelMetadata(model: SupportedModel): ModelMetadata {
    return MODEL_METADATA[model];
}

/**
 * 列出所有可用模型
 */
export function listAvailableModels(): string {
    const byProvider: Record<string, SupportedModel[]> = {};

    for (const model of SUPPORTED_MODELS) {
        const meta = MODEL_METADATA[model];
        if (!byProvider[meta.provider]) {
            byProvider[meta.provider] = [];
        }
        byProvider[meta.provider].push(model);
    }

    let output = chalk.bold.cyan('\n🤖 可用 AI 模型\n\n');

    for (const [provider, models] of Object.entries(byProvider)) {
        output += chalk.yellow(`${provider}:\n`);
        for (const model of models) {
            const meta = MODEL_METADATA[model];
            const recommended = meta.recommended ? chalk.green(' ⭐ 推荐') : '';
            const prefix = meta.recommended ? '  *' : '   ';
            output += `${prefix} ${chalk.white(model.padEnd(25))} ${chalk.gray(meta.description)}${recommended}\n`;
        }
        output += '\n';
    }

    return output;
}

/**
 * 获取默认模型（推荐）
 */
export function getDefaultModel(): SupportedModel {
    return 'gemini-2.5-flash-lite';
}
