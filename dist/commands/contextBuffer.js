"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBuffer = void 0;
const estimateTokens = (text) => Math.ceil(text.length / 4);
class ContextBuffer {
    items = [];
    maxTokens = 8000;
    add(item, bypassTokenLimit = false) {
        const tokens = estimateTokens(item.content);
        this.items.push({ ...item, tokens });
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
        this.items = items;
    }
    totalTokens() {
        return this.items.reduce((sum, i) => sum + i.tokens, 0);
    }
    trimIfNeeded() {
        while (this.totalTokens() > this.maxTokens) {
            this.items.shift();
        }
    }
    buildPrompt(userInput) {
        const contextBlock = this.items.map(item => {
            const title = item.alias
                ? `${item.type}：${item.alias} (${item.path})`
                : `${item.type}：${item.path}`;
            const body = item.summary ?? item.content;
            return `${title}\n\`\`\`\n${body}\n\`\`\``;
        }).join('\n\n');
        return `
你正在基于以下上下文回答问题：

${contextBlock}

用户问题：
${userInput}
`;
    }
}
exports.ContextBuffer = ContextBuffer;
// Test change for git diff
// Another test change (unstaged)
//# sourceMappingURL=contextBuffer.js.map