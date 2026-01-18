import { PendingContextItem, SamplingStrategy } from '../policy/token/types';

/**
 * ContextSampler - 上下文采样器
 *
 * 职责：
 * - 实现 head_tail 采样策略
 * - 保留文件头部和尾部，丢弃中间部分
 */
export class ContextSampler {
    /**
     * 对 PendingContextItem 应用采样策略
     */
    static async applySampling(
        item: PendingContextItem,
        strategy: SamplingStrategy
    ): Promise<PendingContextItem> {
        if (strategy === 'none' || item.samplingStrategy === 'none') {
            return item;
        }

        if (strategy === 'head_tail' || item.samplingStrategy === 'head_tail') {
            return this.applyHeadTail(item);
        }

        if (strategy === 'random') {
            return this.applyRandom(item);
        }

        return item;
    }

    /**
     * Head-Tail 采样：保留头部和尾部各 30 行
     */
    private static async applyHeadTail(
        item: PendingContextItem
    ): Promise<PendingContextItem> {
        const resolved = await item.resolve();
        const lines = resolved.content.split('\n');

        const keepLines = 60;
        const headLines = Math.min(30, Math.floor(lines.length / 2));
        const tailLines = Math.min(30, Math.floor(lines.length / 2));

        const sampledLines = [
            ...lines.slice(0, headLines),
            // ...lines.slice(headLines, lines.length - tailLines), // 跳过中间部分
            ...lines.slice(-tailLines)
        ];

        return {
            ...item,
            id: `${item.id} (sampled)`,
            resolve: async () => ({
                content: sampledLines.join('\n'),
                byteSize: Buffer.byteLength(sampledLines.join('\n'), 'utf-8'),
                lineCount: sampledLines.length
            })
        };
    }

    /**
     * Random 采样：随机保留 50% 的行
     */
    private static async applyRandom(
        item: PendingContextItem
    ): Promise<PendingContextItem> {
        const resolved = await item.resolve();
        const lines = resolved.content.split('\n');

        const sampledLines = lines.filter((_, index) => Math.random() > 0.5);

        return {
            ...item,
            id: `${item.id} (random)`,
            resolve: async () => ({
                content: sampledLines.join('\n'),
                byteSize: Buffer.byteLength(sampledLines.join('\n'), 'utf-8'),
                lineCount: sampledLines.length
            })
        };
    }
}
