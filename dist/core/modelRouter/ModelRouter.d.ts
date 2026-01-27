import { ModelAdapter, TaskConfig, RoutingConfig, RoutingResult, ModelExecutionResult, ModelStats, SupervisorConfig } from './types';
import { RoutingPolicy } from './policies/types';
import { MetricsCollector } from '../metrics/MetricsCollector';
import { SupervisorActionLogger } from '../observability/SupervisorActionLog';
/**
 * 模型路由器 - 执行面 (Execution Plane)
 * 负责人调配和执行，保持核心逻辑简单
 */
export declare class ModelRouter {
    private adapters;
    private policies;
    private domainHealth;
    private metrics;
    private supervisor;
    private supervisorLogger;
    private roundRobinIndex;
    private activeOverrideStrategy;
    constructor(supervisorConfig?: SupervisorConfig, metrics?: MetricsCollector, logger?: SupervisorActionLogger);
    private registerDefaultPolicies;
    registerPolicy(policy: RoutingPolicy): void;
    registerAdapter(adapter: ModelAdapter): void;
    unregisterAdapter(adapterName: string): boolean;
    getAdapters(): ModelAdapter[];
    getPolicies(): RoutingPolicy[];
    getStats(modelName?: string): ModelStats | ModelStats[];
    route(taskConfig: TaskConfig, routingConfig: RoutingConfig): Promise<RoutingResult>;
    private executePolicyWithExploration;
    executeTask(adapter: ModelAdapter, prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    private getAvailableAdapters;
    private selectRoundRobin;
    private updateDomainHealthStates;
    private isAdapterAllowedByCircuitBreaker;
    private calculateUCB1;
    private createEmptyStats;
}
