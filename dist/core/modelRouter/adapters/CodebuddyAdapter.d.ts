import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult } from '../types';
/**
 * Codebuddy CLI 适配器
 * 专门用于代码相关的任务
 */
export declare class CodebuddyAdapter extends BaseAdapter {
    name: string;
    version: string;
    provider: string;
    capabilities: ModelCapabilities;
    /**
     * 健康检查：检查 codebuddy CLI 是否安装
     */
    healthCheck(): Promise<boolean>;
    /**
     * 执行任务
     */
    execute(prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /**
     * 根据任务类型添加特定的 args
     */
    private addTaskSpecificArgs;
    /**
     * 解析 Codebuddy CLI 输出
     */
    private parseCodebuddyOutput;
}
