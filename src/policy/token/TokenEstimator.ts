import { PendingContextItem, EstimateSummary } from './types';

// 默认并发限制
const DEFAULT_CONCURRENCY = 50;

/**
 * TokenEstimator - 轻量级、零副作用的 Token 预估
 *
 * 设计原则：
 * 1. 只调用 estimate()，从不调用 resolve()
 * 2. 支持并发控制，避免 EMFILE 错误
 * 3. 错误分类：EACCES → block, ENOENT → warn
 */
export class TokenEstimator {
    /**
     * 基于 Promise.allSettled 并发预估 Token 消耗
     *
     * @param items - 待估算的上下文项
     * @param concurrency - 最大并发数（默认 50）
     * @returns 估算摘要，包含 token 数、警告和阻塞错误
     */
    static async estimate(
        items: PendingContextItem[],
        concurrency: number = DEFAULT_CONCURRENCY
    ): Promise<EstimateSummary> {
        const summary: EstimateSummary = {
            totalBytes: 0,
            estimatedTokens: 0,
            warnings: [],
            blockingError: undefined
        };

        if (items.length === 0) {
            return summary;
        }

        // 使用并发控制来避免文件描述符耗尽
        const batchResults = await this.batchEstimate(items, concurrency);

        // 处理结果
        batchResults.forEach((result, idx) => {
            if (result.success) {
                const value = result.value;
                if (value) {
                    summary.totalBytes += value.byteSize;
                }
            } else {
                this.handleError(items[idx], result.error, summary);
            }
        });

        // 转换字节到 Token（经验公式：1 token ≈ 4 bytes）
        summary.estimatedTokens = Math.ceil(summary.totalBytes / 4);

        return summary;
    }

    /**
     * 批量估算，限制并发数
     */
    private static async batchEstimate(
        items: PendingContextItem[],
        concurrency: number
    ): Promise<Array<{ success: boolean; value?: { byteSize: number }; error?: any }>> {
        const results: Array<{ success: boolean; value?: { byteSize: number }; error?: any }> = [];

        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchPromises = batch.map(async (item, batchIdx) => {
                try {
                    const estimate = await item.estimate?.();
                    return { success: true, value: estimate || { byteSize: 0 } };
                } catch (error: any) {
                    return { success: false, error };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * 错误分类处理

    /**
     * 错误分类处理
     *
     * 语义定义：
     * - EACCES (权限拒绝) → 必须阻塞，无法恢复
     * - ENOENT (文件不存在) → 警告，文件可能被删除
     * - EMFILE (文件描述符过多) → 警告，临时系统状态
     * - 其他错误 → 警告，降级行为
     */
    private static handleError(
        item: PendingContextItem,
        error: any,
        summary: EstimateSummary
    ): void {
        const errorCode = error?.code || 'UNKNOWN';

        switch (errorCode) {
            case 'EACCES':
                summary.blockingError = `Permission denied: ${item.id}`;
                break;

            case 'ENOENT':
                summary.warnings.push({
                    item: item.id,
                    message: `ENOENT: ${error.message || `File not found: ${item.id}`}`
                });
                break;

            case 'EMFILE':
                summary.warnings.push({
                    item: item.id,
                    message: `Too many open files: ${item.id}`
                });
                break;

            default:
                summary.warnings.push({
                    item: item.id,
                    message: `Estimate failed for ${item.id}: ${error.message || String(error)}`
                });
        }
    }
}
