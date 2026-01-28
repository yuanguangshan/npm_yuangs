import { CapabilityLevel, MinCapability } from './CapabilityLevel';
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
export declare class ThresholdDegradationPolicy implements DegradationPolicy {
    private timeLimit;
    private confidenceThreshold;
    constructor(options?: {
        timeLimit?: number;
        confidenceThreshold?: number;
    });
    decide(input: DecisionInput, minCapability: MinCapability): DegradationDecision;
}
export declare class NoOpDegradationPolicy implements DegradationPolicy {
    decide(input: DecisionInput, minCapability: MinCapability): DegradationDecision;
}
