import { Ora } from 'ora';
export declare class StreamMarkdownRenderer {
    private fullResponse;
    private prefix;
    private isFirstOutput;
    private spinner;
    private startTime;
    constructor(prefix?: string, spinner?: Ora);
    /**
     * 处理流式数据块
     */
    onChunk(chunk: string): void;
    /**
     * 流结束，执行回滚并渲染 Markdown
     */
    finish(): string;
    /**
     * 计算文本在终端的可视行数
     */
    private getVisualLineCount;
}
