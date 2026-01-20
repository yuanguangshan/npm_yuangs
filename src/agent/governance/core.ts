import { ProposedAction } from '../state';

export interface PolicyRule {
    id: string;
    when: { type?: string; pattern?: string; max_per_minute?: number };
    effect: 'allow' | 'deny' | 'require_approval';
    reason?: string;
}

export interface RiskEntry {
    ts: number;
    actionType: string;
}

export function evaluateProposal(
    action: ProposedAction,
    rules: PolicyRule[],
    ledger: RiskEntry[]
): { effect: string; reason?: string } {
    const now = Date.now();
    for (const rule of rules) {
        const typeMatch = !rule.when.type || rule.when.type === action.type;
        const payloadStr = JSON.stringify(action.payload);
        const patternMatch = !rule.when.pattern || new RegExp(rule.when.pattern, 'i').test(payloadStr);

        if (typeMatch && patternMatch) {
            if (rule.when.max_per_minute) {
                const count = ledger.filter(e => e.ts > now - 60000 && e.actionType === action.type).length;
                if (count >= rule.when.max_per_minute) return { effect: 'deny', reason: `Rate limit: ${rule.id}` };
            }
            return { effect: rule.effect, reason: rule.reason };
        }
    }
    return { effect: 'require_approval', reason: 'Default human review required' };
}
