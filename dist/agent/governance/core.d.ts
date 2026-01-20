import { ProposedAction } from '../state';
export interface PolicyRule {
    id: string;
    when: {
        type?: string;
        pattern?: string;
        max_per_minute?: number;
    };
    effect: 'allow' | 'deny' | 'require_approval';
    reason?: string;
}
export interface RiskEntry {
    ts: number;
    actionType: string;
}
export declare function evaluateProposal(action: ProposedAction, rules: PolicyRule[], ledger: RiskEntry[]): {
    effect: string;
    reason?: string;
};
