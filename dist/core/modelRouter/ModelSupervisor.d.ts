import { SupervisorConfig, RoutingStrategy, SupervisorContext } from './types';
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
export declare class ModelSupervisor {
    private config;
    constructor(config: SupervisorConfig);
    /**
     * 核心决策评估函数 (Replayable)
     */
    evaluate(snapshot: MetricsSnapshot, ctx: SupervisorContext, currentStrategy: RoutingStrategy): SupervisorDecision;
    private checkCondition;
    private computeConfidence;
    private noop;
    static getDefaultConfig(): SupervisorConfig;
}
