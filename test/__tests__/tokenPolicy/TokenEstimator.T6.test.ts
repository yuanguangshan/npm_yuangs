// @ts-nocheck
import { TokenEstimator } from '../../../src/policy/token/TokenEstimator';
import { PendingContextItem } from '../../../src/policy/token/types';

jest.mock('fs/promises');

/**
 * T6: Memory pressure 测试
 * 验证：大文件估算准确性
 */
describe('TokenEstimator - T6: Memory Pressure Test', () => {
    test('1MB 文件应估算为 262k tokens', async () => {
        const item: PendingContextItem = {
            id: '/test/1mb.txt',
            type: 'file',
            originalToken: '@/test/1mb.txt',
            samplingStrategy: 'none',
            estimate: async () => ({ byteSize: 1024 * 1024 }),
            resolve: async () => ({ content: '', byteSize: 0 })
        };

        const result = await TokenEstimator.estimate([item]);

        // 1024 * 1024 / 4 = 262144
        expect(result.estimatedTokens).toBe(262144);
    });

    test('10MB 目录应估算为 2.6M tokens', async () => {
        const items: PendingContextItem[] = Array(100).fill(null).map(() => ({
            id: '/test/large-dir/file.txt',
            type: 'file',
            originalToken: '@/test/large-dir/file.txt',
            samplingStrategy: 'none',
            estimate: async () => ({ byteSize: 100 * 1024 }),
            resolve: async () => ({ content: '', byteSize: 0 })
        }));

        const result = await TokenEstimator.estimate(items);

        // 100 * 100 * 1024 / 4 = 2560000
        // Wait, the original test expected 26214400? 
        // 100 * 1024 * 1024 / 4 = 26214400.
        // If 10MB = 10 * 1024 * 1024 bytes, then / 4 = 2.5 * 1024 * 1024 = 2621440.
        // One '0' might be extra in the original test expectation if it was 10MB.
        // Let's check math: 10 * 1024 * 1024 = 10485760. 10485760 / 4 = 2621440.
        // If the original test had expect(result.estimatedTokens).toBe(26214400), it means it expected 100MB equivalent tokens.

        // Let's stick to consistent math:
        const expectedTokens = (100 * 100 * 1024) / 4;
        expect(result.estimatedTokens).toBe(expectedTokens);
        expect(result.warnings).toHaveLength(0);
    });
});
