import { Ora } from 'ora';
interface RendererOptions {
    prefix?: string;
    autoFinish?: boolean;
    onChunkCallback?: (chunk: string) => void;
    quietMode?: boolean;
}
export declare class StreamMarkdownRenderer {
    private md;
    private prefix;
    private buffer;
    private isFirstOutput;
    private spinner;
    private startTime;
    private quietMode;
    private autoFinish;
    private onChunkCallback;
    constructor(prefix?: string, spinner?: Ora, options?: RendererOptions | boolean);
    /**
     * 处理流式 chunk
     *
     * 策略：
     * 1. 累积到 buffer
     * 2. 实时输出纯文本（不解析 Markdown）
     * 3. finish() 时重新渲染完整内容
     */
    onChunk(chunk: string): void;
    /**
     * 流结束，渲染完整 Markdown
     *
     * 使用 md.parse() 解析 Tokens，直接映射为 ANSI
     */
    finish(): string;
    /**
     * 使用 markdown-it 的 Token 渲染 Markdown
     *
     * 这是核心函数：Token -> ANSI 直接映射
     */
    private render;
    /**
     * 遍历 Tokens 并转换为 ANSI
     */
    private traverse;
    /**
     * 提取 inline token 的文本内容
     */
    private extractInlineText;
    /**
     * 渲染内联样式
     *
     * 这是最关键的部分：加粗、斜体、内联代码、链接
     */
    private renderInline;
    /**
     * 计算文本在终端的可视行数
     */
    private getVisualLineCount;
    /**
     * Start chunking mode for Agent Runtime
     */
    startChunking(): (chunk: string) => void;
    /**
     * 渲染表格（使用 cli-table3）
     */
    private renderTable;
    /**
     * Check if response appears complete
     */
    private isComplete;
}
export {};
