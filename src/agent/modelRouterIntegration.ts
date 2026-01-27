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

import {
  executeTask,
  TaskType,
  RoutingStrategy,
  type TaskConfig,
  type ModelExecutionResult
} from '../core/modelRouter';
import { AIRequestMessage } from '../core/validation';

/**
 * 智能推断任务类型
 * 
 * 根据用户输入和上下文自动推断最适合的任务类型
 */
export function inferTaskType(
  userInput: string,
  mode: 'chat' | 'command' = 'chat'
): TaskType {
  const input = userInput.toLowerCase();

  // 代码生成相关
  if (input.includes('写') || 
      input.includes('生成') || 
      input.includes('实现') || 
      input.includes('写一个') ||
      input.includes('create') ||
      input.includes('implement') ||
      input.includes('generate') ||
      input.includes('write')) {
    return TaskType.CODE_GENERATION;
  }

  // 代码审查相关
  if (input.includes('审查') ||
      input.includes('review') ||
      input.includes('检查代码') ||
      input.includes('code review')) {
    return TaskType.CODE_REVIEW;
  }

  // 调试相关
  if (input.includes('调试') ||
      input.includes('debug') ||
      input.includes('bug') ||
      input.includes('错误') ||
      input.includes('fix')) {
    return TaskType.DEBUG;
  }

  // 翻译相关
  if (input.includes('翻译') ||
      input.includes('translate') ||
      input.includes('翻译成') ||
      input.match(/translate.*to/)) {
    return TaskType.TRANSLATION;
  }

  // 摘要相关
  if (input.includes('总结') ||
      input.includes('摘要') ||
      input.includes('summarize') ||
      input.includes('summary')) {
    return TaskType.SUMMARIZATION;
  }

  // 分析相关
  if (input.includes('分析') ||
      input.includes('analyze') ||
      input.includes('explain')) {
    return TaskType.ANALYSIS;
  }

  // 命令生成相关
  if (mode === 'command' ||
      input.includes('命令') ||
      input.includes('command')) {
    return TaskType.COMMAND_GENERATION;
  }

  // 默认对话
  return TaskType.CONVERSATION;
}

/**
 * 推断路由策略
 * 
 * 根据用户配置和任务特性推断最合适的路由策略
 */
export function inferRoutingStrategy(
  taskType: TaskType,
  userInput?: string
): RoutingStrategy {
  const input = (userInput || '').toLowerCase();

  // 成本优先
  if (input.includes('便宜') ||
      input.includes('预算') ||
      input.includes('cheap') ||
      input.includes('budget')) {
    return RoutingStrategy.CHEAPEST_FIRST;
  }

  // 速度优先
  if (input.includes('快') ||
      input.includes('fast') ||
      input.includes('quick') ||
      input.includes('asap')) {
    return RoutingStrategy.FASTEST_FIRST;
  }

  // 质量优先
  if (input.includes('高质量') ||
      input.includes('最好') ||
      input.includes('best quality') ||
      input.includes('best')) {
    return RoutingStrategy.BEST_QUALITY;
  }

  // 根据任务类型选择默认策略
  const strategyMap: Record<TaskType, RoutingStrategy> = {
    [TaskType.CODE_GENERATION]: RoutingStrategy.BEST_QUALITY,
    [TaskType.CODE_REVIEW]: RoutingStrategy.BEST_QUALITY,
    [TaskType.CONVERSATION]: RoutingStrategy.AUTO,
    [TaskType.TRANSLATION]: RoutingStrategy.FASTEST_FIRST,
    [TaskType.SUMMARIZATION]: RoutingStrategy.FASTEST_FIRST,
    [TaskType.ANALYSIS]: RoutingStrategy.AUTO,
    [TaskType.COMMAND_GENERATION]: RoutingStrategy.AUTO,
    [TaskType.DEBUG]: RoutingStrategy.BEST_QUALITY,
    [TaskType.GENERAL]: RoutingStrategy.AUTO,
  };

  return strategyMap[taskType] || RoutingStrategy.AUTO;
}

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
export class ModelRouterIntegration {
  private enableRouting: boolean;
  private enableFallback: boolean;
  private defaultStrategy: RoutingStrategy;

  constructor(options: {
    enableRouting?: boolean;
    enableFallback?: boolean;
    defaultStrategy?: RoutingStrategy;
  } = {}) {
    this.enableRouting = options.enableRouting ?? true;
    this.enableFallback = options.enableFallback ?? true;
    this.defaultStrategy = options.defaultStrategy ?? RoutingStrategy.AUTO;
  }

  /**
   * 使用路由器执行 LLM 调用
   * 
   * 这是主要的集成接口，可以在 AgentRuntime 和 DualAgentRuntime 中使用
   */
  async executeWithRouter(
    messages: AIRequestMessage[],
    mode: 'chat' | 'command' = 'chat',
    options: RouterLLMOptions = {}
  ): Promise<RouterLLMResult> {
    const startTime = Date.now();

    // 如果禁用路由，直接返回
    if (!this.enableRouting || !options.enableRouting) {
      return {
        rawText: '',
        usedRouter: false,
        modelName: 'default',
        latencyMs: Date.now() - startTime,
        error: 'Routing disabled'
      };
    }

    try {
      // 获取用户输入（最后一条用户消息）
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const userInput = lastUserMessage?.content || '';

      // 推断任务类型
      const taskType = options.taskType || this.inferTaskType(userInput, mode);

      // 推断路由策略
      const strategy = options.routingStrategy || 
                      this.inferRoutingStrategy(taskType, userInput) ||
                      this.defaultStrategy;

      // 构建提示词
      const prompt = this.buildPromptFromMessages(messages);

      // 执行任务
      const result = await executeTask(
        prompt,
        {
          type: taskType,
          description: `AI ${mode} task: ${userInput.substring(0, 100)}`,
        },
        {
          strategy,
          ...options.routingConfig,
        },
        options.onChunk
      );

      return {
        rawText: result.content || '',
        usedRouter: true,
        modelName: result.modelName,
        routingReason: result.metadata?.routingReason || 'Routing selected',
        latencyMs: result.executionTime,
      };
    } catch (error: any) {
      // 如果启用回退机制，记录错误但不要在这里处理
      // 让调用者决定是否回退到默认 AI
      if (this.enableFallback) {
        return {
          rawText: '',
          usedRouter: true,
          modelName: 'router-failed',
          latencyMs: Date.now() - startTime,
          error: error.message || 'Router execution failed'
        };
      }

      // 如果禁用回退，直接抛出错误
      throw error;
    }
  }

  /**
   * 智能任务类型推断
   */
  private inferTaskType(userInput: string, mode: 'chat' | 'command'): TaskType {
    return inferTaskType(userInput, mode);
  }

  /**
   * 智能路由策略推断
   */
  private inferRoutingStrategy(taskType: TaskType, userInput: string): RoutingStrategy {
    return inferRoutingStrategy(taskType, userInput);
  }

  /**
   * 从消息列表构建提示词
   */
  private buildPromptFromMessages(messages: AIRequestMessage[]): string {
    const parts: string[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        parts.push(`[SYSTEM]\n${message.content}\n`);
      } else if (message.role === 'user') {
        parts.push(`[USER]\n${message.content}\n`);
      } else if (message.role === 'assistant') {
        parts.push(`[ASSISTANT]\n${message.content}\n`);
      }
    }

    return parts.join('\n');
  }

  /**
   * 更新配置
   */
  updateConfig(options: {
    enableRouting?: boolean;
    enableFallback?: boolean;
    defaultStrategy?: RoutingStrategy;
  }) {
    if (options.enableRouting !== undefined) {
      this.enableRouting = options.enableRouting;
    }
    if (options.enableFallback !== undefined) {
      this.enableFallback = options.enableFallback;
    }
    if (options.defaultStrategy !== undefined) {
      this.defaultStrategy = options.defaultStrategy;
    }
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      enableRouting: this.enableRouting,
      enableFallback: this.enableFallback,
      defaultStrategy: this.defaultStrategy,
    };
  }
}

/**
 * 全局路由器集成实例
 */
let globalRouterIntegration: ModelRouterIntegration | null = null;

/**
 * 获取全局路由器集成实例（单例）
 */
export function getRouterIntegration(): ModelRouterIntegration {
  if (!globalRouterIntegration) {
    // 从配置文件读取设置
    const { getUserConfig } = require('../ai/client');
    const config = getUserConfig();
    
    globalRouterIntegration = new ModelRouterIntegration({
      enableRouting: config.enableModelRouting !== false,
      enableFallback: config.enableModelRouterFallback !== false,
      defaultStrategy: config.defaultRoutingStrategy || RoutingStrategy.AUTO,
    });
  }
  return globalRouterIntegration;
}

/**
 * 重置全局路由器集成实例
 */
export function resetRouterIntegration(): void {
  globalRouterIntegration = null;
}

/**
 * 快捷函数：执行 LLM 调用（带路由）
 * 
 * 这个函数可以直接替换现有的 LLM 调用
 */
export async function callLLMWithRouter(
  messages: AIRequestMessage[],
  mode: 'chat' | 'command' = 'chat',
  options: RouterLLMOptions = {}
): Promise<RouterLLMResult> {
  const integration = getRouterIntegration();
  return integration.executeWithRouter(messages, mode, options);
}

/**
 * 判断是否应该使用路由器
 * 
 * 根据当前配置和任务特性决定是否使用 ModelRouter
 */
export function shouldUseRouter(
  messages: AIRequestMessage[],
  mode: 'chat' | 'command' = 'chat'
): boolean {
  const integration = getRouterIntegration();
  const config = integration.getConfig();

  if (!config.enableRouting) {
    return false;
  }

  // 获取用户输入
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userInput = lastUserMessage?.content || '';

  // 推断任务类型
  const taskType = inferTaskType(userInput, mode);

  // 某些任务类型可能不适合路由（比如简单对话）
  // 这里可以根据实际需求添加更多逻辑
  const simpleTasks = [TaskType.CONVERSATION];
  
  // 对于简单任务，如果用户没有明确要求使用路由，可以跳过
  if (simpleTasks.includes(taskType) && userInput.length < 50) {
    return false;
  }

  return true;
}