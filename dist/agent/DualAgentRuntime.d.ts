import { TaskStep } from './types';
import { PlanCache } from './PlanCache';
export declare class DualAgentRuntime {
    private context;
    private executionId;
    private steps;
    private currentIndex;
    private planCache;
    constructor(initialContext: any, planCache?: PlanCache);
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
    /**
     * 获取计划缓存统计
     */
    getPlanCacheStats(): import("./PlanCache").CacheStats;
    /**
     * 清理计划缓存
     */
    clearPlanCache(): void;
    /**
     * 清理过期的计划缓存
     */
    cleanupPlanCache(): number;
}
