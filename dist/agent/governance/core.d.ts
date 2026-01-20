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
/**
 * 核心裁决函数 (未来可直接编译为 WASM)
 * 输入：提案、策略集、历史账本
 * 输出：决定
 */
export declare function evaluateProposal(action: ProposedAction, rules: PolicyRule[], ledger: RiskEntry[]): {
    effect: string;
    reason?: string;
};
