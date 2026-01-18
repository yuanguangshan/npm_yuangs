export type ContextItem = {
    type: 'file' | 'directory';
    path: string;
    alias?: string;
    content: string;
    summary?: string;
    tokens: number;
};

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export class ContextBuffer {
    private items: ContextItem[] = [];
    private maxTokens = 32000; // 约 12.8 万字符

    add(item: Omit<ContextItem, 'tokens'>, bypassTokenLimit: boolean = false) {
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

    import(items: ContextItem[]) {
        this.items = items;
    }

    private totalTokens() {
        return this.items.reduce((sum, i) => sum + i.tokens, 0);
    }

    private trimIfNeeded() {
        while (this.totalTokens() > this.maxTokens) {
            this.items.shift();
        }
    }

    buildPrompt(userInput: string): string {
        if (this.isEmpty()) return userInput;

        const contextBlock = this.items.map(item => {
            const title = item.alias
                ? `[Context Item] ${item.type}: ${item.alias} (${item.path})`
                : `[Context Item] ${item.type}: ${item.path}`;

            const body = item.summary ?? item.content;

            return `${title}\n---\n${body}\n---`;
        }).join('\n\n');

        return `
# 知识上下文 (Knowledge Context)
你目前的会话已加载以下参考资料。在回答用户问题时，请优先参考这些内容：

${contextBlock}

# 任务说明
基于上述提供的上下文（如果有），回答用户的问题。如果上下文中包含源码，请将其视为你当前的“真理来源”。

用户问题：
${userInput}
`;
    }
}
// Test change for git diff
// Another test change (unstaged)
