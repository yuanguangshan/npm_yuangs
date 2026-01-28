import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult } from '../types';
/**
 * Gemini CLI 适配器
 * 支持 Gemini 系列模型
 * 使用 https://github.com/google-gemini/gemini-cli
 */
export declare class GoogleAdapter extends BaseAdapter {
    name: string;
    version: string;
    provider: string;
    failureDomain: string;
    capabilities: ModelCapabilities;
    private getApiKey;
    /**
     * 健康检查：检查 Gemini CLI 是否安装并已配置
     */
    healthCheck(): Promise<boolean>;
    /**
     * 执行任务
     */
    execute(prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /**
     * 根据任务类型选择模型
     */
    private selectModel;
    /**
     * 解析 Gemini CLI 输出
     */
    private parseGeminiOutput;
}
