interface StreamRendererOptions {
    prefix?: string;
    colors?: {
        heading?: string;
        strong?: string;
        em?: string;
        code?: string;
        codespan?: string;
        link?: string;
        blockquote?: string;
    };
}
export declare class StreamMarkdownRenderer {
    private md;
    private prefix;
    private colors;
    private buffer;
    private isFirstOutput;
    private tokenStack;
    private inCodeBlock;
    private inInlineCode;
    private inLink;
    constructor(options?: StreamRendererOptions);
    /**
     * 处理流式 chunk
     *
     * 策略：
     * 1. 累积到 buffer
     * 2. 尝试解析完整的 tokens
     * 3. 渲染可用的 tokens
     * 4. 保留不完整的部分
     */
    onChunk(chunk: string): void;
    /**
     * 渲染 buffer 中的完整 tokens
     */
    private renderBuffer;
    /**
     * 检查 token 是否完整
     */
    private isTokenComplete;
    /**
     * 渲染单个 token
     */
    private renderToken;
    /**
     * 流结束，渲染剩余内容
     */
    finish(): string;
    /**
     * 清空 buffer
     */
    clear(): void;
}
export {};
