import { evaluateProposal, PolicyRule, RiskEntry } from '../../../src/agent/governance/core';
import { ProposedAction } from '../../../src/agent/state';

describe('Governance Core', () => {
    const rules: PolicyRule[] = [
        {
            id: 'block-rm-rf',
            when: { pattern: 'rm -rf /' },
            effect: 'deny',
            reason: 'Destructive command blocked'
        },
        {
            id: 'allow-read',
            when: { type: 'tool_call', pattern: 'read_file' },
            effect: 'allow',
            reason: 'Safe read allowed'
        },
        {
            id: 'rate-limit-shell',
            when: { type: 'shell_cmd', max_per_minute: 2 },
            effect: 'allow',
            reason: 'Shell with rate limit'
        }
    ];

    it('should deny matching patterns', () => {
        const action: ProposedAction = {
            id: '1',
            type: 'shell_cmd',
            payload: { command: 'rm -rf /' },
            riskLevel: 'high',
            reasoning: 'test'
        };
        const result = evaluateProposal(action, rules, []);
        expect(result.effect).toBe('deny');
        expect(result.reason).toBe('Destructive command blocked');
    });

    it('should allow explicitly matching rules', () => {
        const action: ProposedAction = {
            id: '2',
            type: 'tool_call',
            payload: { tool_name: 'read_file', parameters: { path: 'test.ts' } },
            riskLevel: 'low',
            reasoning: 'test'
        };
        const result = evaluateProposal(action, rules, []);
        expect(result.effect).toBe('allow');
    });

    it('should enforce rate limits', () => {
        const action: ProposedAction = {
            id: '3',
            type: 'shell_cmd',
            payload: { command: 'ls' },
            riskLevel: 'low',
            reasoning: 'test'
        };
        const ledger: RiskEntry[] = [
            { ts: Date.now() - 1000, actionType: 'shell_cmd' },
            { ts: Date.now() - 2000, actionType: 'shell_cmd' }
        ];
        const result = evaluateProposal(action, rules, ledger);
        expect(result.effect).toBe('deny');
        expect(result.reason).toContain('Rate limit');
    });

    it('should fall back to human approval for unknown actions', () => {
        const action: ProposedAction = {
            id: '4',
            type: 'shell_cmd',
            payload: { command: 'unknown' },
            riskLevel: 'medium',
            reasoning: 'test'
        };
        const result = evaluateProposal(action, [], []);
        expect(result.effect).toBe('require_approval');
    });
});
