import { ModelStats, SupervisorConfig, RoutingStrategy, DomainHealth } from './types';
/**
 * 监督器 (Supervisor)
 * 负责监控系统全局状态并根据预设 Triggers 执行纠偏动作（如切换策略）
 */
export declare class ModelSupervisor {
    private config;
    constructor(config: SupervisorConfig);
    /**
     * 根据当前统计数据评估是否需要切换策略
     * @returns 建议采取的目标策略，若不需要切换则返回 null
     */
    evaluate(allStats: Map<string, ModelStats>, domainHealth: Map<string, DomainHealth>, currentStrategy: RoutingStrategy): RoutingStrategy | null;
    private checkCondition;
    /**
     * 获取默认的监督配置
     */
    static getDefaultConfig(): SupervisorConfig;
}
