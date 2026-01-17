import { AgentPrompt, LLMResult } from './types';
export declare function runLLM({ prompt, model, stream, onChunk, }: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string) => void;
}): Promise<LLMResult>;
