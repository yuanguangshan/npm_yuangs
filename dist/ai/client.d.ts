export declare function addToConversationHistory(role: string, content: string): void;
export declare function clearConversationHistory(): void;
export declare function getConversationHistory(): {
    role: string;
    content: string;
}[];
export declare function getUserConfig(): any;
export declare function askAI(prompt: string, model?: string): Promise<string>;
export declare function callAI_Stream(messages: any[], model: string | undefined, onChunk: (content: string) => void): Promise<void>;
