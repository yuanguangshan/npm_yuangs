import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats, DomainHealth, PolicyDsl } from '../types';
import { BasePolicy } from './BasePolicy';
import { ScoredCandidate } from './types';
/**
 * 通用 DSL 驱动策略
 * 通过配置权重和 Gate 规则来定义路由行为
 */
export declare class DslPolicy extends BasePolicy {
    private dsl;
    constructor(dsl: PolicyDsl);
    get name(): string;
    get description(): string;
    /**
     * 实现 DSL 驱动的 Gate 过滤
     */
    protected gate(adapters: ModelAdapter[], task: TaskConfig, modelStats: Map<string, ModelStats>, domainHealthMap: Map<string, DomainHealth>): Promise<ModelAdapter[]>;
    /**
     * 实现 DSL 驱动的加权评分
     */
    protected score(adapters: ModelAdapter[], task: TaskConfig, config: RoutingConfig, modelStats: Map<string, ModelStats>): ScoredCandidate[];
}
