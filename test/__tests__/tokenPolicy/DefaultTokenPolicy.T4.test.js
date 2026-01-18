import { DefaultTokenPolicy } from '../../dist/policy/token/DefaultTokenPolicy';
import { ModelSpec, PendingContextItem } from '../../dist/policy/token/types';

jest.mock('fs/promises');
jest.mock('../../dist/policy/token/TokenEstimator');

/**
 * T4: block 状态下 resolve 永不被调用
 * 验证：阻断时的零副作用
 */
describe('DefaultTokenPolicy - T4: Block with No Resolve Calls', () => {
    let resolveCallCount = 0;

    beforeEach(() => {
        const TokenEstimator = require('../../dist/policy/token/TokenEstimator').TokenEstimator;
        TokenEstimator.estimate.mockResolvedValue({
            totalBytes: 0,
            estimatedTokens: 0,
            warnings: [],
            blockingError: undefined
        });
        
        resolveCallCount = 0;
    });

    test('block 状态下 resolve() 永不被调用', async () => {
        const policy = new DefaultTokenPolicy();

        const item: PendingContextItem = {
            id: '/test/file.txt',
            type: 'file',
            originalToken: '@/test/file.txt',
            samplingStrategy: 'none',
            estimate: async () => ({ byteSize: 0 }),
            resolve: async () => {
                resolveCallCount++;
                throw new Error('Should not be called in block state');
            }
        };

        const result = await policy.evaluate({
            model: {
                name: 'test-model',
                contextWindow: 100,
                costTier: 'medium',
                longContextCapable: false
            },
            contextItems: [item],
            mode: 'command'
        });

        expect(result.status).toBe('block');
        expect(result.message).toBeDefined();
        expect(resolveCallCount).toBe(0);
    });
});
