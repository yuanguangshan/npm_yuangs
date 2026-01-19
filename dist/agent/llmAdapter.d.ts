import { AgentThought } from './state';
import type { AIRequestMessage } from '../core/validation';
export declare class LLMAdapter {
    static think(messages: AIRequestMessage[], mode: 'chat' | 'command' | 'command+exec', outputSchema?: any): Promise<AgentThought>;
    private static parseThought;
}
