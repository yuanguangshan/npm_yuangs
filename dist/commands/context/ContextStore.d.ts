import { ContextItem, ContextStatus, DriftReport } from './ContextTypes';
export declare class ContextStore {
    private items;
    private maxTokens;
    add(item: ContextItem): void;
    update(id: string, patch: Partial<ContextItem>): void;
    remove(id: string): void;
    get(id: string): ContextItem | undefined;
    list(status?: ContextStatus): {
        index: number;
        source: import("./ContextTypes").ContextSource;
        path: string;
        alias: string | undefined;
        tokens: number;
        importance: string;
        pinned: string;
        ageMin: number;
        summary: string | undefined;
        status: ContextStatus;
    }[];
    all(): ContextItem[];
    clear(): void;
    isEmpty(): boolean;
    totalTokens(): number;
    enforceTTL(now?: number): void;
    gc(): void;
    /** @deprecated 优先使用 detectDriftAsync，避免同步阻塞 */
    detectDrift(): DriftReport[];
    detectDriftAsync(): Promise<DriftReport[]>;
    markAsDrifted(id: string): void;
    refreshItem(id: string): void;
    refreshItemAsync(id: string): Promise<void>;
    export(): ContextItem[];
    import(items: any[]): void;
}
