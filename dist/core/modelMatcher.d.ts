import { AtomicCapability, ConstraintCapability } from './capabilities';
export interface ModelCapabilities {
    name: string;
    provider: string;
    atomicCapabilities: AtomicCapability[];
    contextWindow?: number;
    costProfile?: 'low' | 'medium' | 'high';
}
export interface CapabilityRequirement {
    required: AtomicCapability[];
    preferred: AtomicCapability[];
    constraints?: ConstraintCapability[];
}
export interface CapabilityMatchExplanation {
    modelName: string;
    provider: string;
    hasRequired: boolean;
    hasPreferred: AtomicCapability[];
    missingRequired: AtomicCapability[];
    reason: string;
}
export interface CapabilityMatchResult {
    selected: ModelCapabilities | null;
    candidates: CapabilityMatchExplanation[];
    fallbackOccurred: boolean;
}
export declare function matchModel(models: ModelCapabilities[], requirement: CapabilityRequirement): CapabilityMatchResult;
export declare function matchModelWithFallback(models: ModelCapabilities[], fallbackModels: ModelCapabilities[], requirement: CapabilityRequirement): CapabilityMatchResult;
