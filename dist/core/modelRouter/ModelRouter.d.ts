import { ModelAdapter, TaskConfig, RoutingConfig, RoutingResult, ModelExecutionResult, ModelStats } from './types';
/**
 * 模型路由器
 * 负责根据任务配置和路由策略选择合适的模型适配器
 */
export declare class ModelRouter {
    private adapters;
    private stats;
    private roundRobinIndex;
    /**
     * 注册模型适配器
     */
    registerAdapter(adapter: ModelAdapter): void;
    /**
     * 注销模型适配器
     */
    unregisterAdapter(adapterName: string): boolean;
    /**
     * 获取所有已注册的适配器
     */
    getAdapters(): ModelAdapter[];
    /**
     * 获取模型统计信息
     */
    getStats(modelName?: string): ModelStats | ModelStats[];
    /**
     * 路由任务到合适的模型
     */
    route(taskConfig: TaskConfig, routingConfig: RoutingConfig): Promise<RoutingResult>;
    /**
     * 执行任务（带统计）
     */
    executeTask(adapter: ModelAdapter, prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /**
     * 获取可用的适配器
     */
    private getAvailableAdapters;
    /**
     * 基于能力选择模型
     */
    private selectByCapabilities;
    /**
     * 轮询选择
     */
    private selectRoundRobin;
    /**
     * 选择最快的模型
     */
    private selectFastest;
    /**
     * 选择成本最低的模型
     */
    private selectCheapest;
    /**
     * 选择质量最好的模型
     */
    private selectBestQuality;
    /**
     * 获取选择原因
     */
    private getReasonForSelection;
    /**
     * 创建空统计信息
     */
    private createEmptyStats;
}
