export declare class LLMAdapter {
    static think(messages: any[], model: string, onChunk?: (s: string) => void, customSystemPrompt?: string): Promise<{
        raw: string;
        isDone: any;
        type: any;
        payload: any;
        reasoning: any;
        parsedPlan: any;
    }>;
    private static parseThought;
}
