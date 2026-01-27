"use strict";
/**
 * 模型路由系统类型定义
 *
 * 该系统允许整合多个 CLI 工具（如 Google CLI、Qwen CLI、Codebuddy CLI 等）
 * 根据任务特性和需求，智能路由到最合适的模型执行
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorationStrategy = exports.RoutingStrategy = exports.Priority = exports.TaskType = void 0;
/**
 * 任务类型
 */
var TaskType;
(function (TaskType) {
    TaskType["CODE_GENERATION"] = "code_generation";
    TaskType["CODE_REVIEW"] = "code_review";
    TaskType["CONVERSATION"] = "conversation";
    TaskType["TRANSLATION"] = "translation";
    TaskType["SUMMARIZATION"] = "summarization";
    TaskType["ANALYSIS"] = "analysis";
    TaskType["COMMAND_GENERATION"] = "command_generation";
    TaskType["DEBUG"] = "debug";
    TaskType["GENERAL"] = "general"; // 通用
})(TaskType || (exports.TaskType = TaskType = {}));
/**
 * 任务优先级
 */
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["CRITICAL"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
/**
 * 路由策略
 */
var RoutingStrategy;
(function (RoutingStrategy) {
    /** 自动选择（基于任务类型和模型能力） */
    RoutingStrategy["AUTO"] = "auto";
    /** 轮询 */
    RoutingStrategy["ROUND_ROBIN"] = "round_robin";
    /** 最快响应优先 */
    RoutingStrategy["FASTEST_FIRST"] = "fastest_first";
    /** 最低成本优先 */
    RoutingStrategy["CHEAPEST_FIRST"] = "cheapest_first";
    /** 最佳质量优先 */
    RoutingStrategy["BEST_QUALITY"] = "best_quality";
    /** 手动指定 */
    RoutingStrategy["MANUAL"] = "manual";
})(RoutingStrategy || (exports.RoutingStrategy = RoutingStrategy = {}));
/**
 * 探索策略
 */
var ExplorationStrategy;
(function (ExplorationStrategy) {
    ExplorationStrategy["NONE"] = "none";
    ExplorationStrategy["EPSILON_GREEDY"] = "epsilon_greedy";
    ExplorationStrategy["UCB1"] = "ucb1";
})(ExplorationStrategy || (exports.ExplorationStrategy = ExplorationStrategy = {}));
//# sourceMappingURL=types.js.map