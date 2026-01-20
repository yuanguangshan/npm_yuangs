import { GovernedAction, GovernanceState, ExecutionContext, ExecutionResult, Observation, ActionSummary, ApprovalSource, ActionProvenance } from "../GovernedAction";
/**
 * Payload for code change actions
 * Contains unified diff and affected files
 */
export interface CodeChangePayload {
    files: string[];
    diff: string;
}
export declare class CodeChangeAction implements GovernedAction<CodeChangePayload> {
    readonly id: string;
    readonly payload: CodeChangePayload;
    readonly rationale: string;
    readonly provenance: ActionProvenance;
    readonly kind = "code_change";
    state: GovernanceState;
    updatedAt: number;
    constructor(id: string, payload: CodeChangePayload, rationale: string, provenance: ActionProvenance);
    propose(): void;
    approve(by: ApprovalSource): void;
    reject(reason: string): void;
    execute(ctx: ExecutionContext): Promise<ExecutionResult>;
    observe(): Promise<Observation>;
    verify(obs: Observation): boolean;
    summarize(): ActionSummary;
    private calculateChangeSize;
    static create(payload: CodeChangePayload, rationale: string, agentId: string, planHash: string, parentAction?: string): CodeChangeAction;
}
