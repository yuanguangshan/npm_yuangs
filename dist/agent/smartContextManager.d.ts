import { ContextManager } from './contextManager';
import { RankedContextItem } from './relevance';
export interface EnhancedContextOptions {
    query: string;
    minRelevance?: number;
    maxTokens?: number;
    enableSmartSummary?: boolean;
}
export declare class SmartContextManager extends ContextManager {
    private cachedRankedItems;
    private cachedQuery;
    getEnhancedContext(options: EnhancedContextOptions): Promise<{
        rankedItems: RankedContextItem[];
        summary: string;
        filteredCount: number;
        totalCount: number;
    }>;
    private extractPathFromMessage;
    private buildSmartSummary;
    getCachedRankedItems(): RankedContextItem[];
    getCachedQuery(): string;
    clearCache(): void;
}
