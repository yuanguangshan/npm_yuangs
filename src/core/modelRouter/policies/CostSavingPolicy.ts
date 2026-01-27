import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats } from '../types';
import { BasePolicy } from './BasePolicy';
import { ScoredCandidate } from './types';

export class CostSavingPolicy extends BasePolicy {
    name = 'cost-saving';
    description = '成本优先策略：优先选择成本最低的模型';

    protected score(
        adapters: ModelAdapter[],
        task: TaskConfig,
        config: RoutingConfig,
        modelStats: Map<string, ModelStats>
    ): ScoredCandidate[] {
        return adapters.map((adapter) => {
            let score = 0;
            let reasons: string[] = [];

            score += (6 - adapter.capabilities.costLevel) * 0.12;
            reasons.push(`成本等级 ${adapter.capabilities.costLevel}`);

            score += 0.2;

            const stats = modelStats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.1;
            } else {
                score += 0.05;
            }

            if (adapter.capabilities.avgResponseTime < 2000) {
                score += 0.1;
            }

            return {
                adapter,
                score,
                reason: reasons.join('; '),
            };
        });
    }
}
