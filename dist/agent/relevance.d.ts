export interface ContextItem {
    path: string;
    content?: string;
    summary?: string;
}
export interface RankedContextItem extends ContextItem {
    relevance: number;
    matchReasons: string[];
}
export interface RelevanceConfig {
    keywordsWeight: number;
    pathWeight: number;
    extensionWeight: number;
    recencyWeight: number;
}
export declare function rankByRelevance(items: ContextItem[], query: string, config?: Partial<RelevanceConfig>): RankedContextItem[];
export declare function calculateTotalTokens(items: ContextItem[]): number;
export declare function filterContextByRelevance(items: ContextItem[], query: string, minRelevance?: number, config?: Partial<RelevanceConfig>): RankedContextItem[];
