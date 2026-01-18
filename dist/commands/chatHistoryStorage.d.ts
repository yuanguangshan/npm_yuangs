import { AIRequestMessage } from '../core/validation';
export declare function loadChatHistory(): Promise<AIRequestMessage[]>;
export declare function saveChatHistory(history: AIRequestMessage[]): Promise<void>;
export declare function clearChatHistory(): Promise<void>;
