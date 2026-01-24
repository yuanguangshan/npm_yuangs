import { TaskStep } from './types';
export declare class DualAgentRuntime {
    private context;
    private executionId;
    private steps;
    private currentIndex;
    constructor(initialContext: any);
    run(userInput: string, onChunk?: (chunk: string) => void, model?: string): Promise<void>;
    private shouldUsePlanner;
    private assessComplexity;
    private runFastPath;
    private runPlannedPath;
    private callPlanner;
    private buildPlannerPrompt;
    private getContextSummary;
    private executeStep;
    private importAgentRuntime;
    private askUser;
    getExecutionState(): {
        steps: TaskStep[];
        currentIndex: number;
    };
}
