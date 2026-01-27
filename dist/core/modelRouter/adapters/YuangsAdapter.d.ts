import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult } from '../types';
/**
 * Yuangs 内部适配器
 * 调用 yuangs 自带的 AI 客户端，通常对应配置文件中的 "Assistant" 模型
 */
export declare class YuangsAdapter extends BaseAdapter {
    name: string;
    version: string;
    provider: string;
    capabilities: ModelCapabilities;
    isAvailable(): Promise<boolean>;
    healthCheck(): Promise<boolean>;
    execute(prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
}
