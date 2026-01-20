import { ProposedAction, GovernanceDecision } from './state';
import { PolicyRule } from './governance/core';
export declare class GovernanceService {
    private static engine;
    private static ledger;
    private static wasmBridge;
    private static wasmInited;
    /**
     * 将复杂的 YAML 规则简化为 AI 可理解的陈述句
     */
    static getPolicyManual(): string;
    static getRules(): PolicyRule[];
    static getLedgerSnapshot(): import("./governance/core").RiskEntry[];
    static adjudicate(action: ProposedAction): Promise<GovernanceDecision>;
    static evaluateRisk(action: any): 'low' | 'medium' | 'high';
    private static ask;
}
