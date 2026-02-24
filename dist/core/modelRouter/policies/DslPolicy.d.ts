import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats, DomainHealth, PolicyDsl, PolicyWeights } from '../types';
import { BasePolicy } from './BasePolicy';
import { ScoredCandidate } from './types';
/**
 * 通用 DSL 驱动策略
 * 通过配置权重和 Gate 规则来定义路由行为
 *
 * 支持动态权重: 可通过 overrideWeights() 方法覆盖默认权重
 */
export declare class DslPolicy extends BasePolicy {
    private dsl;
    private dynamicWeights;
    constructor(dsl: PolicyDsl);
    get name(): string;
    get description(): string;
    /**
     * 覆盖默认权重（用于自适应权重系统）
     */
    overrideWeights(weights: PolicyWeights): void;
    /**
     * 重置为默认权重
     */
    resetWeights(): void;
    /**
     * 获取当前使用的权重
     */
    private getWeights;
    /**
     * 实现 DSL 驱动的 Gate 过滤
     */
    protected gate(adapters: ModelAdapter[], task: TaskConfig, modelStats: Map<string, ModelStats>, domainHealthMap: Map<string, DomainHealth>): Promise<ModelAdapter[]>;
    /**
     * 实现 DSL 驱动的加权评分
     */
    protected score(adapters: ModelAdapter[], task: TaskConfig, config: RoutingConfig, modelStats: Map<string, ModelStats>): ScoredCandidate[];
}
