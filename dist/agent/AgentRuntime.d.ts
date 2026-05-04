import { StreamMarkdownRenderer } from '../utils/renderer';
export declare class AgentRuntime {
    private context;
    private executionId;
    private readonly maxTurns;
    private readonly readOnlyTools;
    constructor(initialContext: any);
    run(userInput: string, mode?: "chat" | "command", onChunk?: (chunk: string) => void, model?: string, renderer?: StreamMarkdownRenderer): Promise<void>;
    private prepareRenderer;
    private buildPrompt;
    private callLLM;
    private handleLLMError;
    private buildAction;
    private handleAnswer;
    private verifyAckCausality;
    private passGovernance;
    private recordKnowledgeGraphEdge;
    private checkExecutionBlock;
    private executeAction;
    private handleSuccessfulExecution;
    private handleFailedExecution;
    /**
     * 语义完成检测：输出是否已经是直接答案
     * 用于防止 AI 在已经获取答案后继续无意义地查询
     */
    private isSemanticComplete;
    /**
     * 尝试直接格式化工具结果，避免额外的 LLM 调用
     * 适用于简单的只读查询（如 list_files 的结果配合简单问题）
     */
    private tryFormatToolResult;
    private learnFromExecution;
}
