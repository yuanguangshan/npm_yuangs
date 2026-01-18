// @ts-nocheck
import { DefaultTokenPolicy } from '../../../src/policy/token/DefaultTokenPolicy';
import { ModelSpec } from '../../../src/policy/token/types';

jest.mock('fs/promises');
jest.mock('../../../src/policy/token/TokenEstimator');

/**
 * T3: warn → switch → re-evaluate
 * 验证：模型切换重新评估
 */
describe('DefaultTokenPolicy - T3: Warn with Switch Model', () => {
    let mockModel: ModelSpec = {
        name: 'test-model',
        contextWindow: 1000,
        costTier: 'medium',
        longContextCapable: false
    };

    beforeEach(() => {
        const TokenEstimator = require('../../../src/policy/token/TokenEstimator').TokenEstimator;
        TokenEstimator.estimate.mockResolvedValue({
            totalBytes: 0,
            estimatedTokens: 0,
            warnings: [],
            blockingError: undefined
        });
    });

    test('warn 状态应提供 switch model 选项', async () => {
        const policy = new DefaultTokenPolicy();

        const TokenEstimator = require('../../../src/policy/token/TokenEstimator').TokenEstimator;
        TokenEstimator.estimate.mockResolvedValueOnce({
            totalBytes: 3400,
            estimatedTokens: 850,
            warnings: [],
            blockingError: undefined
        });

        const result = await policy.evaluate({
            model: mockModel,
            contextItems: [],
            mode: 'command'
        });

        expect(result.status).toBe('warn');
        expect(result.actions).toBeDefined();
        expect(result.actions?.length).toBeGreaterThan(0);

        const hasSwitchAction = result.actions?.some(
            (a: any) => a.type === 'suggest_model_switch'
        );
        expect(hasSwitchAction).toBe(true);
    });

    test('ok 状态不应提供 switch model 选项', async () => {
        const policy = new DefaultTokenPolicy();

        const result = await policy.evaluate({
            model: mockModel,
            contextItems: [],
            mode: 'command'
        });

        expect(result.status).toBe('ok');
        expect(result.actions).toBeUndefined();
    });
});
