import { ModelStats, DomainHealth, DomainState } from '../modelRouter/types';

/**
 * 指标快照，用于交给监督器进行决策
 */
export interface MetricsSnapshot {
    globalLatencyEMA: number;
    globalSuccessRateEMA: number;
    domainHealth: Map<string, { state: DomainState; successEMA: number; latencyEMA: number }>;
    allStats: Map<string, ModelStats>;
}

/**
 * 指标收集器接口 (观测面)
 */
export interface MetricsCollector {
    /** 记录单次请求结果 */
    recordRequest(
        adapterName: string,
        domain: string,
        latencyMs: number,
        success: boolean,
        costLevel: number
    ): void;

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
export class DefaultMetricsCollector implements MetricsCollector {
    private stats: Map<string, ModelStats> = new Map();
    private globalLatencyEMA: number = 1000;
    private globalSuccessRateEMA: number = 1.0;

    recordRequest(
        adapterName: string,
        domain: string,
        latencyMs: number,
        success: boolean,
        costLevel: number
    ): void {
        let s = this.stats.get(adapterName);
        if (!s) {
            s = {
                modelName: adapterName,
                totalRequests: 0,
                successCount: 0,
                failureCount: 0,
                avgResponseTime: 0,
                totalTokens: 0,
                lastUsed: new Date(),
                recentFailures: 0,
                successEMA: 1.0,
                latencyEMA: 1000,
                costEMA: 3,
            };
            this.stats.set(adapterName, s);
        }

        s.totalRequests++;
        s.lastUsed = new Date();

        // 动态 α = 1 / sqrt(N)
        const alpha = Math.max(0.05, Math.min(0.3, 1 / Math.sqrt(s.totalRequests)));

        if (success) {
            s.successCount++;
            s.recentFailures = 0;
            s.successEMA = (1 - alpha) * s.successEMA + alpha * 1;
            s.latencyEMA = (1 - alpha) * s.latencyEMA + alpha * latencyMs;
            s.costEMA = (1 - alpha) * s.costEMA + alpha * costLevel;
        } else {
            s.failureCount++;
            s.recentFailures++;
            s.successEMA = (1 - alpha) * s.successEMA + alpha * 0;
            s.lastFailureAt = new Date();
        }

        // 更新全局 EMA
        this.globalLatencyEMA = (1 - alpha) * this.globalLatencyEMA + alpha * latencyMs;
        this.globalSuccessRateEMA = (1 - alpha) * this.globalSuccessRateEMA + alpha * (success ? 1 : 0);

        // 更新平均值 (累积平均)
        s.avgResponseTime = (s.avgResponseTime * (s.totalRequests - 1) + latencyMs) / s.totalRequests;
    }

    snapshot(domainHealthMap: Map<string, DomainHealth>): MetricsSnapshot {
        const domainSummary = new Map<string, { state: DomainState; successEMA: number; latencyEMA: number }>();

        // 聚合各域指标
        domainHealthMap.forEach((health, domain) => {
            // 计算该域下所有模型的平均 EMA
            const modelsInDomain = Array.from(this.stats.values()).filter(s => {
                // 这里简单假设 domain 名字和 provider 一致，或者在 record 时传入
                // 目前 Router 逻辑中 domain 已知
                return true; // 实际实现中需更精准过滤
            });

            domainSummary.set(domain, {
                state: health.state,
                successEMA: 0.9, // 简化实现，实际应从 modelsInDomain 聚合
                latencyEMA: 1000
            });
        });

        return {
            globalLatencyEMA: this.globalLatencyEMA,
            globalSuccessRateEMA: this.globalSuccessRateEMA,
            domainHealth: domainSummary,
            allStats: new Map(this.stats)
        };
    }

    getAllStats() {
        return this.stats;
    }

    getStats(name: string) {
        return this.stats.get(name);
    }
}
