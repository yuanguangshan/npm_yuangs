import { ContextManager } from './contextManager';
import { rankByRelevance, filterContextByRelevance, calculateTotalTokens, RankedContextItem } from './relevance';

export interface EnhancedContextOptions {
  query: string;
  minRelevance?: number;
  maxTokens?: number;
  enableSmartSummary?: boolean;
}

export class SmartContextManager extends ContextManager {
  private cachedRankedItems: RankedContextItem[] = [];
  private cachedQuery: string = '';

  async getEnhancedContext(options: EnhancedContextOptions): Promise<{
    rankedItems: RankedContextItem[];
    summary: string;
    filteredCount: number;
    totalCount: number;
  }> {
    const { query, minRelevance = 0.3, maxTokens = 10000, enableSmartSummary = true } = options;

    const messages = this.getMessages();

    const contextItems = messages
      .filter(m => m.role === 'user')
      .map(m => ({
        path: this.extractPathFromMessage(m.content) || '',
        content: m.content
      }))
      .filter(item => item.path && item.path.length > 0);

    const rankedItems = await rankByRelevance(contextItems, query);
    this.cachedRankedItems = rankedItems;
    this.cachedQuery = query;

    const filteredItems = filterContextByRelevance(
      contextItems,
      query,
      minRelevance
    );

    let finalItems = filteredItems;

    if (maxTokens > 0) {
      const totalTokens = calculateTotalTokens(finalItems);

      if (totalTokens > maxTokens) {
        const ratio = maxTokens / totalTokens;
        finalItems = finalItems.slice(0, Math.ceil(finalItems.length * ratio));
      }
    }

    const summary = enableSmartSummary ? this.buildSmartSummary(query, finalItems, contextItems) : '';

    return {
      rankedItems,
      summary,
      filteredCount: finalItems.length,
      totalCount: contextItems.length
    };
  }

  private extractPathFromMessage(content: string): string | undefined {
    const pathMatch = content.match(/@([^\s]+)/);
    return pathMatch ? pathMatch[1] : undefined;
  }

  private buildSmartSummary(
    query: string,
    items: RankedContextItem[],
    allItems: any[]
  ): string {
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

  getCachedRankedItems(): RankedContextItem[] {
    return this.cachedRankedItems;
  }

  getCachedQuery(): string {
    return this.cachedQuery;
  }

  clearCache(): void {
    this.cachedRankedItems = [];
    this.cachedQuery = '';
  }
}
