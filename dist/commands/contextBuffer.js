"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBuffer = void 0;
const estimateTokens = (text) => Math.ceil(text.length / 4);
class ContextBuffer {
    items = [];
    maxTokens = 32000;
    add(item, bypassTokenLimit = false) {
        const text = item.content ?? item.summary ?? '';
        const tokens = estimateTokens(text);
        const itemId = item.id || `${item.type}:${item.path}:${Date.now()}`;
        const full = {
            ...item,
            id: itemId,
            tokens,
            importance: 0.5,
            lastUsedAt: Date.now()
        };
        this.items.push(full);
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
    import(items) {
        this.items = items.map(i => ({
            ...i,
            id: i.id || `${i.type}:${i.path}`,
            importance: i.importance ?? 0.5,
            lastUsedAt: i.lastUsedAt ?? Date.now()
        }));
    }
    totalTokens() {
        return this.items.reduce((s, i) => s + i.tokens, 0);
    }
    computeImportance(item, query) {
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
    decay(item) {
        if (item.pinned)
            return;
        const now = Date.now();
        const last = item.lastUsedAt ?? now;
        const hours = (now - last) / 36e5;
        const rate = item.decayRate ?? 0.95;
        item.importance = (item.importance ?? 0.5) * Math.pow(rate, hours);
    }
    trimIfNeeded() {
        while (this.totalTokens() > this.maxTokens) {
            const victim = this.items
                .filter(i => !i.pinned)
                .sort((a, b) => a.importance - b.importance)[0];
            if (!victim)
                break;
            this.items = this.items.filter(i => i !== victim);
        }
    }
    optimizeForTokens(ratio) {
        if (ratio < 0.7)
            return;
        const victims = this.items
            .filter(i => i.content && !i.pinned)
            .sort((a, b) => a.importance - b.importance);
        for (const item of victims) {
            item.summary = item.summary ?? item.content.slice(0, 500) + '...';
            item.content = undefined;
            item.tokens = estimateTokens(item.summary);
            if (this.totalTokens() / this.maxTokens < 0.6)
                break;
        }
    }
    promoteToMemoryIfNeeded() {
        const now = Date.now();
        for (const item of this.items) {
            if (item.type === 'memory' || item.type === 'antipattern')
                continue;
            if (item.importance < 0.85)
                continue;
            if (now - item.lastUsedAt > 1000 * 60 * 10)
                continue;
            item.type = 'memory';
            item.pinned = true;
        }
    }
    buildPrompt(userInput) {
        if (this.isEmpty())
            return userInput;
        for (const item of this.items) {
            this.decay(item);
            this.computeImportance(item, userInput);
        }
        this.promoteToMemoryIfNeeded();
        this.items = this.items.filter(i => i.type !== 'memory' || (i.importance ?? 0) > 0.2);
        const memory = this.items.filter(i => i.type === 'memory');
        const active = this.items
            .filter(i => i.importance > 0.6 && i.type !== 'memory' && i.type !== 'antipattern')
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 6);
        const reference = this.items.filter(i => !active.includes(i) && i.type !== 'memory' && i.type !== 'antipattern');
        const antiPatterns = this.items.filter(i => i.type === 'antipattern').slice(-3);
        const render = (items) => items
            .map(i => {
            const title = i.alias
                ? `[Context] ${i.type}: ${i.alias} (${i.path})`
                : `[Context] ${i.type}: ${i.path}`;
            const body = i.summary ?? i.content ?? '';
            return `${title}\n---\n${body}\n---`;
        })
            .join('\n\n');
        const renderAntiPatterns = (items) => items
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
exports.ContextBuffer = ContextBuffer;
//# sourceMappingURL=contextBuffer.js.map