import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats, TaskType } from '../types';
import { BasePolicy } from './BasePolicy';
import { ScoredCandidate } from './types';

export class QualityFirstPolicy extends BasePolicy {
    name = 'quality-first';
    description = '质量优先策略：优先选择能力最强、最专业的模型';

    protected score(
        adapters: ModelAdapter[],
        task: TaskConfig,
        config: RoutingConfig,
        modelStats: Map<string, ModelStats>
    ): ScoredCandidate[] {
        return adapters.map((adapter) => {
            let score = 0;
            let reasons: string[] = [];

            if (
                task.type === TaskType.CODE_GENERATION ||
                task.type === TaskType.CODE_REVIEW ||
                task.type === TaskType.DEBUG
            ) {
                if (adapter.capabilities.specialCapabilities?.includes('code-expert')) {
                    score += 0.4;
                    reasons.push('代码专家模型');
                } else {
                    score += 0.2;
                }
            } else {
                if (adapter.capabilities.maxContextWindow > 100000) {
                    score += 0.3;
                    reasons.push('大上下文模型');
                } else {
                    score += 0.15;
                }
            }

            score += adapter.capabilities.costLevel * 0.04;

            score += 0.2;

            const stats = modelStats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.2;
                if (successRate > 0.95) {
                    reasons.push('极其稳定');
                }
            } else {
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
