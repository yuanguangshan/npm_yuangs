// @ts-nocheck
import { AgentPipelineEnhanced } from '../../../src/agent/AgentPipelineEnhanced';
import { DefaultTokenPolicy } from '../../../src/policy/token/DefaultTokenPolicy';
import { ModelRegistry } from '../../../src/policy/model/ModelRegistry';

jest.mock('fs/promises');
jest.mock('../../../src/policy/token/TokenEstimator');

/**
 * T8: Pipeline loop 终止测试
 * 验证：最大迭代保护机制
 */
describe('AgentPipeline - T8: Loop Termination', () => {
    let iterationCount = 0;
    const mockModelCap = {
        name: 'gemini-2.5-flash-lite',
        contextWindow: 32768,
        costProfile: 'medium',
        atomicCapabilities: []
    };

    beforeEach(() => {
        iterationCount = 0;
        const TokenEstimator = require('../../../src/policy/token/TokenEstimator').TokenEstimator;
        TokenEstimator.estimate.mockResolvedValue({
            totalBytes: 40000,
            estimatedTokens: 10000,
            warnings: [],
            blockingError: undefined
        });
    });

    test('最多迭代 3 次后应抛出 MaxIterationsExceeded', async () => {
        const modelRegistry = new ModelRegistry([mockModelCap]);
        const pipeline = new AgentPipelineEnhanced(modelRegistry);

        pipeline['policy'].evaluate = jest.fn().mockImplementation(async () => {
            iterationCount++;
            return {
                status: 'warn',
                estimatedTokens: 10000,
                limit: 32000,
                ratio: 0.3125,
                message: 'Test warning',
                actions: []
            };
        });

        const PolicyPresenter = require('../../../src/ui/PolicyPresenter').PolicyPresenter;
        PolicyPresenter.presentWarning = jest.fn().mockResolvedValue({ type: 'continue' });

        // Mock applyDecision to force retry loop
        pipeline['applyDecision'] = jest.fn().mockResolvedValue(false);

        try {
            await pipeline.run({
                rawInput: 'test',
                mode: 'command',
                options: { model: 'gemini-2.5-flash-lite' }
            }, 'command');
            expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
            expect(error.message).toBe('MaxIterationsExceeded');
            expect(iterationCount).toBe(3);
        }
    });

    test('3 次迭代内通过应成功', async () => {
        const modelRegistry = new ModelRegistry([mockModelCap]);
        const pipeline = new AgentPipelineEnhanced(modelRegistry);

        pipeline['policy'].evaluate = jest.fn()
            .mockImplementationOnce(async () => ({ status: 'warn' }))
            .mockImplementationOnce(async () => ({ status: 'ok' }));

        const PolicyPresenter = require('../../../src/ui/PolicyPresenter').PolicyPresenter;
        PolicyPresenter.presentWarning = jest.fn().mockResolvedValue({ type: 'continue' });

        // Mock applyDecision to simulate retry on first call and success on second
        pipeline['applyDecision'] = jest.fn()
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true);

        // Mock executeLLMPipeline to avoid real AI call
        pipeline['executeLLMPipeline'] = jest.fn().mockResolvedValue(undefined);

        await pipeline.run({
            rawInput: 'test',
            mode: 'command',
            options: { model: 'gemini-2.5-flash-lite' }
        }, 'command');

        expect(pipeline['policy'].evaluate).toHaveBeenCalledTimes(2);
    });

    test('warn 状态后 abort 应立即停止', async () => {
        const modelRegistry = new ModelRegistry([mockModelCap]);
        const pipeline = new AgentPipelineEnhanced(modelRegistry);

        pipeline['policy'].evaluate = jest.fn().mockImplementation(async () => {
            iterationCount++;
            return {
                status: 'warn',
                estimatedTokens: 10000,
                limit: 32000,
                ratio: 0.3125,
                message: 'Test warning',
                actions: [{ type: 'abort', label: '终止', desc: '平台阻断' }]
            };
        });

        const PolicyPresenter = require('../../../src/ui/PolicyPresenter').PolicyPresenter;
        PolicyPresenter.presentWarning = jest.fn().mockResolvedValue({ type: 'abort' });

        try {
            await pipeline.run({
                rawInput: 'test',
                mode: 'command',
                options: { model: 'gemini-2.5-flash-lite' }
            }, 'command');
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.message).toBe('UserAborted');
            expect(iterationCount).toBe(1);
        }
    });
});
