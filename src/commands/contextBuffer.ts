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

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export class ContextBuffer {
    private items: ContextItem[] = [];
    private maxTokens = 100000;

    add(
        item: Partial<ContextItem> & { type: ContextItem['type']; path: string },
        bypassTokenLimit = false
    ) {
        const text = item.content ?? item.summary ?? '';
        const tokens = estimateTokens(text);

        // 查找是否已存在相同路径和类型的项
        const existingIndex = this.items.findIndex(
            i => i.path === item.path && i.type === item.type
        );

        if (existingIndex !== -1) {
            // 更新现有项
            this.items[existingIndex] = {
                ...this.items[existingIndex],
                ...item,
                tokens,
                lastUsedAt: Date.now()
            };
        } else {
            // 添加新项
            const itemId = item.id || `${item.type}:${item.path}`;
            const full: ContextItem = {
                ...item,
                id: itemId,
                tokens,
                importance: 0.5,
                lastUsedAt: Date.now()
            };

            this.items.push(full);
        }

        if (!bypassTokenLimit) {
            this.trimIfNeeded();
        }
    }

    clear() {
        this.items = [];
    }

    list() {
        return this.items.map((item, i) => ({
            index: i + 1,
            type: item.type,
            path: item.path,
            alias: item.alias,
            tokens: item.tokens,
            importance: item.importance.toFixed(2),
            pinned: item.pinned ? '📌' : '',
            ageMin: Math.floor((Date.now() - item.lastUsedAt) / 60000),
            summary: item.summary
        }));
    }

    isEmpty() {
        return this.items.length === 0;
    }

    export() {
        return this.items;
    }

    import(items: ContextItem[]) {
        const uniqueItems = new Map<string, ContextItem>();
        
        items.forEach(i => {
            const key = `${i.type}:${i.path}`;
            const item = {
                ...i,
                id: i.id || key,
                importance: i.importance ?? 0.5,
                lastUsedAt: i.lastUsedAt ?? Date.now()
            };
            // 存入 Map 以去重，后来的覆盖先来的
            uniqueItems.set(key, item);
        });

        this.items = Array.from(uniqueItems.values());
    }

    private totalTokens() {
        return this.items.reduce((s, i) => s + i.tokens, 0);
    }

    private computeImportance(item: ContextItem, query: string) {
        const now = Date.now();
        const recency = Math.exp(-(now - item.lastUsedAt) / (1000 * 60 * 30));
        const pinned = item.pinned ? 1 : 0;

        let semantic = 0;
        if (item.content && query) {
            semantic = item.content.toLowerCase().includes(query.toLowerCase())
                ? 1
                : 0;
        }

        item.importance =
            0.5 * recency +
            0.3 * semantic +
            0.2 * pinned;
    }

    private decay(item: ContextItem) {
        if (item.pinned) return;

        const now = Date.now();
        const last = item.lastUsedAt ?? now;
        const hours = (now - last) / 36e5;

        const rate = item.decayRate ?? 0.95;
        item.importance = (item.importance ?? 0.5) * Math.pow(rate, hours);
    }

    private trimIfNeeded() {
        while (this.totalTokens() > this.maxTokens) {
            const victim = this.items
                .filter(i => !i.pinned)
                .sort((a, b) => a.importance - b.importance)[0];

            if (!victim) break;
            this.items = this.items.filter(i => i !== victim);
        }
    }

    optimizeForTokens(ratio: number) {
        if (ratio < 0.7) return;

        const victims = this.items
            .filter(i => i.content && !i.pinned)
            .sort((a, b) => a.importance - b.importance);

        for (const item of victims) {
            item.summary = item.summary ?? item.content!.slice(0, 500) + '...';
            item.content = undefined;
            item.tokens = estimateTokens(item.summary);

            if (this.totalTokens() / this.maxTokens < 0.6) break;
        }
    }

    promoteToMemoryIfNeeded() {
        const now = Date.now();

        for (const item of this.items) {
            if (item.type === 'memory' || item.type === 'antipattern') continue;

            if (item.importance < 0.85) continue;

            if (now - item.lastUsedAt > 1000 * 60 * 10) continue;

            item.type = 'memory';
            item.pinned = true;
        }
    }

    buildPrompt(userInput: string): string {
        if (this.isEmpty()) return userInput;

        for (const item of this.items) {
            this.decay(item);
            this.computeImportance(item, userInput);
        }

        this.promoteToMemoryIfNeeded();

        this.items = this.items.filter(
            i => i.type !== 'memory' || (i.importance ?? 0) > 0.2
        );

        const memory = this.items.filter(i => i.type === 'memory');
        const active = this.items
            .filter(i => i.importance > 0.6 && i.type !== 'memory' && i.type !== 'antipattern')
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 6);

        const reference = this.items.filter(
            i => !active.includes(i) && i.type !== 'memory' && i.type !== 'antipattern'
        );

        const antiPatterns = this.items.filter(i => i.type === 'antipattern').slice(-3);

        const render = (items: ContextItem[]) =>
            items
                .map(i => {
                    const title = i.alias
                        ? `[Context] ${i.type}: ${i.alias} (${i.path})`
                        : `[Context] ${i.type}: ${i.path}`;
                    const body = i.summary ?? i.content ?? '';
                    return `${title}\n---\n${body}\n---`;
                })
                .join('\n\n');

        const renderAntiPatterns = (items: ContextItem[]) =>
            items
                .map(i => `⚠️ ${i.content}`)
                .join('\n\n');

        let antiPatternSection = '';
        if (antiPatterns.length > 0) {
            antiPatternSection = `
# Anti-Pattern Warnings
以下模式曾导致执行失败，请避免：
${renderAntiPatterns(antiPatterns)}

`;
        }

        return `
# System Memory
${render(memory)}

# Active Context
${render(active)}

# Reference Context
${render(reference)}
${antiPatternSection}
用户问题：
${userInput}
`;
    }
}
