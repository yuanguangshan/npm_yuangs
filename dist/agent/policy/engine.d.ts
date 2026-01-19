import { Policy, PolicyContext, PolicyResult } from './types';
import { RiskLevel } from '../state';
export declare class PolicyEngine {
    private policies;
    registerPolicy(policy: Policy): void;
    unregisterPolicy(name: string): void;
    evaluate(context: PolicyContext): Promise<PolicyResult>;
    evaluateRisk(action: {
        type: string;
        payload: any;
    }): RiskLevel;
    private containsDangerousCommand;
}
export declare const policyEngine: PolicyEngine;
