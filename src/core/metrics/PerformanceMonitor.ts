import { logger } from '../../utils/Logger';

export interface PerformanceMetric {
    name: string;
    duration: number; // ms
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
    private static metrics: PerformanceMetric[] = [];

    /**
     * 测量异步函数执行时间
     */
    public static async measure<T>(
        name: string,
        fn: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.record(name, duration, metadata);
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            this.record(`${name}_failed`, duration, { ...metadata, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * 记录性能指标
     */
    private static record(name: string, duration: number, metadata?: Record<string, any>) {
        const metric: PerformanceMetric = {
            name,
            duration,
            timestamp: Date.now(),
            metadata,
        };

        this.metrics.push(metric);

        // 如果执行时间过长，记录一条警告日志
        if (duration > 5000) {
            logger.warn('Performance', `Slow operation detected: ${name}`, { duration: `${duration}ms`, ...metadata });
        } else {
            logger.debug('Performance', `Operation ${name} completed`, { duration: `${duration}ms` });
        }
    }

    /**
     * 获取所有指标汇总
     */
    public static getSummary() {
        const summary: Record<string, { count: number; avg: number; max: number }> = {};

        for (const m of this.metrics) {
            if (!summary[m.name]) {
                summary[m.name] = { count: 0, avg: 0, max: 0 };
            }
            const s = summary[m.name];
            s.avg = (s.avg * s.count + m.duration) / (s.count + 1);
            s.count++;
            s.max = Math.max(s.max, m.duration);
        }

        return summary;
    }
}
