"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultCostProfileCalculator = exports.CostProfileCalculator = void 0;
const CapabilityLevel_1 = require("./CapabilityLevel");
const DEFAULT_LANGUAGE_WEIGHTS = [
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
class CostProfileCalculator {
    languageWeights;
    baseTimeMultiplier;
    baseMemoryMultiplier;
    baseTokenMultiplier;
    constructor(options = {}) {
        this.languageWeights = options.languageWeights ?? DEFAULT_LANGUAGE_WEIGHTS;
        this.baseTimeMultiplier = options.baseTimeMultiplier ?? 1.0;
        this.baseMemoryMultiplier = options.baseMemoryMultiplier ?? 1.0;
        this.baseTokenMultiplier = options.baseTokenMultiplier ?? 1.0;
    }
    getLanguageComplexity(filePath) {
        const ext = this.getFileExtension(filePath);
        const lang = this.languageWeights.find(l => l.extensions.includes(ext));
        return lang?.complexity ?? 1.0;
    }
    getLanguageWeight(filePath) {
        const ext = this.getFileExtension(filePath);
        const lang = this.languageWeights.find(l => l.extensions.includes(ext));
        return lang?.weight ?? 1.0;
    }
    getFileExtension(filePath) {
        const idx = filePath.lastIndexOf('.');
        return idx === -1 ? '' : filePath.substring(idx).toLowerCase();
    }
    calculate(filePaths, totalLines) {
        if (filePaths.length === 0) {
            return {
                estimatedTime: 0,
                estimatedMemory: 0,
                estimatedTokens: 0,
                requiredCapability: CapabilityLevel_1.CapabilityLevel.NONE,
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
    calculateTime(lines, complexity, weight) {
        const baseTime = (lines / 100) * 1000;
        return Math.ceil(baseTime * complexity * weight * this.baseTimeMultiplier);
    }
    calculateMemory(lines, complexity) {
        const baseMemory = lines * 100;
        return Math.ceil(baseMemory * complexity * this.baseMemoryMultiplier);
    }
    calculateTokens(lines, complexity) {
        const baseTokens = lines * 10;
        return Math.ceil(baseTokens * complexity * this.baseTokenMultiplier);
    }
    determineCapabilityLevel(complexity, lines) {
        if (lines > 5000 || complexity > 1.4) {
            return CapabilityLevel_1.CapabilityLevel.SEMANTIC;
        }
        else if (lines > 1000 || complexity > 1.2) {
            return CapabilityLevel_1.CapabilityLevel.STRUCTURAL;
        }
        else if (lines > 100 || complexity > 1.0) {
            return CapabilityLevel_1.CapabilityLevel.LINE;
        }
        else if (lines > 10) {
            return CapabilityLevel_1.CapabilityLevel.TEXT;
        }
        else {
            return CapabilityLevel_1.CapabilityLevel.NONE;
        }
    }
}
exports.CostProfileCalculator = CostProfileCalculator;
exports.defaultCostProfileCalculator = new CostProfileCalculator();
//# sourceMappingURL=CostProfile.js.map