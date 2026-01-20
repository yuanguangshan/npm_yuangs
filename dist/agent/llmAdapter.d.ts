import { AgentThought } from './state';
import type { AIRequestMessage } from '../core/validation';
export declare class LLMAdapter {
    static think(messages: AIRequestMessage[], mode?: 'chat' | 'command' | 'command+exec', onChunk?: (chunk: string) => void, model?: string, customSystemPrompt?: string): Promise<AgentThought>;
    private static parseThought;
}
