import { MergedConfig } from './configMerge';
import { ModelCapabilities, CapabilityMatchExplanation } from './modelMatcher';
import { CapabilityRequirement } from './modelMatcher';
import { Skill } from '../agent/skills';
export interface ExecutionMeta {
    commandName: string;
    timestamp: string;
    toolVersion: string;
    projectPath: string;
    args?: any;
    rawInput?: string;
    replayable?: boolean;
    version?: string;
}
export interface CapabilityIntent {
    required: string[];
    preferred: string[];
    capabilityVersion: string;
}
export interface ModelDecision {
    candidateModels: CapabilityMatchExplanation[];
    selectedModel: ModelCapabilities | null;
    usedFallback: boolean;
    fallbackReason?: string;
    strategy?: string;
    reason?: string;
    skills?: Skill[];
}
export interface ExecutionOutcome {
    success: boolean;
    failureReason?: 'capability-mismatch' | 'provider-error' | 'user-abort' | 'timeout' | 'other';
    tokenCount?: number;
    latencyMs?: number;
}
export interface ExecutionRecord {
    id: string;
    meta: ExecutionMeta;
    intent: CapabilityIntent;
    configSnapshot: MergedConfig;
    decision: ModelDecision;
    outcome: ExecutionOutcome;
    command?: string;
}
export declare function createExecutionId(): string;
export declare function createExecutionRecord(commandName: string, requirement: CapabilityRequirement, config: MergedConfig, matchResult: any, outcome?: Partial<ExecutionOutcome>, command?: string): ExecutionRecord;
export declare function serializeExecutionRecord(record: ExecutionRecord): string;
export declare function deserializeExecutionRecord(json: string): ExecutionRecord;
