import { ModelAdapter, ModelCapabilities, TaskConfig, ModelExecutionResult } from './types';
/**
 * 基础模型适配器抽象类
 * 提供通用的功能实现
 */
export declare abstract class BaseAdapter implements ModelAdapter {
    abstract name: string;
    abstract version: string;
    abstract provider: string;
    abstract capabilities: ModelCapabilities;
    protected sessionId: string;
    /**
     * 设置会话ID
     */
    setSessionId(sessionId: string): void;
    /**
     * 获取会话ID
     */
    getSessionId(): string;
    /**
     * 构建带上下文的完整prompt
     */
    protected buildPromptWithContext(prompt: string, includeContext?: boolean): string;
    /**
     * 保存对话到上下文
     */
    protected saveToContext(userPrompt: string, assistantResponse: string): void;
    /**
     * 检查 CLI 命令是否可用
     */
    protected checkCommand(command: string): Promise<boolean>;
    /**
     * 使用 spawn 执行命令（支持流式输出和自动转义）
     * @param command 要执行的命令
     * @param args 命令参数数组
     * @param timeout 超时时间（毫秒）
     * @param onChunk 流式输出回调函数
     */
    protected runSpawnCommand(command: string, args: string[], timeout?: number, onChunk?: (chunk: string) => void): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * 判断字符串是否像是 JSON 格式
     */
    private isJsonOutput;
    /**
     * 提取 JSON 内容（处理 CLI 输出中的干扰日志）
     * @param output CLI 输出字符串
     * @returns 提取的 JSON 字符串，如果没有找到则返回原字符串
     */
    protected extractJsonContent(output: string): string;
    /**
     * 测量执行时间
     */
    protected measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        executionTime: number;
    }>;
    /**
     * 是否可用（默认检查健康状态）
     */
    isAvailable(): Promise<boolean>;
    /**
     * 执行任务（子类必须实现）
     */
    abstract execute(prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /**
     * 健康检查（子类必须实现）
     */
    abstract healthCheck(): Promise<boolean>;
    /**
     * 创建成功结果
     */
    protected createSuccessResult(content: string, executionTime: number, metadata?: Record<string, any>): ModelExecutionResult;
    /**
     * 创建失败结果
     */
    protected createErrorResult(error: string, executionTime: number): ModelExecutionResult;
}
