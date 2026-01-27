import { ModelAdapter, TaskConfig, RoutingConfig, ModelStats, DomainHealth } from '../types';
import { RoutingPolicy, PolicyResult, ScoredCandidate } from './types';

export abstract class BasePolicy implements RoutingPolicy {
    abstract name: string;
    abstract description: string;

    async select(
        adapters: ModelAdapter[],
        taskConfig: TaskConfig,
        routingConfig: RoutingConfig,
        modelStats: Map<string, ModelStats>,
        domainHealth: Map<string, DomainHealth>
    ): Promise<PolicyResult> {
        // 1. Gate (Filter) - 硬约束 (包含故障域隔离)
        const candidates = await this.gate(adapters, taskConfig, modelStats, domainHealth);

        if (candidates.length === 0) {
            throw new Error('没有可用的模型（已被 Gate 过滤，可能触发了故障域保护）');
        }

        // 2. Score (Sort) - 软排序
        const scoredCandidates = this.score(candidates, taskConfig, routingConfig, modelStats);

        if (scoredCandidates.length === 0) {
            throw new Error('评分后没有合适的模型');
        }

        // 按分数降序排序
        scoredCandidates.sort((a, b) => b.score - a.score);

        const selected = scoredCandidates[0];

        return {
            adapter: selected.adapter,
            reason: selected.reason,
            candidates: scoredCandidates.map((c) => ({
                name: c.adapter.name,
                score: c.score,
                reason: c.reason,
            })),
        };
    }

    /**
     * Gate 阶段：过滤掉不符合硬性要求的模型，包含故障域识别
     */
    protected async gate(
        adapters: ModelAdapter[],
        task: TaskConfig,
        modelStats: Map<string, ModelStats>,
        domainHealthMap: Map<string, DomainHealth>
    ): Promise<ModelAdapter[]> {
        const passedAdapters: ModelAdapter[] = [];

        // 并行检查可用性
        const availabilityResults = await Promise.all(
            adapters.map(async (adapter) => ({
                adapter,
                available: await adapter.isAvailable(),
            }))
        );

        for (const { adapter, available } of availabilityResults) {
            if (!available) continue;

            const domain = adapter.failureDomain ?? adapter.provider;
            const health = domainHealthMap.get(domain);

            // 熔断保护过滤
            if (health) {
                if (health.state === 'open') continue;
                if (health.state === 'half-open') {
                    // Half-open 仅允许 10% 探测流量通过 Gate
                    if (Math.random() >= 0.1) continue;
                }
            }

            // 检查上下文窗口
            if (task.contextSize && adapter.capabilities.maxContextWindow < task.contextSize) {
                continue;
            }

            // 检查任务类型支持
            if (!adapter.capabilities.supportedTaskTypes.includes(task.type)) {
                continue;
            }

            passedAdapters.push(adapter);
        }

        return passedAdapters;
    }

    /**
     * Score 阶段：对通过 Gate 的模型进行打分
     */
    protected abstract score(
        adapters: ModelAdapter[],
        task: TaskConfig,
        config: RoutingConfig,
        modelStats: Map<string, ModelStats>
    ): ScoredCandidate[];
}
