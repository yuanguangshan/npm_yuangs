import { AgentPipelineEnhanced } from '../../dist/agent/AgentPipelineEnhanced';
import { DefaultTokenPolicy } from '../../dist/policy/token/DefaultTokenPolicy';
import { ModelRegistry } from '../../dist/policy/model/ModelRegistry';

jest.mock('fs/promises');
jest.mock('../../dist/policy/token/TokenEstimator');

/**
 * T8: Pipeline loop 终止测试
 * 验证：最大迭代保护机制
 */
describe('AgentPipeline - T8: Loop Termination', () => {
    let iterationCount = 0;

    beforeEach(() => {
        iterationCount = 0;
        const TokenEstimator = require('../../dist/policy/token/TokenEstimator').TokenEstimator;
        TokenEstimator.estimate.mockResolvedValue({
            totalBytes: 40000,
            estimatedTokens: 10000,
            warnings: [],
            blockingError: undefined
        });
    });

    test('最多迭代 3 次后应抛出 MaxIterationsExceeded', async () => {
        const policy = new DefaultTokenPolicy();
        const modelRegistry = new ModelRegistry([]);

        const pipeline = new AgentPipelineEnhanced(modelRegistry);

        policy.evaluate = jest.fn().mockResolvedValue({
            status: 'warn',
            estimatedTokens: 10000,
            limit: 32000,
            ratio: 0.3125,
            message: 'Test warning',
            actions: []
        });

        try {
            await pipeline.run({
                rawInput: 'test',
                mode: 'command',
                options: { model: 'test-model' }
            });
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.message).toBe('MaxIterationsExceeded');
            expect(iterationCount).toBe(3);
        }
    });

    test('3 次迭代内通过应成功', async () => {
        const policy = new DefaultTokenPolicy();
        const modelRegistry = new ModelRegistry([]);

        const pipeline = new AgentPipelineEnhanced(modelRegistry);

        policy.evaluate = jest.fn()
            .mockImplementationOnce(async () => ({ status: 'ok' }))
            .mockImplementationOnce(async () => ({ status: 'ok' }))
            .mockImplementationOnce(async () => ({ status: 'ok' }));

        try {
            await pipeline.run({
                rawInput: 'test',
                mode: 'command',
                options: { model: 'test-model' }
            });
            expect(true).toBe(true);
        } catch (error: any) {
            expect(error).toBeUndefined();
        }
    });

    test('warn 状态后 abort 应立即停止', async () => {
        const policy = new DefaultTokenPolicy();
        const modelRegistry = new ModelRegistry([]);

        const pipeline = new AgentPipelineEnhanced(modelRegistry);

        policy.evaluate = jest.fn()
            .mockResolvedValue({
                status: 'warn',
                estimatedTokens: 10000,
                limit: 32000,
                ratio: 0.3125,
                message: 'Test warning',
                actions: [
                    { type: 'abort', label: '终止', desc: '退出' }
                ]
            });

        try {
            await pipeline.run({
                rawInput: 'test',
                mode: 'command',
                options: { model: 'test-model' }
            });
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.message).toBe('MaxIterationsExceeded');
            expect(iterationCount).toBe(1);
        }
    });
});
