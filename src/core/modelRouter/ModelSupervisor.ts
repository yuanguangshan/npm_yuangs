import {
    ModelStats,
    SupervisorConfig,
    RoutingStrategy,
    SupervisorTrigger,
    DomainHealth
} from './types';

/**
 * 监督器 (Supervisor)
 * 负责监控系统全局状态并根据预设 Triggers 执行纠偏动作（如切换策略）
 */
export class ModelSupervisor {
    private config: SupervisorConfig;

    constructor(config: SupervisorConfig) {
        this.config = config;
    }

    /**
     * 根据当前统计数据评估是否需要切换策略
     * @returns 建议采取的目标策略，若不需要切换则返回 null
     */
    evaluate(
        allStats: Map<string, ModelStats>,
        domainHealth: Map<string, DomainHealth>,
        currentStrategy: RoutingStrategy
    ): RoutingStrategy | null {
        if (!this.config.enabled) return null;

        // 计算全局 EMA 指标
        const statsArray = Array.from(allStats.values());
        if (statsArray.length === 0) return null;

        const globalLatency = statsArray.reduce((sum, s) => sum + s.latencyEMA, 0) / statsArray.length;
        const globalSuccess = statsArray.reduce((sum, s) => sum + s.successEMA, 0) / statsArray.length;

        for (const trigger of this.config.triggers) {
            let metricValue = 0;

            switch (trigger.metric) {
                case 'global_latency':
                    metricValue = globalLatency;
                    break;
                case 'global_success_rate':
                    metricValue = globalSuccess;
                    break;
                case 'google_domain_error':
                    // 示例：检查 google 域名下的整体稳定性
                    const googleHealth = domainHealth.get('google');
                    metricValue = (googleHealth?.state === 'open') ? 1 : 0;
                    break;
            }

            if (this.checkCondition(metricValue, trigger.operator, trigger.threshold)) {
                // 如果当前策略已经目标策略，则跳过
                if (currentStrategy === trigger.action.targetStrategy) continue;

                console.warn(`[Supervisor] 触发条件 [${trigger.id}]: ${trigger.metric}(${metricValue.toFixed(2)}) ${trigger.operator} ${trigger.threshold}`);
                return trigger.action.targetStrategy;
            }
        }

        return null;
    }

    private checkCondition(value: number, operator: string, threshold: number): boolean {
        switch (operator) {
            case '>': return value > threshold;
            case '<': return value < threshold;
            case '>=': return value >= threshold;
            case '<=': return value <= threshold;
            default: return false;
        }
    }

    /**
     * 获取默认的监督配置
     */
    static getDefaultConfig(): SupervisorConfig {
        return {
            enabled: true,
            triggers: [
                {
                    id: 'high_latency_circuit_breaker',
                    metric: 'global_latency',
                    operator: '>',
                    threshold: 5000, // 全局延迟超过 5s
                    action: {
                        type: 'switch_strategy',
                        targetStrategy: RoutingStrategy.FASTEST_FIRST
                    }
                },
                {
                    id: 'severe_success_rate_drop',
                    metric: 'global_success_rate',
                    operator: '<',
                    threshold: 0.5, // 整体成功率低于 50%
                    action: {
                        type: 'switch_strategy',
                        targetStrategy: RoutingStrategy.CHEAPEST_FIRST // 回退到稳健/廉价模型
                    }
                }
            ]
        };
    }
}
