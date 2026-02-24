import { ProposedAction, GovernanceDecision } from './state';
import { PolicyRule, RiskEntry } from './governance/core';
import { RiskScoringModel } from './governance/riskScoring';
export declare class GovernanceService {
    private static rules;
    private static ledger;
    private static riskModel;
    private static initialized;
    private static currentUserId?;
    static init(): Promise<void>;
    /**
     * 设置当前用户 ID（用于信任度评估）
     */
    static setUserId(userId: string): void;
    /**
     * 获取风险评分模型（用于信任度更新等操作）
     */
    static getRiskModel(): RiskScoringModel;
    private static loadPolicy;
    static getRules(): PolicyRule[];
    static getLedgerSnapshot(): RiskEntry[];
    static getPolicyManual(): string;
    static adjudicate(action: ProposedAction): Promise<GovernanceDecision>;
    /**
     * 获取主要风险原因（用于拒绝消息）
     */
    private static getPrimaryRiskReason;
    /**
     * 获取用户信任度统计
     */
    static getUserTrustStats(): Map<string, {
        trust: number;
        lastSeen: number;
    }>;
    /**
     * 重置用户信任度
     */
    static resetUserTrust(userId?: string): void;
}
