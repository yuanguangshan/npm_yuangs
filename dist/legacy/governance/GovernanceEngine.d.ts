import { GovernedAction, ExecutionContext, ApprovalSource } from "./GovernedAction";
/**
 * Governance engine - single point of control for all governed actions
 * Enforces "No Diff Without Review. No Execution Without Approval."
 */
export declare class GovernanceEngine {
    private actions;
    private revokedActions;
    register(action: GovernedAction): void;
    getAction(id: string): GovernedAction | undefined;
    listActions(): GovernedAction[];
    requestApproval(id: string): void;
    approve(id: string, by: ApprovalSource): void;
    reject(id: string, reason: string): void;
    execute(id: string, ctx: ExecutionContext): Promise<void>;
    observe(id: string): Promise<void>;
    verify(id: string, obs: any): boolean;
    revoke(id: string): void;
    has(id: string): boolean;
}
