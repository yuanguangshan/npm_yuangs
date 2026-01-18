import { PendingContextItem, EstimateSummary } from './types';
/**
 * TokenEstimator - 轻量级、零副作用的 Token 预估
 *
 * 设计原则：
 * 1. 只调用 estimate()，从不调用 resolve()
 * 2. 支持并发控制，避免 EMFILE 错误
 * 3. 错误分类：EACCES → block, ENOENT → warn
 */
export declare class TokenEstimator {
    /**
     * 基于 Promise.allSettled 并发预估 Token 消耗
     *
     * @param items - 待估算的上下文项
     * @param concurrency - 最大并发数（默认 50）
     * @returns 估算摘要，包含 token 数、警告和阻塞错误
     */
    static estimate(items: PendingContextItem[], concurrency?: number): Promise<EstimateSummary>;
    /**
     * 批量估算，限制并发数
     */
    private static batchEstimate;
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
    private static handleError;
}
