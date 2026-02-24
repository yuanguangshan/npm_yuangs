import { ContextManager } from './contextManager';
import { RankedContextItem, QueryIntent } from './relevance';
export interface EnhancedContextOptions {
    query: string;
    minRelevance?: number;
    maxTokens?: number;
    enableSmartSummary?: boolean;
    enableAccessTracking?: boolean;
    intent?: QueryIntent;
}
export declare class SmartContextManager extends ContextManager {
    private cachedRankedItems;
    private cachedQuery;
    private pendingAccessUpdates;
    private throttleTimer;
    private readonly THROTTLE_DELAY_MS;
    private readonly MAX_PENDING_UPDATES;
    getEnhancedContext(options: EnhancedContextOptions): Promise<{
        rankedItems: RankedContextItem[];
        summary: string;
        filteredCount: number;
        totalCount: number;
        detectedIntent: QueryIntent;
    }>;
    private extractPathFromMessage;
    private loadPersistedContext;
    /**
     * 更新访问跟踪信息（带节流）
     * 使用节流机制批量更新，避免频繁磁盘 I/O
     *
     * 策略：
     * 1. 将更新先缓存到内存中
     * 2. 当待更新数量超过阈值或超过节流时间时，批量保存
     * 3. 立即返回，不阻塞主流程
     */
    private updateAccessTracking;
    /**
     * 刷新待更新的访问跟踪信息到持久化存储
     */
    private flushPendingUpdates;
    private buildSmartSummary;
    getCachedRankedItems(): RankedContextItem[];
    getCachedQuery(): string;
    clearCache(): void;
}
