import { CapabilityRequirement, ModelCapabilities, CapabilityMatchResult } from './modelMatcher';
import { ReplayOptions, ReplayResult } from './replayEngine';
export declare class CapabilitySystem {
    private primaryModels;
    private fallbackModels;
    constructor();
    private initializeDefaultModels;
    matchCapability(requirement: CapabilityRequirement): CapabilityMatchResult;
    loadCustomModels(): ModelCapabilities[];
    getAllModels(): ModelCapabilities[];
    createAndSaveExecutionRecord(commandName: string, requirement: CapabilityRequirement, matchResult: CapabilityMatchResult, command?: string, rawInput?: string, mode?: string): string;
    replayExecution(recordId: string, options: ReplayOptions): Promise<ReplayResult>;
    explainConfig(): string;
}
export declare const capabilitySystem: CapabilitySystem;
