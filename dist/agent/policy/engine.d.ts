import { Policy, PolicyContext, PolicyResult } from './types';
import { RiskLevel, ProposedAction } from '../state';
export declare class PolicyEngine {
    private policies;
    registerPolicy(policy: Policy): void;
    unregisterPolicy(name: string): void;
    evaluate(context: PolicyContext): Promise<PolicyResult>;
    evaluateRisk(action: ProposedAction): RiskLevel;
    private containsDangerousCommand;
}
export declare const policyEngine: PolicyEngine;
