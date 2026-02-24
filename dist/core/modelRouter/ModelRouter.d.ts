import { AIRequestMessage } from '../../core/validation';
import { ModelAdapter, TaskConfig, RoutingConfig, RoutingResult, RoutingStrategy, ModelExecutionResult, ModelStats, SupervisorConfig } from './types';
import { RoutingPolicy } from './policies/types';
import { MetricsCollector } from '../metrics/MetricsCollector';
import { SupervisorActionLogger } from '../observability/SupervisorActionLog';
import { AdaptiveWeights } from './AdaptiveWeights';
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
    private adaptiveWeights;
    private roundRobinIndex;
    private supervisorContext;
    constructor(supervisorConfig?: SupervisorConfig, metrics?: MetricsCollector, logger?: SupervisorActionLogger, adaptiveWeights?: AdaptiveWeights);
    private registerDefaultPolicies;
    registerPolicy(policy: RoutingPolicy): void;
    registerAdapter(adapter: ModelAdapter): void;
    unregisterAdapter(adapterName: string): boolean;
    getAdapters(): ModelAdapter[];
    getPolicies(): RoutingPolicy[];
    getStats(modelName?: string): ModelStats | ModelStats[];
    route(taskConfig: TaskConfig, routingConfig: RoutingConfig): Promise<RoutingResult>;
    private executePolicyWithExploration;
    executeTask(adapter: ModelAdapter, prompt: string | AIRequestMessage[], config: TaskConfig, onChunk?: (chunk: string) => void, strategy?: RoutingStrategy): Promise<ModelExecutionResult>;
    private getAvailableAdapters;
    private selectRoundRobin;
    private updateDomainHealthStates;
    /**
     * 计算域的平均成功率
     */
    private calculateDomainAverageSuccessRate;
    private isAdapterAllowedByCircuitBreaker;
    /**
     * 计算半开状态的流量通过比例
     *
     * 策略: 基于最近的成功率动态调整
     * - 成功率 < 30%: 0% 流量 (继续熔断)
     * - 成功率 30-50%: 10% 流量
     * - 成功率 50-70%: 30% 流量
     * - 成功率 70-90%: 50% 流量
     * - 成功率 > 90%: 100% 流量 (恢复到 closed)
     */
    private calculateHalfOpenPassRate;
    private calculateUCB1;
    private createEmptyStats;
    /**
     * 应用自适应权重到所有策略
     */
    private applyLearnedWeights;
    /**
     * 根据策略获取对应的策略名称
     */
    private getPolicyName;
    /**
     * 记录执行结果用于自适应学习
     */
    private recordExecutionOutcome;
    /**
     * 获取自适应权重统计
     */
    getAdaptiveWeightsStats(): Record<string, {
        currentWeights: any;
        sampleCount: number;
        avgReward: number;
        improvement: number;
    }>;
    /**
     * 重置自适应权重
     */
    resetAdaptiveWeights(strategy?: RoutingStrategy): void;
}
