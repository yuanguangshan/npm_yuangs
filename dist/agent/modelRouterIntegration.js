"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouterIntegration = void 0;
exports.inferTaskType = inferTaskType;
exports.inferRoutingStrategy = inferRoutingStrategy;
exports.getRouterIntegration = getRouterIntegration;
exports.resetRouterIntegration = resetRouterIntegration;
exports.callLLMWithRouter = callLLMWithRouter;
exports.shouldUseRouter = shouldUseRouter;
const modelRouter_1 = require("../core/modelRouter");
/**
 * 智能推断任务类型
 *
 * 根据用户输入和上下文自动推断最适合的任务类型
 */
function inferTaskType(userInput, mode = 'chat') {
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
        return modelRouter_1.TaskType.CODE_GENERATION;
    }
    // 代码审查相关
    if (input.includes('审查') ||
        input.includes('review') ||
        input.includes('检查代码') ||
        input.includes('code review')) {
        return modelRouter_1.TaskType.CODE_REVIEW;
    }
    // 调试相关
    if (input.includes('调试') ||
        input.includes('debug') ||
        input.includes('bug') ||
        input.includes('错误') ||
        input.includes('fix')) {
        return modelRouter_1.TaskType.DEBUG;
    }
    // 翻译相关
    if (input.includes('翻译') ||
        input.includes('translate') ||
        input.includes('翻译成') ||
        input.match(/translate.*to/)) {
        return modelRouter_1.TaskType.TRANSLATION;
    }
    // 摘要相关
    if (input.includes('总结') ||
        input.includes('摘要') ||
        input.includes('summarize') ||
        input.includes('summary')) {
        return modelRouter_1.TaskType.SUMMARIZATION;
    }
    // 分析相关
    if (input.includes('分析') ||
        input.includes('analyze') ||
        input.includes('explain')) {
        return modelRouter_1.TaskType.ANALYSIS;
    }
    // 命令生成相关
    if (mode === 'command' ||
        input.includes('命令') ||
        input.includes('command')) {
        return modelRouter_1.TaskType.COMMAND_GENERATION;
    }
    // 默认对话
    return modelRouter_1.TaskType.CONVERSATION;
}
/**
 * 推断路由策略
 *
 * 根据用户配置和任务特性推断最合适的路由策略
 */
function inferRoutingStrategy(taskType, userInput) {
    const input = (userInput || '').toLowerCase();
    // 成本优先
    if (input.includes('便宜') ||
        input.includes('预算') ||
        input.includes('cheap') ||
        input.includes('budget')) {
        return modelRouter_1.RoutingStrategy.CHEAPEST_FIRST;
    }
    // 速度优先
    if (input.includes('快') ||
        input.includes('fast') ||
        input.includes('quick') ||
        input.includes('asap')) {
        return modelRouter_1.RoutingStrategy.FASTEST_FIRST;
    }
    // 质量优先
    if (input.includes('高质量') ||
        input.includes('最好') ||
        input.includes('best quality') ||
        input.includes('best')) {
        return modelRouter_1.RoutingStrategy.BEST_QUALITY;
    }
    // 根据任务类型选择默认策略
    const strategyMap = {
        [modelRouter_1.TaskType.CODE_GENERATION]: modelRouter_1.RoutingStrategy.BEST_QUALITY,
        [modelRouter_1.TaskType.CODE_REVIEW]: modelRouter_1.RoutingStrategy.BEST_QUALITY,
        [modelRouter_1.TaskType.CONVERSATION]: modelRouter_1.RoutingStrategy.AUTO,
        [modelRouter_1.TaskType.TRANSLATION]: modelRouter_1.RoutingStrategy.FASTEST_FIRST,
        [modelRouter_1.TaskType.SUMMARIZATION]: modelRouter_1.RoutingStrategy.FASTEST_FIRST,
        [modelRouter_1.TaskType.ANALYSIS]: modelRouter_1.RoutingStrategy.AUTO,
        [modelRouter_1.TaskType.COMMAND_GENERATION]: modelRouter_1.RoutingStrategy.AUTO,
        [modelRouter_1.TaskType.DEBUG]: modelRouter_1.RoutingStrategy.BEST_QUALITY,
        [modelRouter_1.TaskType.GENERAL]: modelRouter_1.RoutingStrategy.AUTO,
    };
    return strategyMap[taskType] || modelRouter_1.RoutingStrategy.AUTO;
}
/**
 * ModelRouter 集成类
 *
 * 提供与 AgentRuntime 和 DualAgentRuntime 无缝集成的接口
 */
class ModelRouterIntegration {
    enableRouting;
    enableFallback;
    defaultStrategy;
    constructor(options = {}) {
        this.enableRouting = options.enableRouting ?? true;
        this.enableFallback = options.enableFallback ?? true;
        this.defaultStrategy = options.defaultStrategy ?? modelRouter_1.RoutingStrategy.AUTO;
    }
    /**
     * 使用路由器执行 LLM 调用
     *
     * 这是主要的集成接口，可以在 AgentRuntime 和 DualAgentRuntime 中使用
     */
    async executeWithRouter(messages, mode = 'chat', options = {}) {
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
            const result = await (0, modelRouter_1.executeTask)(prompt, {
                type: taskType,
                description: `AI ${mode} task: ${userInput.substring(0, 100)}`,
            }, {
                strategy,
                ...options.routingConfig,
            }, options.onChunk);
            return {
                rawText: result.content || '',
                usedRouter: true,
                modelName: result.modelName,
                routingReason: result.metadata?.routingReason || 'Routing selected',
                latencyMs: result.executionTime,
            };
        }
        catch (error) {
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
    inferTaskType(userInput, mode) {
        return inferTaskType(userInput, mode);
    }
    /**
     * 智能路由策略推断
     */
    inferRoutingStrategy(taskType, userInput) {
        return inferRoutingStrategy(taskType, userInput);
    }
    /**
     * 从消息列表构建提示词
     */
    buildPromptFromMessages(messages) {
        const parts = [];
        for (const message of messages) {
            if (message.role === 'system') {
                parts.push(`[SYSTEM]\n${message.content}\n`);
            }
            else if (message.role === 'user') {
                parts.push(`[USER]\n${message.content}\n`);
            }
            else if (message.role === 'assistant') {
                parts.push(`[ASSISTANT]\n${message.content}\n`);
            }
        }
        return parts.join('\n');
    }
    /**
     * 更新配置
     */
    updateConfig(options) {
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
exports.ModelRouterIntegration = ModelRouterIntegration;
/**
 * 全局路由器集成实例
 */
let globalRouterIntegration = null;
/**
 * 获取全局路由器集成实例（单例）
 */
function getRouterIntegration() {
    if (!globalRouterIntegration) {
        // 从配置文件读取设置
        const { getUserConfig } = require('../ai/client');
        const config = getUserConfig();
        globalRouterIntegration = new ModelRouterIntegration({
            enableRouting: config.enableModelRouting !== false,
            enableFallback: config.enableModelRouterFallback !== false,
            defaultStrategy: config.defaultRoutingStrategy || modelRouter_1.RoutingStrategy.AUTO,
        });
    }
    return globalRouterIntegration;
}
/**
 * 重置全局路由器集成实例
 */
function resetRouterIntegration() {
    globalRouterIntegration = null;
}
/**
 * 快捷函数：执行 LLM 调用（带路由）
 *
 * 这个函数可以直接替换现有的 LLM 调用
 */
async function callLLMWithRouter(messages, mode = 'chat', options = {}) {
    const integration = getRouterIntegration();
    return integration.executeWithRouter(messages, mode, options);
}
/**
 * 判断是否应该使用路由器
 *
 * 根据当前配置和任务特性决定是否使用 ModelRouter
 */
function shouldUseRouter(messages, mode = 'chat') {
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
    const simpleTasks = [modelRouter_1.TaskType.CONVERSATION];
    // 对于简单任务，如果用户没有明确要求使用路由，可以跳过
    if (simpleTasks.includes(taskType) && userInput.length < 50) {
        return false;
    }
    return true;
}
//# sourceMappingURL=modelRouterIntegration.js.map