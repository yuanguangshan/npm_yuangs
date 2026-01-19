import type { CompletionItem } from './types';
export declare class CompletionCache {
    private static instance;
    private cache;
    private timestamp;
    private readonly ttl;
    private constructor();
    static getInstance(): CompletionCache;
    get(key: string): CompletionItem[] | null;
    set(key: string, items: CompletionItem[]): void;
    invalidate(): void;
    invalidatePattern(pattern: RegExp): void;
}
