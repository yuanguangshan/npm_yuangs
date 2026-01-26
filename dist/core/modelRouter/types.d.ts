/**
 * 模型路由系统类型定义
 *
 * 该系统允许整合多个 CLI 工具（如 Google CLI、Qwen CLI、Codebuddy CLI 等）
 * 根据任务特性和需求，智能路由到最合适的模型执行
 */
/**
 * 任务类型
 */
export declare enum TaskType {
    CODE_GENERATION = "code_generation",// 代码生成
    CODE_REVIEW = "code_review",// 代码审查
    CONVERSATION = "conversation",// 对话
    TRANSLATION = "translation",// 翻译
    SUMMARIZATION = "summarization",// 摘要
    ANALYSIS = "analysis",// 分析
    COMMAND_GENERATION = "command_generation",// 命令生成
    DEBUG = "debug",// 调试
    GENERAL = "general"
}
/**
 * 任务优先级
 */
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * 任务配置
 */
export interface TaskConfig {
    /** 任务类型 */
    type: TaskType;
    /** 任务描述 */
    description: string;
    /** 优先级 */
    priority?: Priority;
    /** 期望的响应时间（毫秒） */
    expectedResponseTime?: number;
    /** 上下文大小估计 */
    contextSize?: number;
    /** 额外的元数据 */
    metadata?: Record<string, any>;
}
/**
 * 模型能力
 */
export interface ModelCapabilities {
    /** 支持的任务类型 */
    supportedTaskTypes: TaskType[];
    /** 最大上下文窗口 */
    maxContextWindow: number;
    /** 平均响应时间（毫秒） */
    avgResponseTime: number;
    /** 成本等级（1-5，5最贵） */
    costLevel: number;
    /** 是否支持流式输出 */
    supportsStreaming: boolean;
    /** 特殊能力 */
    specialCapabilities?: string[];
}
/**
 * 模型执行结果
 */
export interface ModelExecutionResult {
    /** 模型名称 */
    modelName: string;
    /** 执行是否成功 */
    success: boolean;
    /** 响应内容 */
    content?: string;
    /** 错误信息 */
    error?: string;
    /** 执行时间（毫秒） */
    executionTime: number;
    /** 使用的 tokens */
    tokensUsed?: number;
    /** 额外的元数据 */
    metadata?: Record<string, any>;
}
/**
 * 模型适配器接口
 * 所有外部 CLI 工具都需要实现这个接口
 */
export interface ModelAdapter {
    /** 适配器名称 */
    name: string;
    /** 适配器版本 */
    version: string;
    /** 提供者（如 Google、Qwen、Codebuddy 等） */
    provider: string;
    /** 模型能力描述 */
    capabilities: ModelCapabilities;
    /** 是否可用 */
    isAvailable(): Promise<boolean>;
    /** 执行任务 */
    execute(prompt: string, config: TaskConfig, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
    /** 健康检查 */
    healthCheck(): Promise<boolean>;
}
/**
 * 路由策略
 */
export declare enum RoutingStrategy {
    /** 自动选择（基于任务类型和模型能力） */
    AUTO = "auto",
    /** 轮询 */
    ROUND_ROBIN = "round_robin",
    /** 最快响应优先 */
    FASTEST_FIRST = "fastest_first",
    /** 最低成本优先 */
    CHEAPEST_FIRST = "cheapest_first",
    /** 最佳质量优先 */
    BEST_QUALITY = "best_quality",
    /** 手动指定 */
    MANUAL = "manual"
}
/**
 * 路由配置
 */
export interface RoutingConfig {
    /** 路由策略 */
    strategy: RoutingStrategy;
    /** 手动指定的模型名称（仅当 strategy 为 MANUAL 时有效） */
    manualModelName?: string;
    /** 允许的最大响应时间（毫秒） */
    maxResponseTime?: number;
    /** 允许的最大成本等级 */
    maxCostLevel?: number;
    /** 是否启用后备模型 */
    enableFallback?: boolean;
    /** 后备模型列表 */
    fallbackModels?: string[];
}
/**
 * 路由结果
 */
export interface RoutingResult {
    /** 选中的模型适配器 */
    adapter: ModelAdapter;
    /** 选择原因 */
    reason: string;
    /** 候选模型列表 */
    candidates: Array<{
        name: string;
        score: number;
        reason: string;
    }>;
    /** 是否使用了后备模型 */
    isFallback: boolean;
}
/**
 * 模型统计信息
 */
export interface ModelStats {
    /** 模型名称 */
    modelName: string;
    /** 总请求次数 */
    totalRequests: number;
    /** 成功次数 */
    successCount: number;
    /** 失败次数 */
    failureCount: number;
    /** 平均响应时间 */
    avgResponseTime: number;
    /** 总 tokens 使用量 */
    totalTokens: number;
    /** 最后使用时间 */
    lastUsed: Date;
}
/**
 * 对话消息
 */
export interface Message {
    /** 角色：user 或 assistant */
    role: 'user' | 'assistant';
    /** 消息内容 */
    content: string;
    /** 时间戳 */
    timestamp: Date;
}
/**
 * 对话上下文
 */
export interface ConversationContext {
    /** 会话ID */
    sessionId: string;
    /** 消息历史 */
    messages: Message[];
    /** 最大历史消息数 */
    maxMessages?: number;
    /** 最大token数（估算） */
    maxTokens?: number;
}
