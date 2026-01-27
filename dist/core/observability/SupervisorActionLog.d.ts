import { RoutingStrategy, ActionType } from '../modelRouter/types';
/**
 * 监督器执行动作
 */
export interface SupervisorAction {
    type: ActionType;
    targetStrategy?: RoutingStrategy;
    reason: string;
}
/**
 * 監督器执行日志 schema
 *
 * 用于 100% 还原决策现场，支持离线回放 (Incident Replay)
 */
export interface SupervisorActionLog {
    /** 唯一事件 ID */
    eventId: string;
    /** 事件发生时间 */
    timestamp: number;
    /** 触发的 action */
    action: SupervisorAction;
    /** 执行前后的策略 */
    previousStrategy: RoutingStrategy;
    currentStrategy: RoutingStrategy;
    /** 触发时的关键指标快照 */
    snapshot: {
        globalLatencyEMA: number;
        globalSuccessRateEMA: number;
        domainHealth: Record<string, {
            state: string;
            successEMA?: number;
            latencyEMA?: number;
        }>;
    };
}
/**
 * 监督器日志记录器接口
 */
export interface SupervisorActionLogger {
    log(event: SupervisorActionLog): void;
}
/**
 * 控制台日志记录器实现
 */
export declare class ConsoleSupervisorActionLogger implements SupervisorActionLogger {
    log(event: SupervisorActionLog): void;
}
