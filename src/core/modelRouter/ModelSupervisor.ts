import {
    SupervisorConfig,
    RoutingStrategy,
} from './types';
import { MetricsSnapshot } from '../metrics/MetricsCollector';
import { SupervisorAction } from '../observability/SupervisorActionLog';

/**
 * 监督器 (Supervisor) - 控制面
 * 基于纯函数决策模型，负责分析指标并建议纠偏动作
 */
export class ModelSupervisor {
    private config: SupervisorConfig;

    constructor(config: SupervisorConfig) {
        this.config = config;
    }

    /**
     * 评估系统态势并决定是否产生 Action
     */
    evaluate(
        snapshot: MetricsSnapshot,
        currentStrategy: RoutingStrategy
    ): SupervisorAction | null {
        if (!this.config.enabled) return null;

        const { globalLatencyEMA, globalSuccessRateEMA, domainHealth } = snapshot;

        for (const trigger of this.config.triggers) {
            let metricValue = 0;

            switch (trigger.metric) {
                case 'global_latency':
                    metricValue = globalLatencyEMA;
                    break;
                case 'global_success_rate':
                    metricValue = globalSuccessRateEMA;
                    break;
                case 'google_domain_error':
                    const googleHealth = domainHealth.get('google');
                    metricValue = (googleHealth?.state === 'open') ? 1 : 0;
                    break;
            }

            if (this.checkCondition(metricValue, trigger.operator, trigger.threshold)) {
                // 如果当前策略已经目标策略，则跳过
                if (currentStrategy === trigger.action.targetStrategy) continue;

                return {
                    type: 'switch_strategy',
                    targetStrategy: trigger.action.targetStrategy,
                    reason: `Trigger[${trigger.id}] fired: ${trigger.metric}(${metricValue.toFixed(2)}) ${trigger.operator} ${trigger.threshold}`
                };
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
     * 系统级默认应急预案
     */
    static getDefaultConfig(): SupervisorConfig {
        return {
            enabled: true,
            triggers: [
                {
                    id: 'high_latency_circuit_breaker',
                    metric: 'global_latency',
                    operator: '>',
                    threshold: 5000,
                    action: {
                        type: 'switch_strategy',
                        targetStrategy: RoutingStrategy.FASTEST_FIRST
                    }
                },
                {
                    id: 'severe_success_rate_drop',
                    metric: 'global_success_rate',
                    operator: '<',
                    threshold: 0.5,
                    action: {
                        type: 'switch_strategy',
                        targetStrategy: RoutingStrategy.CHEAPEST_FIRST
                    }
                }
            ]
        };
    }
}
