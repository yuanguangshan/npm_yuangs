import { ModelAdapter, TaskConfig, RoutingConfig, RoutingResult, ModelExecutionResult, ModelStats } from './types';
import { RoutingPolicy } from './policies/types';
/**
 * 模型路由器
 * 负责根据任务配置和路由策略选择合适的模型适配器
 */
export declare class ModelRouter {
    private adapters;
    private stats;
    private policies;
    private roundRobinIndex;
    constructor();
    /**
     * 注册默认策略
     */
    private registerDefaultPolicies;
    /**
     * 注册路由策略
     */
    registerPolicy(policy: RoutingPolicy): void;
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
     * 获取所有已注册的策略
     */
    getPolicies(): RoutingPolicy[];
    /**
     * 获取模型统计信息
     */
    getStats(modelName?: string): ModelStats | ModelStats[];
    /**
     * 路由任务到合适的模型
     */
    route(taskConfig: TaskConfig, routingConfig: RoutingConfig): Promise<RoutingResult>;
    /**
     * 执行策略
     */
    private executePolicy;
    /**
     * 执行任务（带统计）
     */
    executeTask(adapter: ModelAdapter, prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /**
     * 获取可用的适配器
     */
    private getAvailableAdapters;
    /**
     * 轮询选择
     */
    private selectRoundRobin;
    /**
     * 创建空统计信息
     */
    private createEmptyStats;
}
