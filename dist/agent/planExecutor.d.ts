import { AgentPlan } from './plan';
export interface PlanExecutionSummary {
    success: boolean;
    completedCount: number;
    totalCount: number;
}
export declare function executePlan(plan: AgentPlan, options?: {
    autoYes?: boolean;
    verbose?: boolean;
}): Promise<PlanExecutionSummary>;
