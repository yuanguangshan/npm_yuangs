import { CapabilityLevel } from './CapabilityLevel';
export interface LanguageWeight {
    extensions: string[];
    weight: number;
    complexity: number;
}
export interface CostProfile {
    estimatedTime: number;
    estimatedMemory: number;
    estimatedTokens: number;
    requiredCapability: CapabilityLevel;
}
export interface CostProfileOptions {
    languageWeights?: LanguageWeight[];
    baseTimeMultiplier?: number;
    baseMemoryMultiplier?: number;
    baseTokenMultiplier?: number;
}
export declare class CostProfileCalculator {
    private languageWeights;
    private baseTimeMultiplier;
    private baseMemoryMultiplier;
    private baseTokenMultiplier;
    constructor(options?: CostProfileOptions);
    getLanguageComplexity(filePath: string): number;
    getLanguageWeight(filePath: string): number;
    getFileExtension(filePath: string): string;
    calculate(filePaths: string[], totalLines: number): CostProfile;
    private calculateTime;
    private calculateMemory;
    private calculateTokens;
    private determineCapabilityLevel;
}
export declare const defaultCostProfileCalculator: CostProfileCalculator;
