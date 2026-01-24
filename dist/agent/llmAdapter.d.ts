import { AgentThought } from './state';
import type { AIRequestMessage } from '../core/validation';
import { ContextManager } from './contextManager';
export declare class LLMAdapter {
    static think(messages: AIRequestMessage[], mode?: 'chat' | 'command' | 'command+exec', onChunk?: (chunk: string, type?: 'thought' | 'json') => void, model?: string, customSystemPrompt?: string, contextManager?: ContextManager): Promise<AgentThought>;
    static parseThought(raw: string): AgentThought;
}
