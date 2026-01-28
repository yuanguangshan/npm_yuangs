import { CapabilityLevel } from './CapabilityLevel';

export interface LanguageWeight {
    extensions: string[];
    weight: number;
    complexity: number;
}

const DEFAULT_LANGUAGE_WEIGHTS: LanguageWeight[] = [
    { extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'], weight: 1.5, complexity: 1.5 },
    { extensions: ['.go', '.golang'], weight: 1.3, complexity: 1.3 },
    { extensions: ['.ts', '.tsx', '.mts', '.cts'], weight: 1.2, complexity: 1.2 },
    { extensions: ['.js', '.jsx', '.mjs', '.cjs'], weight: 1.0, complexity: 1.0 },
    { extensions: ['.py'], weight: 1.1, complexity: 1.1 },
    { extensions: ['.java'], weight: 1.4, complexity: 1.4 },
    { extensions: ['.rs', '.rust'], weight: 1.4, complexity: 1.4 },
    { extensions: ['.rb', '.ruby'], weight: 1.0, complexity: 1.0 },
    { extensions: ['.php'], weight: 1.0, complexity: 1.0 },
    { extensions: ['.c', '.h'], weight: 1.3, complexity: 1.3 },
    { extensions: ['.cs'], weight: 1.3, complexity: 1.3 },
    { extensions: ['.swift'], weight: 1.2, complexity: 1.2 },
    { extensions: ['.kt', '.kts'], weight: 1.2, complexity: 1.2 },
    { extensions: ['.dart'], weight: 1.1, complexity: 1.1 },
    { extensions: ['.scala'], weight: 1.4, complexity: 1.4 },
    { extensions: ['.lua'], weight: 0.9, complexity: 0.9 },
    { extensions: ['.rs'], weight: 1.4, complexity: 1.4 },
    { extensions: ['.ex', '.exs'], weight: 1.1, complexity: 1.1 },
    { extensions: ['.ml', '.mli', '.re', '.rei'], weight: 1.3, complexity: 1.3 },
    { extensions: ['.clj', '.cljs'], weight: 1.2, complexity: 1.2 },
    { extensions: ['.hs'], weight: 1.4, complexity: 1.4 },
    { extensions: ['.sh', '.bash', '.zsh'], weight: 0.8, complexity: 0.8 },
    { extensions: ['.ps1', '.psm1'], weight: 0.9, complexity: 0.9 },
    { extensions: ['.sql'], weight: 0.8, complexity: 0.8 },
];

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

export class CostProfileCalculator {
    private languageWeights: LanguageWeight[];
    private baseTimeMultiplier: number;
    private baseMemoryMultiplier: number;
    private baseTokenMultiplier: number;
    
    constructor(options: CostProfileOptions = {}) {
        this.languageWeights = options.languageWeights ?? DEFAULT_LANGUAGE_WEIGHTS;
        this.baseTimeMultiplier = options.baseTimeMultiplier ?? 1.0;
        this.baseMemoryMultiplier = options.baseMemoryMultiplier ?? 1.0;
        this.baseTokenMultiplier = options.baseTokenMultiplier ?? 1.0;
    }
    
    getLanguageComplexity(filePath: string): number {
        const ext = this.getFileExtension(filePath);
        const lang = this.languageWeights.find(l => l.extensions.includes(ext));
        return lang?.complexity ?? 1.0;
    }
    
    getLanguageWeight(filePath: string): number {
        const ext = this.getFileExtension(filePath);
        const lang = this.languageWeights.find(l => l.extensions.includes(ext));
        return lang?.weight ?? 1.0;
    }
    
    getFileExtension(filePath: string): string {
        const idx = filePath.lastIndexOf('.');
        return idx === -1 ? '' : filePath.substring(idx).toLowerCase();
    }
    
    calculate(filePaths: string[], totalLines: number): CostProfile {
        if (filePaths.length === 0) {
            return {
                estimatedTime: 0,
                estimatedMemory: 0,
                estimatedTokens: 0,
                requiredCapability: CapabilityLevel.NONE,
            };
        }
        
        let totalComplexity = 0;
        let totalWeight = 0;
        
        for (const filePath of filePaths) {
            const complexity = this.getLanguageComplexity(filePath);
            const weight = this.getLanguageWeight(filePath);
            totalComplexity += complexity;
            totalWeight += weight;
        }
        
        const avgComplexity = totalComplexity / filePaths.length;
        const avgWeight = totalWeight / filePaths.length;
        
        const estimatedTime = this.calculateTime(totalLines, avgComplexity, avgWeight);
        const estimatedMemory = this.calculateMemory(totalLines, avgComplexity);
        const estimatedTokens = this.calculateTokens(totalLines, avgComplexity);
        const requiredCapability = this.determineCapabilityLevel(avgComplexity, totalLines);
        
        return {
            estimatedTime,
            estimatedMemory,
            estimatedTokens,
            requiredCapability,
        };
    }
    
    private calculateTime(lines: number, complexity: number, weight: number): number {
        const baseTime = (lines / 100) * 1000;
        return Math.ceil(baseTime * complexity * weight * this.baseTimeMultiplier);
    }
    
    private calculateMemory(lines: number, complexity: number): number {
        const baseMemory = lines * 100;
        return Math.ceil(baseMemory * complexity * this.baseMemoryMultiplier);
    }
    
    private calculateTokens(lines: number, complexity: number): number {
        const baseTokens = lines * 10;
        return Math.ceil(baseTokens * complexity * this.baseTokenMultiplier);
    }
    
    private determineCapabilityLevel(complexity: number, lines: number): CapabilityLevel {
        if (lines > 5000 || complexity > 1.4) {
            return CapabilityLevel.SEMANTIC;
        } else if (lines > 1000 || complexity > 1.2) {
            return CapabilityLevel.STRUCTURAL;
        } else if (lines > 100 || complexity > 1.0) {
            return CapabilityLevel.LINE;
        } else if (lines > 10) {
            return CapabilityLevel.TEXT;
        } else {
            return CapabilityLevel.NONE;
        }
    }
}

export const defaultCostProfileCalculator = new CostProfileCalculator();
