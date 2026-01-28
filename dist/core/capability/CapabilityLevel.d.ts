export declare enum CapabilityLevel {
    SEMANTIC = 5,
    STRUCTURAL = 4,
    LINE = 3,
    TEXT = 2,
    NONE = 1
}
export declare function capabilityLevelToString(level: CapabilityLevel): string;
export declare function stringToCapabilityLevel(str: string): CapabilityLevel | undefined;
export declare function compareCapabilities(a: CapabilityLevel, b: CapabilityLevel): number;
export declare function isCapabilityHigher(a: CapabilityLevel, b: CapabilityLevel): boolean;
export declare function isCapabilityLower(a: CapabilityLevel, b: CapabilityLevel): boolean;
export declare function validateCapabilityMonotonicity(levels: CapabilityLevel[]): boolean;
export interface MinCapability {
    minCapability: CapabilityLevel;
    fallbackChain: CapabilityLevel[];
}
export declare function validateFallbackChain(minCapability: MinCapability): boolean;
