"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = void 0;
const crypto = __importStar(require("crypto"));
const types_1 = require("./types");
const DslPolicy_1 = require("./policies/DslPolicy");
const ModelSupervisor_1 = require("./ModelSupervisor");
const MetricsCollector_1 = require("../metrics/MetricsCollector");
const SupervisorActionLog_1 = require("../observability/SupervisorActionLog");
const AdaptiveWeights_1 = require("./AdaptiveWeights");
/**
 * 模型路由器 - 执行面 (Execution Plane)
 * 负责人调配和执行，保持核心逻辑简单
 */
class ModelRouter {
    adapters = new Map();
    policies = new Map();
    domainHealth = new Map();
    metrics;
    supervisor;
    supervisorLogger;
    adaptiveWeights;
    roundRobinIndex = 0;
    // 唯一监督状态轨迹 (Context)
    supervisorContext = {
        now: Date.now(),
        triggerHitCounts: {}
    };
    constructor(supervisorConfig, metrics, logger, adaptiveWeights) {
        this.metrics = metrics || new MetricsCollector_1.DefaultMetricsCollector();
        this.supervisor = new ModelSupervisor_1.ModelSupervisor(supervisorConfig || ModelSupervisor_1.ModelSupervisor.getDefaultConfig());
        this.supervisorLogger = logger || new SupervisorActionLog_1.ConsoleSupervisorActionLogger();
        this.adaptiveWeights = adaptiveWeights || new AdaptiveWeights_1.AdaptiveWeights();
        this.registerDefaultPolicies();
        this.applyLearnedWeights();
    }
    registerDefaultPolicies() {
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'balanced',
            description: '均衡策略：综合考虑匹配度、性能、成本和历史表现',
            weights: { taskMatch: 0.4, context: 0.2, latency: 0.2, cost: 0.1, history: 0.1 }
        }));
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'cost-saving',
            description: '成本优先模式：优先选择廉价的模型，保证基础可用',
            weights: { cost: 0.7, taskMatch: 0.2, history: 0.1 }
        }));
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'latency-critical',
            description: '追求极致响应速度：优先选择平均响应时间最短的模型',
            weights: { latency: 0.7, taskMatch: 0.2, history: 0.1 }
        }));
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'quality-first',
            description: '高复杂度任务优先：由代码专家和大型语言模型处理',
            gate: { minContext: 32000 },
            weights: { quality: 0.6, history: 0.2, taskMatch: 0.2 }
        }));
    }
    registerPolicy(policy) {
        this.policies.set(policy.name, policy);
    }
    registerAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
    }
    unregisterAdapter(adapterName) {
        return this.adapters.delete(adapterName);
    }
    getAdapters() {
        return Array.from(this.adapters.values());
    }
    getPolicies() {
        return Array.from(this.policies.values());
    }
    getStats(modelName) {
        if (modelName) {
            return this.metrics.getStats(modelName) || this.createEmptyStats(modelName);
        }
        return Array.from(this.metrics.getAllStats().values());
    }
    async route(taskConfig, routingConfig) {
        if (routingConfig.strategy === types_1.RoutingStrategy.MANUAL && routingConfig.manualModelName) {
            const adapter = this.adapters.get(routingConfig.manualModelName);
            if (!adapter)
                throw new Error(`模型 ${routingConfig.manualModelName} 未注册`);
            if (!(await adapter.isAvailable()))
                throw new Error(`模型 ${routingConfig.manualModelName} 不可用`);
            return {
                adapter,
                reason: '手动指定模型',
                candidates: [{ name: adapter.name, score: 1.0, reason: '手动指定' }],
                isFallback: false,
            };
        }
        const allAdapters = this.getAdapters();
        if (allAdapters.length === 0)
            throw new Error('没有任何已注册的模型适配器');
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
        // 5. 监督评估 (v3 stateless)
        this.supervisorContext.now = Date.now();
        const snapshot = this.metrics.snapshot(this.domainHealth);
        const decision = this.supervisor.evaluate(snapshot, this.supervisorContext, routingConfig.strategy);
        // 唯一状态推进 (Context evolution)
        this.supervisorContext = {
            ...this.supervisorContext,
            ...decision.contextPatch
        };
        let activeStrategy = routingConfig.strategy;
        let supervisorNote = '';
        // 显式语义检查: 只有 SWITCH_STRATEGY 且 targetStrategy 存在时才干预
        if (decision.action.type === types_1.ActionType.SWITCH_STRATEGY && decision.action.targetStrategy) {
            activeStrategy = decision.action.targetStrategy;
            supervisorNote = ` [监督器干预: ${decision.action.reason}]`;
            // 记录结构化日志
            this.supervisorLogger.log({
                eventId: crypto.randomUUID(),
                timestamp: Date.now(),
                action: decision.action,
                previousStrategy: routingConfig.strategy,
                currentStrategy: activeStrategy,
                snapshot: {
                    globalLatencyEMA: snapshot.globalLatencyEMA,
                    globalSuccessRateEMA: snapshot.globalSuccessRateEMA,
                    domainHealth: Object.fromEntries(Array.from(snapshot.domainHealth.entries()).map(([k, v]) => [k, { state: v.state, successEMA: v.successEMA, latencyEMA: v.latencyEMA }]))
                }
            });
        }
        let policyName = 'balanced';
        switch (activeStrategy) {
            case types_1.RoutingStrategy.FASTEST_FIRST:
                policyName = 'latency-critical';
                break;
            case types_1.RoutingStrategy.CHEAPEST_FIRST:
                policyName = 'cost-saving';
                break;
            case types_1.RoutingStrategy.BEST_QUALITY:
                policyName = 'quality-first';
                break;
            default:
                policyName = 'balanced';
                break;
        }
        const policy = this.policies.get(policyName);
        if (!policy) {
            const fallbackPolicy = this.policies.get('balanced');
            return this.executePolicyWithExploration(fallbackPolicy, allAdapters, taskConfig, routingConfig, supervisorNote);
        }
        return this.executePolicyWithExploration(policy, allAdapters, taskConfig, routingConfig, supervisorNote);
    }
    async executePolicyWithExploration(policy, adapters, taskConfig, routingConfig, supervisorNote) {
        try {
            const result = await policy.select(adapters, taskConfig, routingConfig, this.metrics.getAllStats(), this.domainHealth);
            const allowedCandidates = result.candidates.filter((c) => {
                const adapter = this.adapters.get(c.name);
                return adapter ? this.isAdapterAllowedByCircuitBreaker(adapter) : false;
            });
            if (allowedCandidates.length === 0)
                throw new Error('所有策略候选均被熔断保护拦截');
            let bestCandidate = allowedCandidates.sort((a, b) => b.score - a.score)[0];
            let finalAdapter = this.adapters.get(bestCandidate.name);
            let finalReason = `策略(${policy.name}): ${result.reason}${supervisorNote || ''}`;
            const exploration = routingConfig.exploration;
            const strategy = exploration?.strategy || types_1.ExplorationStrategy.NONE;
            if (strategy === types_1.ExplorationStrategy.EPSILON_GREEDY) {
                const epsilon = exploration?.epsilon || 0;
                if (epsilon > 0 && Math.random() < epsilon) {
                    const otherCandidates = allowedCandidates.filter((c) => c.name !== bestCandidate.name);
                    if (otherCandidates.length > 0) {
                        const picked = otherCandidates[Math.floor(Math.random() * otherCandidates.length)];
                        const pickedAdapter = this.adapters.get(picked.name);
                        if (pickedAdapter) {
                            finalAdapter = pickedAdapter;
                            finalReason = `ε-greedy 采样(${epsilon}): 随机选中 [${picked.name}]，原定 [${bestCandidate.name}] (${picked.reason})`;
                        }
                    }
                }
            }
            else if (strategy === types_1.ExplorationStrategy.UCB1) {
                const statsMap = this.metrics.getAllStats();
                const totalRuns = Array.from(statsMap.values()).reduce((sum, s) => sum + s.totalRequests, 0);
                const candidatesWithUCB = allowedCandidates.map((c) => {
                    const ucb = this.calculateUCB1(statsMap.get(c.name), totalRuns);
                    return { ...c, combinedScore: c.score * 0.7 + ucb * 0.3, ucb };
                });
                candidatesWithUCB.sort((a, b) => b.combinedScore - a.combinedScore);
                const topOne = candidatesWithUCB[0];
                if (topOne.name !== bestCandidate.name) {
                    finalAdapter = this.adapters.get(topOne.name);
                    finalReason = `UCB1 探索: 选中 [${topOne.name}] (UCB=${topOne.ucb.toFixed(3)})，原定 [${bestCandidate.name}]`;
                }
            }
            return {
                adapter: finalAdapter,
                reason: finalReason,
                candidates: allowedCandidates,
                isFallback: false
            };
        }
        catch (error) {
            throw new Error(`策略路由失败: ${error.message}`);
        }
    }
    async executeTask(adapter, prompt, config, onChunk, strategy = types_1.RoutingStrategy.AUTO) {
        const domain = adapter.failureDomain ?? adapter.provider;
        try {
            const result = await adapter.execute(prompt, config, onChunk);
            this.metrics.recordRequest(adapter.name, domain, result.executionTime, result.success, adapter.capabilities.costLevel);
            // 记录执行结果用于自适应学习
            this.recordExecutionOutcome(adapter, result, strategy);
            if (result.success) {
                const health = this.domainHealth.get(domain);
                if (health && health.state === 'half-open') {
                    health.state = 'closed';
                    console.log(`📡 故障域 [${domain}] 已自动恢复 (Closed)`);
                }
            }
            else {
                const health = this.domainHealth.get(domain);
                if (health && health.state === 'half-open') {
                    health.state = 'open';
                    health.openedAt = Date.now();
                    console.warn(`📡 故障域 [${domain}] 探测失败，延长熔断时间 (Open)`);
                }
            }
            return result;
        }
        catch (error) {
            this.metrics.recordRequest(adapter.name, domain, 0, false, adapter.capabilities.costLevel);
            const health = this.domainHealth.get(domain);
            if (health && health.state === 'half-open') {
                health.state = 'open';
                health.openedAt = Date.now();
            }
            throw error;
        }
    }
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
    selectRoundRobin(adapters) {
        const adapter = adapters[this.roundRobinIndex % adapters.length];
        this.roundRobinIndex++;
        return adapter;
    }
    updateDomainHealthStates() {
        const now = Date.now();
        const adapters = this.getAdapters();
        const domains = new Set(adapters.map(a => a.failureDomain ?? a.provider));
        for (const domain of domains) {
            let health = this.domainHealth.get(domain);
            if (!health) {
                health = { state: 'closed' };
                this.domainHealth.set(domain, health);
            }
            const domainAdapters = adapters.filter(a => (a.failureDomain ?? a.provider) === domain);
            const isUnstable = domainAdapters.some(a => {
                const s = this.metrics.getStats(a.name);
                return s && (s.recentFailures >= 3 || s.successEMA < 0.4);
            });
            const isStable = domainAdapters.every(a => {
                const s = this.metrics.getStats(a.name);
                return s && s.successEMA > 0.85;
            });
            // 计算平均成功率用于渐进恢复判断
            const avgSuccessRate = this.calculateDomainAverageSuccessRate(domainAdapters);
            if (health.state === 'closed' && isUnstable) {
                health.state = 'open';
                health.openedAt = now;
                console.warn(`🚨 故障域 [${domain}] 表现极差或连续错误，已触发熔断拦截 (Open)`);
            }
            else if (health.state === 'open' && now - (health.openedAt || 0) > 30000) {
                health.state = 'half-open';
                console.log(`📡 故障域 [${domain}] 进入半探测模式 (Half-Open)`);
            }
            else if (health.state === 'half-open' && (isStable || avgSuccessRate > 0.9)) {
                // 成功率 > 90% 时立即恢复
                health.state = 'closed';
                console.log(`✅ 故障域 [${domain}] EMA 指标已恢复 (成功率: ${(avgSuccessRate * 100).toFixed(0)}%)，熔断状态重置 (Closed)`);
            }
        }
    }
    /**
     * 计算域的平均成功率
     */
    calculateDomainAverageSuccessRate(domainAdapters) {
        let totalRequests = 0;
        let weightedSuccess = 0;
        for (const adapter of domainAdapters) {
            const stats = this.metrics.getStats(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const weight = stats.totalRequests;
                totalRequests += weight;
                weightedSuccess += stats.successEMA * weight;
            }
        }
        return totalRequests > 0 ? weightedSuccess / totalRequests : 0;
    }
    isAdapterAllowedByCircuitBreaker(adapter) {
        const domain = adapter.failureDomain ?? adapter.provider;
        const health = this.domainHealth.get(domain);
        if (!health || health.state === 'closed')
            return true;
        if (health.state === 'open')
            return false;
        // 渐进式流量恢复: 基于成功率动态调整流量比例
        if (health.state === 'half-open') {
            const passRate = this.calculateHalfOpenPassRate(domain);
            return Math.random() < passRate;
        }
        return true;
    }
    /**
     * 计算半开状态的流量通过比例
     *
     * 策略: 基于最近的成功率动态调整
     * - 成功率 < 30%: 0% 流量 (继续熔断)
     * - 成功率 30-50%: 10% 流量
     * - 成功率 50-70%: 30% 流量
     * - 成功率 70-90%: 50% 流量
     * - 成功率 > 90%: 100% 流量 (恢复到 closed)
     */
    calculateHalfOpenPassRate(domain) {
        const domainAdapters = this.getAdapters().filter(a => (a.failureDomain ?? a.provider) === domain);
        if (domainAdapters.length === 0)
            return 0;
        // 计算该域的加权平均成功率
        let totalRequests = 0;
        let weightedSuccess = 0;
        for (const adapter of domainAdapters) {
            const stats = this.metrics.getStats(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const weight = stats.totalRequests;
                totalRequests += weight;
                weightedSuccess += stats.successEMA * weight;
            }
        }
        if (totalRequests === 0)
            return 0.1; // 默认 10% 探测流量
        const avgSuccessRate = weightedSuccess / totalRequests;
        // 根据成功率计算通过比例
        if (avgSuccessRate < 0.3) {
            return 0; // 成功率太低，继续熔断
        }
        else if (avgSuccessRate < 0.5) {
            return 0.1; // 10% 流量
        }
        else if (avgSuccessRate < 0.7) {
            return 0.3; // 30% 流量
        }
        else if (avgSuccessRate < 0.9) {
            return 0.5; // 50% 流量
        }
        else {
            return 1.0; // 完全恢复，下次会自动切换到 closed 状态
        }
    }
    calculateUCB1(stats, totalRuns) {
        if (!stats || stats.totalRequests === 0)
            return 1.0;
        const mean = stats.successCount / stats.totalRequests;
        const explorationBonus = Math.sqrt((2 * Math.log(Math.max(totalRuns, 1))) / stats.totalRequests);
        return Math.min(mean + explorationBonus, 2.0) / 2.0;
    }
    createEmptyStats(modelName) {
        return {
            modelName,
            totalRequests: 0,
            successCount: 0,
            failureCount: 0,
            avgResponseTime: 0,
            totalTokens: 0,
            lastUsed: new Date(),
            recentFailures: 0,
            successEMA: 1.0,
            latencyEMA: 1000,
            costEMA: 3,
        };
    }
    /**
     * 应用自适应权重到所有策略
     */
    applyLearnedWeights() {
        const strategies = [
            types_1.RoutingStrategy.AUTO,
            types_1.RoutingStrategy.FASTEST_FIRST,
            types_1.RoutingStrategy.CHEAPEST_FIRST,
            types_1.RoutingStrategy.BEST_QUALITY
        ];
        for (const strategy of strategies) {
            const policyName = this.getPolicyName(strategy);
            const policy = this.policies.get(policyName);
            if (policy instanceof DslPolicy_1.DslPolicy) {
                const weights = this.adaptiveWeights.getWeights(strategy);
                policy.overrideWeights(weights);
            }
        }
    }
    /**
     * 根据策略获取对应的策略名称
     */
    getPolicyName(strategy) {
        switch (strategy) {
            case types_1.RoutingStrategy.FASTEST_FIRST: return 'latency-critical';
            case types_1.RoutingStrategy.CHEAPEST_FIRST: return 'cost-saving';
            case types_1.RoutingStrategy.BEST_QUALITY: return 'quality-first';
            default: return 'balanced';
        }
    }
    /**
     * 记录执行结果用于自适应学习
     */
    recordExecutionOutcome(adapter, result, strategy) {
        const outcome = {
            success: result.success,
            executionTime: result.executionTime,
            costLevel: adapter.capabilities.costLevel,
            timestamp: Date.now(),
            strategy,
            modelName: adapter.name
        };
        this.adaptiveWeights.recordOutcome(outcome);
        // 每次记录后重新应用权重
        this.applyLearnedWeights();
    }
    /**
     * 获取自适应权重统计
     */
    getAdaptiveWeightsStats() {
        return this.adaptiveWeights.getStats();
    }
    /**
     * 重置自适应权重
     */
    resetAdaptiveWeights(strategy) {
        this.adaptiveWeights.reset(strategy);
        this.applyLearnedWeights();
    }
}
exports.ModelRouter = ModelRouter;
//# sourceMappingURL=ModelRouter.js.map