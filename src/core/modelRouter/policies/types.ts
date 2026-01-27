import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats, DomainHealth } from '../types';

export interface ScoredCandidate {
    adapter: ModelAdapter;
    score: number;
    reason: string;
}

export interface PolicyResult {
    adapter: ModelAdapter;
    reason: string;
    candidates: Array<{ name: string; score: number; reason: string }>;
}

export interface RoutingPolicy {
    name: string;
    description: string;
    select(
        adapters: ModelAdapter[],
        taskConfig: TaskConfig,
        routingConfig: RoutingConfig,
        modelStats: Map<string, ModelStats>,
        domainHealth: Map<string, DomainHealth>
    ): Promise<PolicyResult>;
}
