"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpDegradationPolicy = exports.ThresholdDegradationPolicy = void 0;
const CapabilityLevel_1 = require("./CapabilityLevel");
class ThresholdDegradationPolicy {
    timeLimit;
    confidenceThreshold;
    constructor(options = {}) {
        this.timeLimit = options.timeLimit ?? 30000;
        this.confidenceThreshold = options.confidenceThreshold ?? 0.7;
    }
    decide(input, minCapability) {
        const reasons = [];
        if (input.timeElapsed > this.timeLimit) {
            reasons.push(`Time elapsed (${input.timeElapsed}ms) exceeds limit (${this.timeLimit}ms)`);
        }
        if (input.confidence < this.confidenceThreshold) {
            reasons.push(`Confidence (${input.confidence.toFixed(2)}) below threshold (${this.confidenceThreshold})`);
        }
        if (reasons.length === 0) {
            return {
                shouldDegrade: false,
                targetLevel: minCapability.minCapability,
                reason: 'All conditions met, no degradation needed',
            };
        }
        const fallbackChain = [minCapability.minCapability, ...minCapability.fallbackChain];
        for (let i = 0; i < fallbackChain.length; i++) {
            const targetLevel = fallbackChain[i];
            if (i === fallbackChain.length - 1) {
                return {
                    shouldDegrade: true,
                    targetLevel,
                    reason: reasons.join('; ') + `, falling back to final level: ${targetLevel}`,
                };
            }
            const nextLevel = fallbackChain[i + 1];
            const levelDrop = targetLevel - nextLevel;
            if (levelDrop >= 2 || reasons.length >= 2) {
                return {
                    shouldDegrade: true,
                    targetLevel: nextLevel,
                    reason: reasons.join('; ') + `, degrading from ${targetLevel} to ${nextLevel}`,
                };
            }
        }
        return {
            shouldDegrade: true,
            targetLevel: CapabilityLevel_1.CapabilityLevel.NONE,
            reason: reasons.join('; ') + ', falling back to NONE',
        };
    }
}
exports.ThresholdDegradationPolicy = ThresholdDegradationPolicy;
class NoOpDegradationPolicy {
    decide(input, minCapability) {
        return {
            shouldDegrade: false,
            targetLevel: minCapability.minCapability,
            reason: 'No-op policy: never degrades',
        };
    }
}
exports.NoOpDegradationPolicy = NoOpDegradationPolicy;
//# sourceMappingURL=DegradationPolicy.js.map