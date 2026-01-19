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
                await new Promise(resolve => setTimeout(resolve, i * 10));
                return { byteSize: 100 };
            }
        }));

        const startTime = Date.now();
        const result = await TokenEstimator.estimate(items, 50);
        const duration = Date.now() - startTime;

        expect(result.estimatedTokens).toBe(2500);
        expect(duration).toBeLessThan(2000);
    });

    test('并发限制应该防止 EMFILE 错误', async () => {
        const largeItem: PendingContextItem = {
            id: '/large/file.txt',
            type: 'file',
            originalToken: '@/large/file.txt',
            samplingStrategy: 'none',
            estimate: async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return { byteSize: 1024 * 1024 };
            }
        };

        const items = Array(100).fill(largeItem);

        const result = await TokenEstimator.estimate(items, 50);

        expect(result.estimatedTokens).toBeGreaterThan(0);
        expect(result.warnings?.length).toBeLessThan(100);
    });
});
