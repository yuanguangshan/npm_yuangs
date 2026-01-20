import { ProposedAction, GovernanceDecision } from './state';
import { PolicyRule, RiskEntry } from './governance/core';
export declare class GovernanceService {
    private static rules;
    private static ledger;
    private static initialized;
    static init(): Promise<void>;
    private static loadPolicy;
    static getRules(): PolicyRule[];
    static getLedgerSnapshot(): RiskEntry[];
    static getPolicyManual(): string;
    static adjudicate(action: ProposedAction): Promise<GovernanceDecision>;
}
