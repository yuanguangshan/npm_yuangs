import { ModelStats, DomainHealth, DomainState } from '../modelRouter/types';
/**
 * 指标快照，用于交给监督器进行决策
 */
export interface MetricsSnapshot {
    globalLatencyEMA: number;
    globalSuccessRateEMA: number;
    domainHealth: Map<string, {
        state: DomainState;
        successEMA: number;
        latencyEMA: number;
    }>;
    allStats: Map<string, ModelStats>;
}
/**
 * 指标收集器接口 (观测面)
 */
export interface MetricsCollector {
    /** 记录单次请求结果 */
    recordRequest(adapterName: string, domain: string, latencyMs: number, success: boolean, costLevel: number): void;
    /** 获取当前系统指标快照 */
    snapshot(domainHealthMap: Map<string, DomainHealth>): MetricsSnapshot;
    /** 获取所有统计数据 (Router 兼容旧接口) */
    getAllStats(): Map<string, ModelStats>;
    /** 获取特定模型统计 */
    getStats(name: string): ModelStats | undefined;
}
/**
 * 默认指标收集器实现
 * 采用动态 Alpha 指数移动平均 (EMA)
 */
export declare class DefaultMetricsCollector implements MetricsCollector {
    private stats;
    private globalLatencyEMA;
    private globalSuccessRateEMA;
    recordRequest(adapterName: string, domain: string, latencyMs: number, success: boolean, costLevel: number): void;
    snapshot(domainHealthMap: Map<string, DomainHealth>): MetricsSnapshot;
    getAllStats(): Map<string, ModelStats>;
    getStats(name: string): ModelStats | undefined;
}
