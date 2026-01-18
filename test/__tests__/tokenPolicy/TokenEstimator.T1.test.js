"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TokenEstimator_1 = require("../../../dist/policy/token/TokenEstimator");
// Mock fs functions
jest.mock('fs/promises');
/**
 * T1: estimate-only 不触发 resolve
 * 验证：零副作用评估
 */
describe('TokenEstimator - T1: Zero-Side-Effect Estimation', () => {
    let resolveCallCount = 0;
    beforeEach(() => {
        resolveCallCount = 0;
    });
    test('estimate() 不应该调用任何 resolve()', async () => {
        const item = {
            id: '/test/file.txt',
            type: 'file',
            originalToken: '@/test/file.txt',
            samplingStrategy: 'none',
            estimate: async () => ({ byteSize: 100 }),
            resolve: async () => {
                resolveCallCount++;
                throw new Error('Should not be called');
            }
        };
        const result = await TokenEstimator_1.TokenEstimator.estimate([item]);
        expect(result.estimatedTokens).toBe(25); // 100 bytes / 4
        expect(result.warnings).toHaveLength(0);
        expect(result.blockingError).toBeUndefined();
        expect(resolveCallCount).toBe(0); // 关键：resolve 永不被调用
    });
    test('estimate() 应该正常处理所有项', async () => {
        const items = [
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
                estimate: async () => ({ byteSize: 200 })
            }
        ];
        const result = await TokenEstimator_1.TokenEstimator.estimate(items);
        expect(result.estimatedTokens).toBe(75); // (100 + 200) / 4
        expect(result.warnings).toHaveLength(0);
    });
    test('estimate() 应该处理没有 estimate() 的项', async () => {
        const items = [
            {
                id: '/test/file1.txt',
                type: 'file',
                originalToken: '@/test/file1.txt',
                samplingStrategy: 'none',
                resolve: async () => ({ content: 'test', byteSize: 100 })
            }
        ];
        const result = await TokenEstimator_1.TokenEstimator.estimate(items);
        expect(result.estimatedTokens).toBe(0); // 没有 estimate() 的项
        expect(result.warnings).toHaveLength(0);
    });
});
