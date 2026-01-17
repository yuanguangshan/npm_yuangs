import { AgentInput, AgentMode, AgentPrompt, LLMResult, AgentAction } from './types';
export interface ExecutionRecord {
    id: string;
    timestamp: number;
    mode: AgentMode;
    input: AgentInput;
    prompt: AgentPrompt;
    model: string;
    llmResult: LLMResult;
    action: AgentAction;
}
export declare function saveRecord(record: ExecutionRecord): void;
export declare function getRecords(): ExecutionRecord[];
export declare function getRecordById(id: string): ExecutionRecord | undefined;
