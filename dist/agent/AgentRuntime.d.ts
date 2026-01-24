import { StreamMarkdownRenderer } from '../utils/renderer';
export declare class AgentRuntime {
    private context;
    private executionId;
    constructor(initialContext: any);
    run(userInput: string, mode?: "chat" | "command", onChunk?: (chunk: string) => void, model?: string, renderer?: StreamMarkdownRenderer): Promise<void>;
}
