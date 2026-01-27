import {
    SupervisorConfig,
    RoutingStrategy,
    SupervisorContext,
    ActionType
} from './types';
import { MetricsSnapshot } from '../metrics/MetricsCollector';
import { SupervisorAction } from '../observability/SupervisorActionLog';

/**
 * 监督决策结果封装
 */
export interface SupervisorDecision {
    action: SupervisorAction;
    /** 为 Context 提供的更新补丁 */
    contextPatch: Partial<SupervisorContext>;
}

/**
 * 监督器 (Supervisor) v3 - 控制面
 * 
 * 特性：
 * 1. 纯函数决策 (基于 Snapshot + Context)
 * 2. 连续命中过滤 (Hysteresis/Trigger Counts)
 * 3. 动态冷却期 (Cooldown)
 * 4. 可复盘的数据结构 (JSON-native)
 */
export class ModelSupervisor {
    private config: SupervisorConfig;

    constructor(config: SupervisorConfig) {
        this.config = config;
    }

    /**
     * 核心决策评估函数 (Replayable)
     */
    evaluate(
        snapshot: MetricsSnapshot,
        ctx: SupervisorContext,
        currentStrategy: RoutingStrategy
    ): SupervisorDecision {
        const nextHitCounts = { ...(ctx.triggerHitCounts || {}) };

        if (!this.config.enabled) {
            return { action: this.noop('Supervisor disabled'), contextPatch: {} };
        }

        // 1. 冷却期检查
        if (ctx.cooldownUntil && ctx.now < ctx.cooldownUntil) {
            return { action: this.noop('Cooldown active'), contextPatch: {} };
        }

        // 2. 依次检查 Triggers
        for (const trigger of this.config.triggers) {
            let metricValue = 0;

            switch (trigger.metric) {
                case 'global_latency':
                    metricValue = snapshot.globalLatencyEMA;
                    break;
                case 'global_success_rate':
                    metricValue = snapshot.globalSuccessRateEMA;
                    break;
                case 'domain_error_rate':
                    const openDomains = Array.from(snapshot.domainHealth.values()).filter(d => d.state === 'open').length;
                    metricValue = openDomains / Math.max(snapshot.domainHealth.size, 1);
                    break;
            }

            if (this.checkCondition(metricValue, trigger.operator, trigger.threshold)) {
                const currentHits = (nextHitCounts[trigger.id] || 0) + 1;
                nextHitCounts[trigger.id] = currentHits;

                if (currentHits >= (trigger.hysteresisCount || 1)) {
                    if (currentStrategy === trigger.action.targetStrategy) continue;

                    const confidence = this.computeConfidence(metricValue, trigger.threshold);
                    const baseCooldown = trigger.cooldownMs || this.config.baseCooldownMs || 30000;
                    const dynamicCooldown = Math.round(baseCooldown * (1 / Math.max(confidence, 0.1)));

                    // 决策达成，该触发器计数清零
                    nextHitCounts[trigger.id] = 0;

                    const action: SupervisorAction = {
                        type: ActionType.SWITCH_STRATEGY,
                        targetStrategy: trigger.action.targetStrategy,
                        reason: `Trigger[${trigger.id}] fired: ${trigger.metric}(${metricValue.toFixed(2)}) ${trigger.operator} ${trigger.threshold} (Confidence: ${confidence.toFixed(2)})`,
                    };

                    return {
                        action,
                        contextPatch: {
                            cooldownUntil: ctx.now + dynamicCooldown,
                            triggerHitCounts: nextHitCounts,
                            lastAction: {
                                type: action.type,
                                targetStrategy: action.targetStrategy,
                                timestamp: ctx.now
                            }
                        }
                    };
                }
            } else {
                nextHitCounts[trigger.id] = 0;
            }
        }

        return {
            action: this.noop('Steady state'),
            contextPatch: { triggerHitCounts: nextHitCounts }
        };
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

    private computeConfidence(value: number, threshold: number): number {
        const diff = Math.abs(value - threshold);
        return Math.min(diff / (threshold || 1), 1.0);
    }

    private noop(reason: string): SupervisorAction {
        return {
            type: ActionType.NOOP,
            reason
        };
    }

    static getDefaultConfig(): SupervisorConfig {
        return {
            enabled: true,
            baseCooldownMs: 30000,
            triggers: [
                {
                    id: 'critical_latency_spike',
                    metric: 'global_latency',
                    operator: '>',
                    threshold: 5000,
                    hysteresisCount: 3,
                    action: {
                        type: ActionType.SWITCH_STRATEGY,
                        targetStrategy: RoutingStrategy.FASTEST_FIRST
                    }
                },
                {
                    id: 'severe_success_drop',
                    metric: 'global_success_rate',
                    operator: '<',
                    threshold: 0.6,
                    hysteresisCount: 2,
                    action: {
                        type: ActionType.SWITCH_STRATEGY,
                        targetStrategy: RoutingStrategy.CHEAPEST_FIRST
                    }
                }
            ]
        };
    }
}
