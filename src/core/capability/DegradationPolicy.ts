import { CapabilityLevel, validateFallbackChain, MinCapability } from './CapabilityLevel';

export interface DecisionInput {
    timeElapsed: number;
    memoryUsed?: number;
    confidence: number;
}

export interface DegradationDecision {
    shouldDegrade: boolean;
    targetLevel: CapabilityLevel;
    reason: string;
}

export interface DegradationPolicy {
    decide(input: DecisionInput, minCapability: MinCapability): DegradationDecision;
}

export class ThresholdDegradationPolicy implements DegradationPolicy {
    private timeLimit: number;
    private confidenceThreshold: number;
    
    constructor(options: {
        timeLimit?: number;
        confidenceThreshold?: number;
    } = {}) {
        this.timeLimit = options.timeLimit ?? 30000;
        this.confidenceThreshold = options.confidenceThreshold ?? 0.7;
    }
    
    decide(input: DecisionInput, minCapability: MinCapability): DegradationDecision {
        const reasons: string[] = [];
        
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
            targetLevel: CapabilityLevel.NONE,
            reason: reasons.join('; ') + ', falling back to NONE',
        };
    }
}

export class NoOpDegradationPolicy implements DegradationPolicy {
    decide(input: DecisionInput, minCapability: MinCapability): DegradationDecision {
        return {
            shouldDegrade: false,
            targetLevel: minCapability.minCapability,
            reason: 'No-op policy: never degrades',
        };
    }
}
