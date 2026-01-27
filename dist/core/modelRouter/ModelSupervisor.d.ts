import { SupervisorConfig, RoutingStrategy } from './types';
import { MetricsSnapshot } from '../metrics/MetricsCollector';
import { SupervisorAction } from '../observability/SupervisorActionLog';
/**
 * 监督器 (Supervisor) - 控制面
 * 基于纯函数决策模型，负责分析指标并建议纠偏动作
 */
export declare class ModelSupervisor {
    private config;
    constructor(config: SupervisorConfig);
    /**
     * 评估系统态势并决定是否产生 Action
     */
    evaluate(snapshot: MetricsSnapshot, currentStrategy: RoutingStrategy): SupervisorAction | null;
    private checkCondition;
    /**
     * 系统级默认应急预案
     */
    static getDefaultConfig(): SupervisorConfig;
}
