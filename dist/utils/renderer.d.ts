import { Ora } from 'ora';
export interface RendererOptions {
    autoFinish?: boolean;
    onChunkCallback?: (chunk: string) => void;
    quietMode?: boolean;
}
export declare class StreamMarkdownRenderer {
    private fullResponse;
    private prefix;
    private isFirstOutput;
    private spinner;
    private startTime;
    private quietMode;
    private autoFinish;
    private onChunkCallback;
    constructor(prefix?: string, spinner?: Ora, options?: RendererOptions | boolean);
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
    /**
     * Start chunking mode for Agent Runtime
     * Returns a callback function that Agent can use to send chunks
     */
    startChunking(): (chunk: string) => void;
    /**
     * Check if response appears complete (heuristic)
     */
    private isComplete;
}
