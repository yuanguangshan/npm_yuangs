import { PendingContextItem, SamplingStrategy } from '../policy/token/types';
/**
 * ContextSampler - 上下文采样器
 *
 * 职责：
 * - 实现 head_tail 采样策略
 * - 保留文件头部和尾部，丢弃中间部分
 */
export declare class ContextSampler {
    /**
     * 对 PendingContextItem 应用采样策略
     */
    static applySampling(item: PendingContextItem, strategy: SamplingStrategy): Promise<PendingContextItem>;
    /**
     * Head-Tail 采样：保留头部和尾部各 30 行
     */
    private static applyHeadTail;
    /**
     * Random 采样：随机保留 50% 的行
     */
    private static applyRandom;
}
