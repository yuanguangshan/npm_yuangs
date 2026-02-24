"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartContextManager = void 0;
const contextManager_1 = require("./contextManager");
const relevance_1 = require("./relevance");
const contextStorage_1 = require("../commands/contextStorage");
class SmartContextManager extends contextManager_1.ContextManager {
    cachedRankedItems = [];
    cachedQuery = '';
    // 访问跟踪节流相关
    pendingAccessUpdates = new Map();
    throttleTimer = null;
    THROTTLE_DELAY_MS = 5000; // 5秒节流延迟
    MAX_PENDING_UPDATES = 50; // 最大待更新数量
    async getEnhancedContext(options) {
        const { query, minRelevance = 0.3, maxTokens = 10000, enableSmartSummary = true, enableAccessTracking = true, intent: explicitIntent } = options;
        // 检测或使用显式指定的意图
        const detectedIntent = explicitIntent || (0, relevance_1.detectQueryIntent)(query);
        const intentWeights = relevance_1.INTENT_WEIGHTS[detectedIntent];
        const messages = this.getMessages();
        let contextItems = messages
            .filter(m => m.role === 'user')
            .map(m => ({
            path: this.extractPathFromMessage(m.content) || '',
            content: m.content
        }))
            .filter(item => item.path && item.path.length > 0);
        const persistedItems = await this.loadPersistedContext();
        if (persistedItems.length > 0) {
            const persistedContextItems = persistedItems
                .map((item) => ({
                path: item.path,
                content: item.content || item.summary || ''
            }))
                .filter((item) => item.path && item.path.length > 0);
            contextItems = [...contextItems, ...persistedContextItems];
        }
        // 使用意图相关的权重进行排序
        const rankedItems = (0, relevance_1.rankByRelevance)(contextItems, query, intentWeights);
        this.cachedRankedItems = rankedItems;
        this.cachedQuery = query;
        const filteredItems = (0, relevance_1.filterContextByRelevance)(contextItems, query, minRelevance, intentWeights);
        let finalItems = filteredItems;
        if (maxTokens > 0) {
            const totalTokens = (0, relevance_1.calculateTotalTokens)(finalItems);
            if (totalTokens > maxTokens) {
                const ratio = maxTokens / totalTokens;
                finalItems = finalItems.slice(0, Math.ceil(finalItems.length * ratio));
            }
        }
        const summary = enableSmartSummary ? this.buildSmartSummary(query, finalItems, contextItems) : '';
        // 访问跟踪：更新被访问项目的时间戳和访问计数
        if (enableAccessTracking && filteredItems.length > 0) {
            await this.updateAccessTracking(filteredItems);
        }
        return {
            rankedItems,
            summary,
            filteredCount: finalItems.length,
            totalCount: contextItems.length,
            detectedIntent
        };
    }
    extractPathFromMessage(content) {
        const pathMatch = content.match(/@([^\s]+)/);
        return pathMatch ? pathMatch[1] : undefined;
    }
    async loadPersistedContext() {
        try {
            return (await (0, contextStorage_1.loadContext)()) || [];
        }
        catch (error) {
            return [];
        }
    }
    /**
     * 更新访问跟踪信息（带节流）
     * 使用节流机制批量更新，避免频繁磁盘 I/O
     *
     * 策略：
     * 1. 将更新先缓存到内存中
     * 2. 当待更新数量超过阈值或超过节流时间时，批量保存
     * 3. 立即返回，不阻塞主流程
     */
    async updateAccessTracking(accessedItems) {
        if (accessedItems.length === 0)
            return;
        const now = Date.now();
        let shouldFlush = false;
        // 缓存更新到内存
        for (const item of accessedItems) {
            const existing = this.pendingAccessUpdates.get(item.path);
            if (existing) {
                existing.accessCount += 1;
                existing.lastUsedAt = now;
            }
            else {
                this.pendingAccessUpdates.set(item.path, {
                    lastUsedAt: now,
                    accessCount: 1
                });
            }
            // 检查是否达到刷新阈值
            if (this.pendingAccessUpdates.size >= this.MAX_PENDING_UPDATES) {
                shouldFlush = true;
            }
        }
        // 如果需要立即刷新，使用 try-catch 包裹以防止未处理的 Promise 拒绝
        if (shouldFlush) {
            try {
                await this.flushPendingUpdates();
            }
            catch (error) {
                // 静默失败，错误已在 flushPendingUpdates 中记录
                console.debug('Flush failed in updateAccessTracking:', error);
            }
        }
        else if (!this.throttleTimer) {
            this.throttleTimer = setTimeout(() => {
                this.flushPendingUpdates().catch(err => {
                    console.debug('Failed to flush pending updates:', err);
                });
            }, this.THROTTLE_DELAY_MS);
        }
    }
    /**
     * 刷新待更新的访问跟踪信息到持久化存储
     */
    async flushPendingUpdates() {
        // 清除节流定时器
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = null;
        }
        // 如果没有待更新，直接返回
        if (this.pendingAccessUpdates.size === 0)
            return;
        try {
            const allItems = await (0, contextStorage_1.loadContext)();
            if (!allItems || allItems.length === 0) {
                this.pendingAccessUpdates.clear();
                return;
            }
            let hasChanges = false;
            // 批量更新
            for (const item of allItems) {
                const update = this.pendingAccessUpdates.get(item.path);
                if (update) {
                    item.lastUsedAt = update.lastUsedAt;
                    item.accessCount = (item.accessCount || 1) + update.accessCount;
                    hasChanges = true;
                }
            }
            // 保存并清空缓存
            if (hasChanges) {
                await (0, contextStorage_1.saveContext)(allItems);
            }
        }
        catch (error) {
            console.debug('Failed to flush pending updates:', error);
        }
        finally {
            this.pendingAccessUpdates.clear();
        }
    }
    buildSmartSummary(query, items, allItems) {
        if (items.length === 0) {
            return '';
        }
        const highRelevance = items.filter(i => i.relevance > 0.8);
        const mediumRelevance = items.filter(i => i.relevance > 0.5 && i.relevance <= 0.8);
        let summary = '【上下文概览】\n';
        summary += `- 总文件: ${allItems.length}\n`;
        summary += `- 已筛选: ${items.length}\n`;
        summary += `- 高度相关 (>0.8): ${highRelevance.length}\n`;
        summary += `- 中度相关 (0.5-0.8): ${mediumRelevance.length}\n\n`;
        if (highRelevance.length > 0) {
            summary += '【高度相关文件】\n';
            highRelevance.slice(0, 5).forEach(item => {
                summary += `  - ${item.path} (相关度: ${(item.relevance * 100).toFixed(0)}%)\n`;
            });
            if (highRelevance.length > 5) {
                summary += `  ... 还有 ${highRelevance.length - 5} 个\n`;
            }
        }
        if (mediumRelevance.length > 0 && mediumRelevance.length <= 3) {
            summary += '\n【中度相关文件】\n';
            mediumRelevance.forEach(item => {
                summary += `  - ${item.path} (相关度: ${(item.relevance * 100).toFixed(0)}%)\n`;
            });
        }
        return summary;
    }
    getCachedRankedItems() {
        return this.cachedRankedItems;
    }
    getCachedQuery() {
        return this.cachedQuery;
    }
    clearCache() {
        this.cachedRankedItems = [];
        this.cachedQuery = '';
    }
}
exports.SmartContextManager = SmartContextManager;
//# sourceMappingURL=smartContextManager.js.map