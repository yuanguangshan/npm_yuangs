import { TokenEstimator } from '../../dist/policy/token/TokenEstimator';
import { PendingContextItem } from '../../dist/policy/token/types';

jest.mock('fs/promises');
jest.mock('../../dist/policy/token/TokenEstimator');

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
            estimate: async () => ({ byteSize: 1024 * 1024 })
        };

        const result = await TokenEstimator.estimate([item]);

        expect(result.estimatedTokens).toBe(262144);
        expect(result.estimatedTokens).toBeCloseTo(262144, 1000);
    });

    test('10MB 目录应估算为 2.6M tokens', async () => {
        const items: PendingContextItem[] = Array(100).fill({
            id: '/test/large-dir/file.txt',
            type: 'file',
            originalToken: '@/test/large-dir/file.txt',
            samplingStrategy: 'none',
            estimate: async () => ({ byteSize: 100 * 1024 })
        });

        const result = await TokenEstimator.estimate(items);

        expect(result.estimatedTokens).toBe(26214400);
        expect(result.warnings).toHaveLength(0);
    });
});
