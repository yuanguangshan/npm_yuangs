export declare enum AtomicCapability {
    TEXT_GENERATION = "text_generation",
    CODE_GENERATION = "code_generation",
    TOOL_CALLING = "tool_calling",
    LONG_CONTEXT = "long_context",
    REASONING = "reasoning",
    STREAMING = "streaming"
}
export interface CompositeCapability {
    name: string;
    composedOf: AtomicCapability[];
}
export declare const COMPOSITE_CAPABILITIES: CompositeCapability[];
export declare enum ConstraintCapability {
    PREFER_DETERMINISTIC = "prefer_deterministic",
    LOW_COST = "low_cost",
    FAST_RESPONSE = "fast_response"
}
export declare const CAPABILITY_VERSION = "1.0";
export declare function isAtomicCapability(value: string): value is AtomicCapability;
export declare function isConstraintCapability(value: string): value is ConstraintCapability;
export declare function resolveCompositeCapability(name: string): AtomicCapability[];
export declare function expandCapabilities(capabilities: Array<AtomicCapability | string>): Set<AtomicCapability>;
