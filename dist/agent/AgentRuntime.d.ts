import { StreamMarkdownRenderer } from '../utils/renderer';
/**
 * Agent orchestration runtime — coordinates LLM calls, governance,
 * pre-flight checks, and execution via delegated components.
 */
export declare class AgentRuntime {
    private context;
    private executionId;
    private readonly maxTurns;
    private llmCaller;
    private preFlight;
    private execHandler;
    constructor(initialContext: any);
    run(userInput: string, mode?: "chat" | "command", onChunk?: (chunk: string) => void, model?: string, renderer?: StreamMarkdownRenderer): Promise<void>;
    private prepareRenderer;
    private buildAction;
}
