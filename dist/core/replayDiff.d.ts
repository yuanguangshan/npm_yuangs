import { ExecutionRecord } from './executionRecord';
export interface ReplayDiffResult {
    decisionDiff: DecisionDiff;
    modelDiff: ModelDiff;
    skillsDiff: SkillsDiff;
}
interface DecisionDiff {
    changed: boolean;
    strategyChanged: boolean;
    modelChanged: boolean;
    reasonChanged: boolean;
    before?: {
        strategy: string;
        selectedModel: string;
        reason: string;
    };
    after?: {
        strategy: string;
        selectedModel: string;
        reason: string;
    };
}
interface ModelDiff {
    changed: boolean;
    nameChanged: boolean;
    providerChanged: boolean;
    before?: {
        name: string;
        provider: string;
        contextWindow: number | string;
        costProfile: string;
    };
    after?: {
        name: string;
        provider: string;
        contextWindow: number | string;
        costProfile: string;
    };
}
interface SkillsDiff {
    added: SkillChange[];
    removed: SkillChange[];
    changed: SkillChange[];
}
interface SkillChange {
    name: string;
    score?: number;
    enabled?: boolean;
    confidence?: number;
    successRate?: number;
    lastUsed?: string;
}
export declare function diffExecution(original: ExecutionRecord, current: ExecutionRecord): ReplayDiffResult;
export declare function formatReplayDiff(diff: ReplayDiffResult): string;
export {};
