import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult } from '../types';
import { AIRequestMessage } from '../../../core/validation';
/**
 * Qwen CLI 适配器
 * 支持通义千问系列模型
 */
export declare class QwenAdapter extends BaseAdapter {
    name: string;
    version: string;
    provider: string;
    capabilities: ModelCapabilities;
    /**
     * 健康检查：检查 qwen CLI 是否安装
     */
    healthCheck(): Promise<boolean>;
    /**
     * 执行任务
     */
    execute(prompt: string | AIRequestMessage[], config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /**
     * 根据任务类型选择模型
     */
    private selectModel;
    /**
     * 解析 Qwen CLI 输出
     */
    private parseQwenOutput;
}
