/**
 * 风险告知生成器
 * 为高风险操作生成详细的风险告知书，增强Human-in-the-loop安全性
 */
export interface RiskLevel {
    level: 'low' | 'medium' | 'high';
    score: number;
}
export interface RiskFactors {
    commandType: string;
    command?: string;
    filePath?: string;
    fileCount?: number;
    isDestructive: boolean;
    modifiesSystem: boolean;
    requiresNetwork: boolean;
    modifiesGit: boolean;
}
export interface RiskDisclosure {
    riskLevel: RiskLevel;
    factors: RiskFactors;
    description: string;
    potentialIssues: string[];
    recommendedActions: string[];
    requireConfirmation: boolean;
    checkpoint?: string;
}
/**
 * 分析操作风险等级
 */
export declare function analyzeRiskLevel(factors: RiskFactors): RiskLevel;
/**
 * 生成风险告知书
 */
export declare function generateRiskDisclosure(factors: RiskFactors): RiskDisclosure;
/**
 * 格式化风险告知书为CLI友好的格式
 */
export declare function formatRiskDisclosureCLI(disclosure: RiskDisclosure): string;
/**
 * 从解析的thought生成风险因素
 */
export declare function extractRiskFactorsFromThought(thought: string): RiskFactors;
