import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats } from '../types';
import { BasePolicy } from './BasePolicy';
import { ScoredCandidate } from './types';
export declare class CostSavingPolicy extends BasePolicy {
    name: string;
    description: string;
    protected score(adapters: ModelAdapter[], task: TaskConfig, config: RoutingConfig, modelStats: Map<string, ModelStats>): ScoredCandidate[];
}
