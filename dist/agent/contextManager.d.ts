import { GovernanceContext } from './state';
export declare class ContextManager {
    private messages;
    private maxHistorySize;
    constructor(initialContext?: GovernanceContext);
    addMessage(role: string, content: string): void;
    addToolResult(toolName: string, result: string): void;
    addObservation(observation: string): void;
    getMessages(): Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: string;
    }>;
    getRecentMessages(count: number): Array<{
        role: string;
        content: string;
        timestamp: number;
    }>;
    getHash(): string;
    getSnapshot(): {
        inputHash: string;
        systemPromptVersion: string;
        toolSetVersion: string;
        recentMessages: {
            role: string;
            content: string;
            timestamp: number;
        }[];
    };
    clear(): void;
}
