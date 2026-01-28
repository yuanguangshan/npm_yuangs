"use strict";
/**
 * 模型路由系统
 *
 * 这个模块提供了一个统一的接口来整合多个 AI CLI 工具，
 * 根据任务特性智能路由到最合适的模型执行。
 *
 * 主要特性：
 * 1. 支持多种路由策略（自动、轮询、最快优先等）
 * 2. 可扩展的适配器系统
 * 3. 任务执行统计和监控
 * 4. 灵活的配置管理
 *
 * @example
 * ```typescript
 * import { createRouter, TaskType, RoutingStrategy } from './modelRouter';
 *
 * const router = createRouter();
 *
 * const result = await router.executeTask({
 *   type: TaskType.CODE_GENERATION,
 *   description: '生成一个快速排序函数',
 * }, {
 *   strategy: RoutingStrategy.AUTO,
 * });
 *
 * console.log(result.content);
 * ```
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YuangsAdapter = exports.CodebuddyAdapter = exports.QwenAdapter = exports.GoogleAdapter = void 0;
exports.createRouter = createRouter;
exports.getRouter = getRouter;
exports.resetRouter = resetRouter;
exports.executeTask = executeTask;
exports.getStats = getStats;
__exportStar(require("./types"), exports);
__exportStar(require("./BaseAdapter"), exports);
__exportStar(require("./ModelRouter"), exports);
__exportStar(require("./config"), exports);
__exportStar(require("./ContextManager"), exports);
// 导出适配器
var GoogleAdapter_1 = require("./adapters/GoogleAdapter");
Object.defineProperty(exports, "GoogleAdapter", { enumerable: true, get: function () { return GoogleAdapter_1.GoogleAdapter; } });
var QwenAdapter_1 = require("./adapters/QwenAdapter");
Object.defineProperty(exports, "QwenAdapter", { enumerable: true, get: function () { return QwenAdapter_1.QwenAdapter; } });
var CodebuddyAdapter_1 = require("./adapters/CodebuddyAdapter");
Object.defineProperty(exports, "CodebuddyAdapter", { enumerable: true, get: function () { return CodebuddyAdapter_1.CodebuddyAdapter; } });
var YuangsAdapter_1 = require("./adapters/YuangsAdapter");
Object.defineProperty(exports, "YuangsAdapter", { enumerable: true, get: function () { return YuangsAdapter_1.YuangsAdapter; } });
const chalk_1 = __importDefault(require("chalk"));
const ModelRouter_1 = require("./ModelRouter");
const GoogleAdapter_2 = require("./adapters/GoogleAdapter");
const QwenAdapter_2 = require("./adapters/QwenAdapter");
const CodebuddyAdapter_2 = require("./adapters/CodebuddyAdapter");
const YuangsAdapter_2 = require("./adapters/YuangsAdapter");
const config_1 = require("./config");
const types_1 = require("./types");
let globalRouter = null;
/**
 * 创建并初始化一个模型路由器
 */
function createRouter() {
    const router = new ModelRouter_1.ModelRouter();
    const config = (0, config_1.loadConfig)();
    // 注册启用的适配器
    if (config.enabledAdapters.includes('google-gemini')) {
        router.registerAdapter(new GoogleAdapter_2.GoogleAdapter());
    }
    if (config.enabledAdapters.includes('qwen')) {
        router.registerAdapter(new QwenAdapter_2.QwenAdapter());
    }
    if (config.enabledAdapters.includes('codebuddy')) {
        router.registerAdapter(new CodebuddyAdapter_2.CodebuddyAdapter());
    }
    // 始终注册内置的 yuangs 适配器 (提供 Assistant 模型)
    router.registerAdapter(new YuangsAdapter_2.YuangsAdapter());
    return router;
}
/**
 * 获取全局路由器实例（单例）
 */
function getRouter() {
    if (!globalRouter) {
        globalRouter = createRouter();
    }
    return globalRouter;
}
/**
 * 重置全局路由器
 */
function resetRouter() {
    globalRouter = null;
}
/**
 * 快捷函数：执行任务
 */
async function executeTask(prompt, taskConfig, routingConfig, onChunk) {
    const router = getRouter();
    const config = (0, config_1.loadConfig)();
    // 合并配置
    const finalRoutingConfig = {
        strategy: config.defaultStrategy,
        maxResponseTime: config.maxResponseTime,
        maxCostLevel: config.maxCostLevel,
        enableFallback: config.enableFallback,
        ...routingConfig,
    };
    // 检查是否有任务类型映射 (仅当调用方未手动指定策略时应用)
    if (!routingConfig?.strategy && config.taskTypeMapping && config.taskTypeMapping[taskConfig.type]) {
        finalRoutingConfig.strategy = types_1.RoutingStrategy.MANUAL;
        finalRoutingConfig.manualModelName = config.taskTypeMapping[taskConfig.type];
    }
    // 路由到合适的模型
    const routingResult = await router.route(taskConfig, finalRoutingConfig);
    if (routingResult.isFallback) {
        console.log(chalk_1.default.yellow(`⚠️ [Router] 回退到备选模型: ${routingResult.adapter.name}`));
    }
    else {
        console.log(chalk_1.default.cyan(`🤖 [Router] 智能路由 -> `) + chalk_1.default.bold.green(routingResult.adapter.name));
    }
    console.log(chalk_1.default.gray(`📋 选择理由: ${routingResult.reason}\n`));
    // 执行任务
    return router.executeTask(routingResult.adapter, prompt, taskConfig, onChunk);
}
/**
 * 快捷函数：获取所有适配器的统计信息
 */
function getStats() {
    const router = getRouter();
    return router.getStats();
}
//# sourceMappingURL=index.js.map