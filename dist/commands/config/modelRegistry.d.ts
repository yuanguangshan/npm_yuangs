/**
 * 支持的 AI 模型列表
 */
export declare const SUPPORTED_MODELS: readonly ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "claude-3.5-sonnet", "claude-3.5-haiku", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-pro", "gemini-2.5-flash", "Assistant"];
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
 * 检查模型是否支持
 */
export declare function isSupportedModel(model: string): model is SupportedModel;
/**
 * 获取模型元数据
 */
export declare function getModelMetadata(model: SupportedModel): ModelMetadata;
/**
 * 列出所有可用模型
 */
export declare function listAvailableModels(): string;
/**
 * 获取默认模型（推荐）
 */
export declare function getDefaultModel(): SupportedModel;
