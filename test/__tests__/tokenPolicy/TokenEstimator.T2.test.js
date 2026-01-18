import { TokenEstimator } from '../../dist/policy/token/TokenEstimator';
import { PendingContextItem } from '../../dist/policy/token/types';

jest.mock('fs/promises');

/**
 * T2: 并发 estimate + 单项失败
 * 验证：错误分类和并发控制
 */
describe('TokenEstimator - T2: Concurrent Estimate with Failures', () => {
    test('单项 ENOENT 错误应转为 warning', async () => {
        const error = new Error('ENOENT: /test/file.txt');
        const item: PendingContextItem = {
            id: '/test/file.txt',
            type: 'file',
            originalToken: '@/test/file.txt',
            samplingStrategy: 'none',
            estimate: async () => { throw error }
        };

        const result = await TokenEstimator.estimate([item]);

        expect(result.estimatedTokens).toBe(0);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].message).toContain('File not found');
        expect(result.blockingError).toBeUndefined();
    });

    test('单项 EACCES 错误应转为 blockingError', async () => {
        const error = new Error('EACCES: /test/file.txt');
        error.code = 'EACCES';
        const item: PendingContextItem = {
            id: '/test/file.txt',
            type: 'file',
            originalToken: '@/test/file.txt',
            samplingStrategy: 'none',
            estimate: async () => { throw error }
        };

        const result = await TokenEstimator.estimate([item]);

        expect(result.estimatedTokens).toBe(0);
        expect(result.warnings).toHaveLength(0);
        expect(result.blockingError).toContain('Permission denied');
        expect(result.blockingError).toContain('/test/file.txt');
    });

    test('多项估算 - 部分成功部分失败', async () => {
        const items: PendingContextItem[] = [
            {
                id: '/test/file1.txt',
                type: 'file',
                originalToken: '@/test/file1.txt',
                samplingStrategy: 'none',
                estimate: async () => ({ byteSize: 100 })
            },
            {
                id: '/test/file2.txt',
                type: 'file',
                originalToken: '@/test/file2.txt',
                samplingStrategy: 'none',
                estimate: async () => {
                    throw new Error('ENOENT: /test/file2.txt');
                }
            }
        ];

        const result = await TokenEstimator.estimate(items);

        expect(result.estimatedTokens).toBe(25);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].item).toBe('/test/file2.txt');
    });
});
