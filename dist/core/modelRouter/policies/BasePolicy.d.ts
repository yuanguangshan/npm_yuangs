import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats, DomainHealth } from '../types';
import { RoutingPolicy, PolicyResult, ScoredCandidate } from './types';
export declare abstract class BasePolicy implements RoutingPolicy {
    abstract name: string;
    abstract description: string;
    select(adapters: ModelAdapter[], taskConfig: TaskConfig, routingConfig: RoutingConfig, modelStats: Map<string, ModelStats>, domainHealth: Map<string, DomainHealth>): Promise<PolicyResult>;
    /**
     * Gate 阶段：过滤掉不符合硬性要求的模型，包含故障域识别
     */
    protected gate(adapters: ModelAdapter[], task: TaskConfig, modelStats: Map<string, ModelStats>, domainHealthMap: Map<string, DomainHealth>): Promise<ModelAdapter[]>;
    /**
     * Score 阶段：对通过 Gate 的模型进行打分
     */
    protected abstract score(adapters: ModelAdapter[], task: TaskConfig, config: RoutingConfig, modelStats: Map<string, ModelStats>): ScoredCandidate[];
}
