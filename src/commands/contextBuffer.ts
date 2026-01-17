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
    private maxTokens = 8000;

    add(item: Omit<ContextItem, 'tokens'>) {
        const tokens = estimateTokens(item.content);
        this.items.push({ ...item, tokens });
        this.trimIfNeeded();
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
