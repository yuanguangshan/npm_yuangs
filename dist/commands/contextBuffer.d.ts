export type ContextItem = {
    id: string;
    type: 'file' | 'directory' | 'memory' | 'antipattern';
    path: string;
    alias?: string;
    content?: string;
    summary?: string;
    tokens: number;
    importance: number;
    lastUsedAt: number;
    pinned?: boolean;
    tags?: string[];
    decayRate?: number;
};
export declare class ContextBuffer {
    private items;
    private maxTokens;
    add(item: Partial<ContextItem> & {
        type: ContextItem['type'];
        path: string;
    }, bypassTokenLimit?: boolean): void;
    clear(): void;
    list(): {
        index: number;
        type: "file" | "directory" | "memory" | "antipattern";
        path: string;
        alias: string | undefined;
        tokens: number;
        importance: string;
        pinned: string;
        ageMin: number;
        summary: string | undefined;
    }[];
    isEmpty(): boolean;
    export(): ContextItem[];
    import(items: ContextItem[]): void;
    private totalTokens;
    private computeImportance;
    private decay;
    private trimIfNeeded;
    optimizeForTokens(ratio: number): void;
    promoteToMemoryIfNeeded(): void;
    buildPrompt(userInput: string): string;
}
