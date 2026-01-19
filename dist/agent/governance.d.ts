import { ProposedAction, GovernanceDecision, RiskLevel } from './state';
export declare class GovernanceService {
    static adjudicate(action: ProposedAction, config?: {
        autoApproveLowRisk: boolean;
    }): Promise<GovernanceDecision>;
    private static askHuman;
    private static printActionDetails;
    static evaluateRisk(action: ProposedAction): RiskLevel;
    private static containsDangerousCommand;
}
