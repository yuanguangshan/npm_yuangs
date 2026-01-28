import MarkdownIt from 'markdown-it';
import { Ora } from 'ora';
/**
 * 核心渲染引擎：Markdown -> ANSI 映射
 * 将该逻辑剥离以便在流式和静态场景下复用
 */
export declare class MarkdownRenderer {
    protected md: MarkdownIt;
    constructor();
    /**
     * 将 Markdown 字符串直接转换为带有 ANSI 样式的文本
     */
    render(markdown: string): string;
    /**
     * 遍历 Tokens 并映射为 ANSI 样式 (从 renderer.ts 原 traverse 迁移)
     */
    traverse(tokens: any[]): string;
    /**
     * 渲染内联样式
     */
    private renderInline;
    /**
     * 渲染表格 (cli-table3)
     */
    private renderTable;
}
/**
 * 将 Markdown 字符串渲染为带有终端 ANSI 样态的字符串 (静态专用)
 */
export declare function renderMarkdown(markdown: string): string;
interface RendererOptions {
    prefix?: string;
    autoFinish?: boolean;
    onChunkCallback?: (chunk: string) => void;
    quietMode?: boolean;
}
/**
 * 流式 Markdown 渲染器
 * 继承逻辑引擎，增加流状态管理
 */
export declare class StreamMarkdownRenderer extends MarkdownRenderer {
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
     * 计算文本在终端的可视行数
     */
    private getVisualLineCount;
    /**
     * Start chunking mode for Agent Runtime
     */
    startChunking(): (chunk: string) => void;
    /**
     * Check if response appears complete
     */
    private isComplete;
}
export {};
