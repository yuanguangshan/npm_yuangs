/**
 * ModelRouter 与 AgentRuntime/DualAgentRuntime 集成模块
 *
 * 这个模块提供了将 ModelRouter 系统深度集成到 AI Agent 执行引擎中的功能。
 *
 * 核心功能：
 * 1. 智能任务类型推断：根据用户输入和上下文自动推断任务类型
 * 2. 模型选择策略：支持多种路由策略（自动、最快、成本优化等）
 * 3. 回退机制：当路由失败时自动回退到默认 AI 服务
 * 4. 流式输出支持：保持与现有 Agent 执行引擎的兼容性
 */
import { TaskType, RoutingStrategy, type TaskConfig } from '../core/modelRouter';
import { AIRequestMessage } from '../core/validation';
/**
 * 智能推断任务类型
 *
 * 根据用户输入和上下文自动推断最适合的任务类型
 */
export declare function inferTaskType(userInput: string, mode?: 'chat' | 'command'): TaskType;
/**
 * 推断路由策略
 *
 * 根据用户配置和任务特性推断最合适的路由策略
 */
export declare function inferRoutingStrategy(taskType: TaskType, userInput?: string): RoutingStrategy;
/**
 * RouterLLMOptions
 *
 * 路由器 LLM 调用选项
 */
export interface RouterLLMOptions {
    /** 是否启用模型路由 */
    enableRouting?: boolean;
    /** 手动指定路由策略 */
    routingStrategy?: RoutingStrategy;
    /** 手动指定任务类型 */
    taskType?: TaskType;
    /** 是否启用回退机制 */
    enableFallback?: boolean;
    /** 额外的路由配置 */
    routingConfig?: Partial<TaskConfig>;
    /** 流式输出回调 */
    onChunk?: (chunk: string) => void;
    /** 模型参数 */
    model?: string;
}
/**
 * RouterLLMResult
 *
 * 路由器 LLM 调用结果
 */
export interface RouterLLMResult {
    /** 原始响应文本 */
    rawText: string;
    /** 是否使用了路由器 */
    usedRouter: boolean;
    /** 使用的模型名称 */
    modelName: string;
    /** 路由原因 */
    routingReason?: string;
    /** 延迟时间（毫秒） */
    latencyMs: number;
    /** 错误信息（如果有） */
    error?: string;
}
/**
 * ModelRouter 集成类
 *
 * 提供与 AgentRuntime 和 DualAgentRuntime 无缝集成的接口
 */
export declare class ModelRouterIntegration {
    private enableRouting;
    private enableFallback;
    private defaultStrategy;
    constructor(options?: {
        enableRouting?: boolean;
        enableFallback?: boolean;
        defaultStrategy?: RoutingStrategy;
    });
    /**
     * 使用路由器执行 LLM 调用
     *
     * 这是主要的集成接口，可以在 AgentRuntime 和 DualAgentRuntime 中使用
     */
    executeWithRouter(messages: AIRequestMessage[], mode?: 'chat' | 'command', options?: RouterLLMOptions): Promise<RouterLLMResult>;
    /**
     * 智能任务类型推断
     */
    private inferTaskType;
    /**
     * 智能路由策略推断
     */
    private inferRoutingStrategy;
    /**
     * 从消息列表构建提示词
     */
    private buildPromptFromMessages;
    /**
     * 更新配置
     */
    updateConfig(options: {
        enableRouting?: boolean;
        enableFallback?: boolean;
        defaultStrategy?: RoutingStrategy;
    }): void;
    /**
     * 获取当前配置
     */
    getConfig(): {
        enableRouting: boolean;
        enableFallback: boolean;
        defaultStrategy: RoutingStrategy;
    };
}
/**
 * 获取全局路由器集成实例（单例）
 */
export declare function getRouterIntegration(): ModelRouterIntegration;
/**
 * 重置全局路由器集成实例
 */
export declare function resetRouterIntegration(): void;
/**
 * 快捷函数：执行 LLM 调用（带路由）
 *
 * 这个函数可以直接替换现有的 LLM 调用
 */
export declare function callLLMWithRouter(messages: AIRequestMessage[], mode?: 'chat' | 'command', options?: RouterLLMOptions): Promise<RouterLLMResult>;
/**
 * 判断是否应该使用路由器
 *
 * 根据当前配置和任务特性决定是否使用 ModelRouter
 */
export declare function shouldUseRouter(messages: AIRequestMessage[], mode?: 'chat' | 'command'): boolean;
