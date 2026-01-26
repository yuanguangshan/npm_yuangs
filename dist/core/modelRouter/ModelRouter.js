"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = void 0;
const types_1 = require("./types");
/**
 * 模型路由器
 * 负责根据任务配置和路由策略选择合适的模型适配器
 */
class ModelRouter {
    adapters = new Map();
    stats = new Map();
    roundRobinIndex = 0;
    /**
     * 注册模型适配器
     */
    registerAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
        // 初始化统计信息
        if (!this.stats.has(adapter.name)) {
            this.stats.set(adapter.name, {
                modelName: adapter.name,
                totalRequests: 0,
                successCount: 0,
                failureCount: 0,
                avgResponseTime: 0,
                totalTokens: 0,
                lastUsed: new Date(),
            });
        }
    }
    /**
     * 注销模型适配器
     */
    unregisterAdapter(adapterName) {
        return this.adapters.delete(adapterName);
    }
    /**
     * 获取所有已注册的适配器
     */
    getAdapters() {
        return Array.from(this.adapters.values());
    }
    /**
     * 获取模型统计信息
     */
    getStats(modelName) {
        if (modelName) {
            return this.stats.get(modelName) || this.createEmptyStats(modelName);
        }
        return Array.from(this.stats.values());
    }
    /**
     * 路由任务到合适的模型
     */
    async route(taskConfig, routingConfig) {
        // 手动指定模型
        if (routingConfig.strategy === types_1.RoutingStrategy.MANUAL && routingConfig.manualModelName) {
            const adapter = this.adapters.get(routingConfig.manualModelName);
            if (!adapter) {
                throw new Error(`模型 ${routingConfig.manualModelName} 未注册`);
            }
            const isAvailable = await adapter.isAvailable();
            if (!isAvailable) {
                throw new Error(`模型 ${routingConfig.manualModelName} 不可用`);
            }
            return {
                adapter,
                reason: '手动指定模型',
                candidates: [{ name: adapter.name, score: 1.0, reason: '手动指定' }],
                isFallback: false,
            };
        }
        // 获取可用的适配器
        const availableAdapters = await this.getAvailableAdapters();
        if (availableAdapters.length === 0) {
            throw new Error('没有可用的模型适配器');
        }
        // 根据策略选择模型
        let selectedAdapter = null;
        let candidates = [];
        switch (routingConfig.strategy) {
            case types_1.RoutingStrategy.AUTO:
                const result = this.selectByCapabilities(availableAdapters, taskConfig, routingConfig);
                selectedAdapter = result.adapter;
                candidates = result.candidates;
                break;
            case types_1.RoutingStrategy.ROUND_ROBIN:
                selectedAdapter = this.selectRoundRobin(availableAdapters);
                candidates = [{ name: selectedAdapter.name, score: 1.0, reason: '轮询选择' }];
                break;
            case types_1.RoutingStrategy.FASTEST_FIRST:
                selectedAdapter = this.selectFastest(availableAdapters);
                candidates = [{ name: selectedAdapter.name, score: 1.0, reason: '最快响应' }];
                break;
            case types_1.RoutingStrategy.CHEAPEST_FIRST:
                selectedAdapter = this.selectCheapest(availableAdapters);
                candidates = [{ name: selectedAdapter.name, score: 1.0, reason: '最低成本' }];
                break;
            case types_1.RoutingStrategy.BEST_QUALITY:
                selectedAdapter = this.selectBestQuality(availableAdapters, taskConfig);
                candidates = [{ name: selectedAdapter.name, score: 1.0, reason: '最佳质量' }];
                break;
            default:
                throw new Error(`不支持的路由策略: ${routingConfig.strategy}`);
        }
        if (!selectedAdapter) {
            throw new Error('无法选择合适的模型');
        }
        return {
            adapter: selectedAdapter,
            reason: this.getReasonForSelection(routingConfig.strategy, selectedAdapter),
            candidates,
            isFallback: false,
        };
    }
    /**
     * 执行任务（带统计）
     */
    async executeTask(adapter, prompt, config, onChunk) {
        const stats = this.stats.get(adapter.name);
        stats.totalRequests++;
        stats.lastUsed = new Date();
        try {
            const result = await adapter.execute(prompt, config, onChunk);
            if (result.success) {
                stats.successCount++;
            }
            else {
                stats.failureCount++;
            }
            // 更新平均响应时间
            stats.avgResponseTime =
                (stats.avgResponseTime * (stats.totalRequests - 1) + result.executionTime) /
                    stats.totalRequests;
            if (result.tokensUsed) {
                stats.totalTokens += result.tokensUsed;
            }
            return result;
        }
        catch (error) {
            stats.failureCount++;
            throw error;
        }
    }
    /**
     * 获取可用的适配器
     */
    async getAvailableAdapters() {
        const adapters = Array.from(this.adapters.values());
        const availabilityChecks = await Promise.all(adapters.map(async (adapter) => ({
            adapter,
            available: await adapter.isAvailable(),
        })));
        return availabilityChecks
            .filter((check) => check.available)
            .map((check) => check.adapter);
    }
    /**
     * 基于能力选择模型
     */
    selectByCapabilities(adapters, taskConfig, routingConfig) {
        const scored = adapters.map((adapter) => {
            let score = 0;
            let reasons = [];
            // 1. 任务类型匹配 (40%)
            if (adapter.capabilities.supportedTaskTypes.includes(taskConfig.type)) {
                score += 0.4;
                reasons.push('支持任务类型');
            }
            // 2. 上下文窗口 (20%)
            if (taskConfig.contextSize) {
                if (adapter.capabilities.maxContextWindow >= taskConfig.contextSize) {
                    score += 0.2;
                    reasons.push('上下文窗口充足');
                }
            }
            else {
                score += 0.2;
            }
            // 3. 响应时间 (20%)
            if (taskConfig.expectedResponseTime) {
                if (adapter.capabilities.avgResponseTime <= taskConfig.expectedResponseTime) {
                    score += 0.2;
                    reasons.push('响应时间符合要求');
                }
            }
            else {
                score += 0.2;
            }
            // 4. 成本 (10%)
            if (routingConfig.maxCostLevel) {
                if (adapter.capabilities.costLevel <= routingConfig.maxCostLevel) {
                    score += 0.1;
                    reasons.push('成本符合预算');
                }
            }
            else {
                score += 0.1;
            }
            // 5. 历史表现 (10%)
            const stats = this.stats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.1;
                if (successRate > 0.9) {
                    reasons.push('历史表现优秀');
                }
            }
            else {
                score += 0.05; // 新模型给一半分数
            }
            return {
                name: adapter.name,
                adapter,
                score,
                reason: reasons.join('; ') || '基本符合要求',
            };
        });
        // 按分数排序
        scored.sort((a, b) => b.score - a.score);
        return {
            adapter: scored[0].adapter,
            candidates: scored.map((s) => ({ name: s.name, score: s.score, reason: s.reason })),
        };
    }
    /**
     * 轮询选择
     */
    selectRoundRobin(adapters) {
        const adapter = adapters[this.roundRobinIndex % adapters.length];
        this.roundRobinIndex++;
        return adapter;
    }
    /**
     * 选择最快的模型
     */
    selectFastest(adapters) {
        return adapters.reduce((fastest, current) => current.capabilities.avgResponseTime < fastest.capabilities.avgResponseTime
            ? current
            : fastest);
    }
    /**
     * 选择成本最低的模型
     */
    selectCheapest(adapters) {
        return adapters.reduce((cheapest, current) => current.capabilities.costLevel < cheapest.capabilities.costLevel ? current : cheapest);
    }
    /**
     * 选择质量最好的模型
     */
    selectBestQuality(adapters, taskConfig) {
        // 对于代码相关任务，优先选择专门的代码模型
        if (taskConfig.type === types_1.TaskType.CODE_GENERATION ||
            taskConfig.type === types_1.TaskType.CODE_REVIEW ||
            taskConfig.type === types_1.TaskType.DEBUG) {
            const codeAdapter = adapters.find((a) => a.capabilities.specialCapabilities?.includes('code-expert'));
            if (codeAdapter)
                return codeAdapter;
        }
        // 否则选择成本最高的（通常质量最好）
        return adapters.reduce((best, current) => current.capabilities.costLevel > best.capabilities.costLevel ? current : best);
    }
    /**
     * 获取选择原因
     */
    getReasonForSelection(strategy, adapter) {
        switch (strategy) {
            case types_1.RoutingStrategy.AUTO:
                return `自动选择 ${adapter.name}（基于任务类型和模型能力）`;
            case types_1.RoutingStrategy.ROUND_ROBIN:
                return `轮询选择 ${adapter.name}`;
            case types_1.RoutingStrategy.FASTEST_FIRST:
                return `选择 ${adapter.name}（最快响应时间 ~${adapter.capabilities.avgResponseTime}ms）`;
            case types_1.RoutingStrategy.CHEAPEST_FIRST:
                return `选择 ${adapter.name}（最低成本等级 ${adapter.capabilities.costLevel}）`;
            case types_1.RoutingStrategy.BEST_QUALITY:
                return `选择 ${adapter.name}（最佳质量）`;
            default:
                return `选择 ${adapter.name}`;
        }
    }
    /**
     * 创建空统计信息
     */
    createEmptyStats(modelName) {
        return {
            modelName,
            totalRequests: 0,
            successCount: 0,
            failureCount: 0,
            avgResponseTime: 0,
            totalTokens: 0,
            lastUsed: new Date(),
        };
    }
}
exports.ModelRouter = ModelRouter;
//# sourceMappingURL=ModelRouter.js.map