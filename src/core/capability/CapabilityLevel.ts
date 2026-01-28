export enum CapabilityLevel {
    SEMANTIC = 5,
    STRUCTURAL = 4,
    LINE = 3,
    TEXT = 2,
    NONE = 1,
}

export function capabilityLevelToString(level: CapabilityLevel): string {
    switch (level) {
        case CapabilityLevel.SEMANTIC:
            return 'SEMANTIC';
        case CapabilityLevel.STRUCTURAL:
            return 'STRUCTURAL';
        case CapabilityLevel.LINE:
            return 'LINE';
        case CapabilityLevel.TEXT:
            return 'TEXT';
        case CapabilityLevel.NONE:
            return 'NONE';
    }
}

export function stringToCapabilityLevel(str: string): CapabilityLevel | undefined {
    const upper = str.toUpperCase();
    switch (upper) {
        case 'SEMANTIC':
            return CapabilityLevel.SEMANTIC;
        case 'STRUCTURAL':
            return CapabilityLevel.STRUCTURAL;
        case 'LINE':
            return CapabilityLevel.LINE;
        case 'TEXT':
            return CapabilityLevel.TEXT;
        case 'NONE':
            return CapabilityLevel.NONE;
        default:
            return undefined;
    }
}

export function compareCapabilities(a: CapabilityLevel, b: CapabilityLevel): number {
    return a - b;
}

export function isCapabilityHigher(a: CapabilityLevel, b: CapabilityLevel): boolean {
    return a > b;
}

export function isCapabilityLower(a: CapabilityLevel, b: CapabilityLevel): boolean {
    return a < b;
}

export function validateCapabilityMonotonicity(levels: CapabilityLevel[]): boolean {
    if (levels.length <= 1) return true;
    
    for (let i = 0; i < levels.length - 1; i++) {
        if (levels[i] <= levels[i + 1]) {
            return false;
        }
    }
    return true;
}

export interface MinCapability {
    minCapability: CapabilityLevel;
    fallbackChain: CapabilityLevel[];
}

export function validateFallbackChain(minCapability: MinCapability): boolean {
    if (minCapability.fallbackChain.length === 0) {
        return true;
    }
    
    if (!validateCapabilityMonotonicity([minCapability.minCapability, ...minCapability.fallbackChain])) {
        return false;
    }
    
    return minCapability.fallbackChain[minCapability.fallbackChain.length - 1] === CapabilityLevel.NONE;
}
