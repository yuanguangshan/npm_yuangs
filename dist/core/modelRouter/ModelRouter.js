"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = void 0;
const types_1 = require("./types");
const BalancedPolicy_1 = require("./policies/BalancedPolicy");
const CostSavingPolicy_1 = require("./policies/CostSavingPolicy");
const LatencyCriticalPolicy_1 = require("./policies/LatencyCriticalPolicy");
const QualityFirstPolicy_1 = require("./policies/QualityFirstPolicy");
/**
 * 模型路由器
 * 负责根据任务配置和路由策略选择合适的模型适配器
 */
class ModelRouter {
    adapters = new Map();
    stats = new Map();
    policies = new Map();
    roundRobinIndex = 0;
    constructor() {
        this.registerDefaultPolicies();
    }
    /**
     * 注册默认策略
     */
    registerDefaultPolicies() {
        this.registerPolicy(new BalancedPolicy_1.BalancedPolicy());
        this.registerPolicy(new CostSavingPolicy_1.CostSavingPolicy());
        this.registerPolicy(new LatencyCriticalPolicy_1.LatencyCriticalPolicy());
        this.registerPolicy(new QualityFirstPolicy_1.QualityFirstPolicy());
    }
    /**
     * 注册路由策略
     */
    registerPolicy(policy) {
        this.policies.set(policy.name, policy);
    }
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
     * 获取所有已注册的策略
     */
    getPolicies() {
        return Array.from(this.policies.values());
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
        // 1. 手动指定模型 (最高优先级)
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
        // 2. 检查是否有可用适配器
        const allAdapters = this.getAdapters();
        if (allAdapters.length === 0) {
            throw new Error('没有任何已注册的模型适配器');
        }
        // 3. 轮询策略 (特殊处理，因为它是无状态的/简单的)
        if (routingConfig.strategy === types_1.RoutingStrategy.ROUND_ROBIN) {
            const availableAdapters = await this.getAvailableAdapters();
            if (availableAdapters.length === 0)
                throw new Error('没有可用的模型适配器');
            const adapter = this.selectRoundRobin(availableAdapters);
            return {
                adapter,
                reason: `轮询选择 ${adapter.name}`,
                candidates: [{ name: adapter.name, score: 1.0, reason: '轮询选择' }],
                isFallback: false
            };
        }
        // 4. 策略路由 (Policy Engine)
        let policyName = 'balanced'; // Default
        switch (routingConfig.strategy) {
            case types_1.RoutingStrategy.FASTEST_FIRST:
                policyName = 'latency-critical';
                break;
            case types_1.RoutingStrategy.CHEAPEST_FIRST:
                policyName = 'cost-saving';
                break;
            case types_1.RoutingStrategy.BEST_QUALITY:
                policyName = 'quality-first';
                break;
            case types_1.RoutingStrategy.AUTO:
            default:
                policyName = 'balanced';
                break;
        }
        const policy = this.policies.get(policyName);
        if (!policy) {
            console.warn(`策略 ${policyName} 未找到，回退到 balanced 策略`);
            const fallbackPolicy = this.policies.get('balanced');
            if (!fallbackPolicy)
                throw new Error('核心策略丢失');
            return this.executePolicy(fallbackPolicy, allAdapters, taskConfig, routingConfig);
        }
        return this.executePolicy(policy, allAdapters, taskConfig, routingConfig);
    }
    /**
     * 执行策略
     */
    async executePolicy(policy, adapters, taskConfig, routingConfig) {
        try {
            const result = await policy.select(adapters, taskConfig, routingConfig, this.stats);
            return {
                adapter: result.adapter,
                reason: `策略(${policy.name}): ${result.reason}`,
                candidates: result.candidates,
                isFallback: false
            };
        }
        catch (error) {
            throw new Error(`策略路由失败: ${error.message}`);
        }
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
     * 轮询选择
     */
    selectRoundRobin(adapters) {
        const adapter = adapters[this.roundRobinIndex % adapters.length];
        this.roundRobinIndex++;
        return adapter;
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