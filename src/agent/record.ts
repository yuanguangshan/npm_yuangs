import {
    AgentInput,
    AgentMode,
    AgentPrompt,
    LLMResult,
    AgentAction,
} from './types';

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

const records: ExecutionRecord[] = [];

export function saveRecord(record: ExecutionRecord) {
    records.push(record);
    // Keep only last 100 records in memory
    if (records.length > 100) {
        records.shift();
    }
}

export function getRecords(): ExecutionRecord[] {
    return [...records];
}

export function getRecordById(id: string): ExecutionRecord | undefined {
    return records.find(r => r.id === id);
}
