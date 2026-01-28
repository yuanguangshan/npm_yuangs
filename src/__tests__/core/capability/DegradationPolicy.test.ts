import { ThresholdDegradationPolicy, NoOpDegradationPolicy } from '../../../core/capability/DegradationPolicy';
import { CapabilityLevel } from '../../../core/capability/CapabilityLevel';

describe('DegradationPolicy', () => {
    describe('ThresholdDegradationPolicy', () => {
        let policy: ThresholdDegradationPolicy;

        beforeEach(() => {
            policy = new ThresholdDegradationPolicy();
        });

        it('should not degrade when all conditions are met', () => {
            const input = {
                timeElapsed: 10000,
                confidence: 0.9,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(false);
            expect(decision.targetLevel).toBe(CapabilityLevel.SEMANTIC);
            expect(decision.reason).toContain('no degradation needed');
        });

        it('should degrade when time exceeds limit', () => {
            const input = {
                timeElapsed: 40000,
                confidence: 0.9,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(true);
            expect(decision.targetLevel).toBeLessThan(CapabilityLevel.SEMANTIC);
            expect(decision.reason).toContain('Time elapsed');
        });

        it('should degrade when confidence is below threshold', () => {
            const input = {
                timeElapsed: 10000,
                confidence: 0.5,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(true);
            expect(decision.targetLevel).toBeLessThan(CapabilityLevel.SEMANTIC);
            expect(decision.reason).toContain('Confidence');
        });

        it('should degrade when both time and confidence thresholds are exceeded', () => {
            const input = {
                timeElapsed: 40000,
                confidence: 0.5,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(true);
            expect(decision.reason).toContain('Time elapsed');
            expect(decision.reason).toContain('Confidence');
        });

        it('should use custom thresholds when provided', () => {
            const customPolicy = new ThresholdDegradationPolicy({
                timeLimit: 50000,
                confidenceThreshold: 0.6,
            });

            const input = {
                timeElapsed: 40000,
                confidence: 0.7,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = customPolicy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(false);
        });

        it('should degrade through fallback chain appropriately', () => {
            const input = {
                timeElapsed: 40000,
                confidence: 0.5,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(true);
            expect([CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE]).toContain(decision.targetLevel);
        });

        it('should handle empty fallback chain', () => {
            const input = {
                timeElapsed: 40000,
                confidence: 0.9,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(true);
            expect(decision.reason).toContain('falling back to final level');
        });

        it('should clamp confidence values within valid range', () => {
            const input1 = { timeElapsed: 0, confidence: 1.5 };
            const input2 = { timeElapsed: 0, confidence: -0.5 };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision1 = policy.decide(input1, minCapability);
            const decision2 = policy.decide(input2, minCapability);

            expect(decision1.shouldDegrade).toBe(false);
            expect(decision2.shouldDegrade).toBe(true);
        });
    });

    describe('NoOpDegradationPolicy', () => {
        it('should never degrade', () => {
            const policy = new NoOpDegradationPolicy();

            const input = {
                timeElapsed: 100000,
                confidence: 0.1,
            };

            const minCapability = {
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            };

            const decision = policy.decide(input, minCapability);

            expect(decision.shouldDegrade).toBe(false);
            expect(decision.targetLevel).toBe(CapabilityLevel.SEMANTIC);
            expect(decision.reason).toContain('never degrades');
        });
    });
});
