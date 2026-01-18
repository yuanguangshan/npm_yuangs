// @ts-nocheck
import { TokenEstimator } from '../../../src/policy/token/TokenEstimator';
import { PendingContextItem } from '../../../src/policy/token/types';

jest.mock('fs/promises');

/**
 * T5: Race condition 测试
 * 验证：并发安全性
 */
describe('TokenEstimator - T5: Race Conditions', () => {
    test('慢速 estimate 不应该阻塞快速 resolve', async () => {
        const items: PendingContextItem[] = Array(100).fill(null).map((_, i) => ({
            id: `/test/file${i}.txt`,
            type: 'file',
            originalToken: `@/test/file${i}.txt`,
            samplingStrategy: 'none',
            estimate: async () => {
                await new Promise(resolve => setTimeout(resolve, i % 10 * 10));
                return { byteSize: 100 };
            },
            resolve: async () => ({ content: '', byteSize: 0 })
        }));

        const startTime = Date.now();
        const result = await TokenEstimator.estimate(items, 50);
        const duration = Date.now() - startTime;

        expect(result.estimatedTokens).toBe(2500); // 100 * 100 / 4
        // 并发执行下，耗时应该接近最大单项耗时，而不是累计耗时
        expect(duration).toBeLessThan(1000);
    });

    test('并发限制应该防止 EMFILE 错误', async () => {
        let activeCount = 0;
        let maxActive = 0;

        const item: PendingContextItem = {
            id: '/large/file.txt',
            type: 'file',
            originalToken: '@/large/file.txt',
            samplingStrategy: 'none',
            estimate: async () => {
                activeCount++;
                maxActive = Math.max(maxActive, activeCount);
                await new Promise(resolve => setTimeout(resolve, 10));
                activeCount--;
                return { byteSize: 1024 };
            },
            resolve: async () => ({ content: '', byteSize: 0 })
        };

        const items = Array(100).fill(null).map(() => ({ ...item }));

        const result = await TokenEstimator.estimate(items, 20);

        expect(result.estimatedTokens).toBe(25600); // 100 * 1024 / 4
        // 验证并发数是否被限制在 20 左右（batchEstimate 是分批跑的，所以应该是正好 20）
        expect(maxActive).toBeLessThanOrEqual(20);
    });
});
