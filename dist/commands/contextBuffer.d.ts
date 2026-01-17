export type ContextItem = {
    type: 'file' | 'directory';
    path: string;
    alias?: string;
    content: string;
    summary?: string;
    tokens: number;
};
export declare class ContextBuffer {
    private items;
    private maxTokens;
    add(item: Omit<ContextItem, 'tokens'>): void;
    clear(): void;
    list(): {
        index: number;
        type: "file" | "directory";
        path: string;
        alias: string | undefined;
        tokens: number;
        summary: string | undefined;
    }[];
    isEmpty(): boolean;
    export(): ContextItem[];
    import(items: ContextItem[]): void;
    private totalTokens;
    private trimIfNeeded;
    buildPrompt(userInput: string): string;
}
