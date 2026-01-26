import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult } from '../types';
/**
 * Google CLI 适配器
 * 支持 Gemini 系列模型
 */
export declare class GoogleAdapter extends BaseAdapter {
    name: string;
    version: string;
    provider: string;
    capabilities: ModelCapabilities;
    /**
     * 健康检查：检查 gcloud CLI 是否安装
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
     * 解析 Google CLI 输出
     */
    private parseGoogleOutput;
}
