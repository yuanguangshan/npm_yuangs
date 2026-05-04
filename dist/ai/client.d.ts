import { type AIRequestMessage, type UserConfig } from '../core/validation';
export declare function getUserConfig(): UserConfig;
export declare function addToConversationHistory(role: 'system' | 'user' | 'assistant', content: string): void;
export declare function clearConversationHistory(): void;
export declare function getConversationHistory(): AIRequestMessage[];
export declare function askAI(prompt: string, model?: string): Promise<string>;
export declare function callAI_Stream(messages: AIRequestMessage[], model: string | undefined, onChunk: (content: string) => void): Promise<void>;
