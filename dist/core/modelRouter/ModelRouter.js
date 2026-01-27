"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = void 0;
const types_1 = require("./types");
const DslPolicy_1 = require("./policies/DslPolicy");
/**
 * 模型路由器
 * 负责根据任务配置和路由策略选择合适的模型适配器
 */
class ModelRouter {
    adapters = new Map();
    stats = new Map();
    policies = new Map();
    domainHealth = new Map();
    roundRobinIndex = 0;
    constructor() {
        this.registerDefaultPolicies();
    }
    /**
     * 注册默认策略
     */
    registerDefaultPolicies() {
        // 1. 均衡模式
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'balanced',
            description: '均衡策略：综合考虑匹配度、性能、成本和历史表现',
            weights: { taskMatch: 0.4, context: 0.2, latency: 0.2, cost: 0.1, history: 0.1 }
        }));
        // 2. 成本模式
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'cost-saving',
            description: '成本优先模式：优先选择廉价的模型，保证基础可用',
            weights: { cost: 0.7, taskMatch: 0.2, history: 0.1 }
        }));
        // 3. 低延迟模式
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'latency-critical',
            description: '追求极致响应速度：优先选择平均响应时间最短的模型',
            weights: { latency: 0.7, taskMatch: 0.2, history: 0.1 }
        }));
        // 4. 质量优先模式
        this.registerPolicy(new DslPolicy_1.DslPolicy({
            name: 'quality-first',
            description: '高复杂度任务优先：由代码专家和大型语言模型处理',
            gate: { minContext: 32000 },
            weights: { quality: 0.6, history: 0.2, taskMatch: 0.2 }
        }));
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
                recentFailures: 0,
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
        this.updateDomainHealthStates(); // 预选前先刷新熔断状态
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
            return this.executePolicyWithExploration(fallbackPolicy, allAdapters, taskConfig, routingConfig);
        }
        return this.executePolicyWithExploration(policy, allAdapters, taskConfig, routingConfig);
    }
    /**
     * 执行策略并加入探索机制
     */
    async executePolicyWithExploration(policy, adapters, taskConfig, routingConfig) {
        try {
            const result = await policy.select(adapters, taskConfig, routingConfig, this.stats, this.domainHealth);
            // 进一步通过熔断器(Circuit Breaker)过滤候选者
            const allowedCandidates = result.candidates.filter(c => {
                const adapter = this.adapters.get(c.name);
                return adapter ? this.isAdapterAllowedByCircuitBreaker(adapter) : false;
            });
            if (allowedCandidates.length === 0) {
                throw new Error('所有策略候选均被当前熔断器拦截（故障域保护）');
            }
            // 如果最优解被熔断拦截了，重新选分最高的可用者
            let bestCandidate = allowedCandidates.sort((a, b) => b.score - a.score)[0];
            let finalAdapter = this.adapters.get(bestCandidate.name);
            let finalReason = `策略(${policy.name}): ${result.reason}`;
            // 3. 应用探索机制
            const exploration = routingConfig.exploration;
            const strategy = exploration?.strategy || types_1.ExplorationStrategy.NONE;
            if (strategy === types_1.ExplorationStrategy.EPSILON_GREEDY) {
                const epsilon = exploration?.epsilon || 0;
                if (epsilon > 0 && Math.random() < epsilon) {
                    const otherCandidates = allowedCandidates.filter(c => c.name !== bestCandidate.name);
                    if (otherCandidates.length > 0) {
                        const picked = otherCandidates[Math.floor(Math.random() * otherCandidates.length)];
                        const pickedAdapter = this.adapters.get(picked.name);
                        if (pickedAdapter) {
                            finalAdapter = pickedAdapter;
                            finalReason = `ε-greedy 探索采样 (ε=${epsilon}): 随机选中了候选 [${picked.name}]，原定最优为 [${bestCandidate.name}] (原因: ${picked.reason})`;
                        }
                    }
                }
            }
            else if (strategy === types_1.ExplorationStrategy.UCB1) {
                // 计算 UCB1 分数并重新排序候选者
                const totalRuns = Array.from(this.stats.values()).reduce((sum, s) => sum + s.totalRequests, 0);
                const candidatesWithUCB = allowedCandidates.map(c => {
                    const s = this.stats.get(c.name);
                    const ucb = this.calculateUCB1(s, totalRuns);
                    // 综合原始 Score (0.7权重) 和 UCB (0.3权重)
                    const combinedScore = c.score * 0.7 + ucb * 0.3;
                    return { ...c, combinedScore, ucb };
                });
                candidatesWithUCB.sort((a, b) => b.combinedScore - a.combinedScore);
                const topOne = candidatesWithUCB[0];
                if (topOne.name !== bestCandidate.name) {
                    finalAdapter = this.adapters.get(topOne.name);
                    finalReason = `UCB1 探索调优: 选中了 [${topOne.name}] (UCB分数=${topOne.ucb.toFixed(3)})，原定最优为 [${bestCandidate.name}]`;
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
    /**
     * 执行任务（带统计）
     */
    async executeTask(adapter, prompt, config, onChunk) {
        const stats = this.stats.get(adapter.name);
        const domain = adapter.failureDomain ?? adapter.provider;
        stats.totalRequests++;
        stats.lastUsed = new Date();
        try {
            const result = await adapter.execute(prompt, config, onChunk);
            if (result.success) {
                stats.successCount++;
                stats.recentFailures = 0; // 重置该模型的连续失败次数
                // 故障域探测成功：如果当前是 half-open，探测成功即恢复为 closed
                const health = this.domainHealth.get(domain);
                if (health && health.state === 'half-open') {
                    health.state = 'closed';
                    console.log(`📡 故障域 [${domain}] 已自动恢复 (Closed)`);
                }
            }
            else {
                stats.failureCount++;
                stats.recentFailures++; // 累加连续失败
                stats.lastFailureAt = new Date();
                // 故障域探测失败：如果是 half-open 时探测失败，立即滚回 open 并重置冷却
                const health = this.domainHealth.get(domain);
                if (health && health.state === 'half-open') {
                    health.state = 'open';
                    health.openedAt = Date.now();
                    console.warn(`📡 故障域 [${domain}] 探测失败，延长熔断时间 (Open)`);
                }
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
            stats.recentFailures++;
            stats.lastFailureAt = new Date();
            // 捕获到异常也视为探测失败
            const health = this.domainHealth.get(domain);
            if (health && health.state === 'half-open') {
                health.state = 'open';
                health.openedAt = Date.now();
            }
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
     * 刷新所有故障域的熔断状态
     */
    updateDomainHealthStates() {
        const now = Date.now();
        const adapters = Array.from(this.adapters.values());
        const domains = new Set(adapters.map(a => a.failureDomain ?? a.provider));
        for (const domain of domains) {
            let health = this.domainHealth.get(domain);
            if (!health) {
                health = { state: 'closed' };
                this.domainHealth.set(domain, health);
            }
            // 计算该域下是否有模型连续失败达到阈值 (3次)
            const domainAdapters = adapters.filter(a => (a.failureDomain ?? a.provider) === domain);
            const hasSeriousFailures = domainAdapters.some(a => {
                const s = this.stats.get(a.name);
                return s && s.recentFailures >= 3;
            });
            if (health.state === 'closed' && hasSeriousFailures) {
                health.state = 'open';
                health.openedAt = now;
                console.warn(`🚨 故障域 [${domain}] 连续错误，已触发熔断拦截 (Open)`);
            }
            else if (health.state === 'open' && now - (health.openedAt || 0) > 30000) {
                // 30秒冷却后进入尝试半开状态
                health.state = 'half-open';
                console.log(`📡 故障域 [${domain}] 进入半探测模式 (Half-Open)`);
            }
        }
    }
    /**
     * 检查熔断器状态是否允许适配器执行
     */
    isAdapterAllowedByCircuitBreaker(adapter) {
        const domain = adapter.failureDomain ?? adapter.provider;
        const health = this.domainHealth.get(domain);
        if (!health || health.state === 'closed')
            return true;
        if (health.state === 'open')
            return false;
        // Half-Open 状态：仅 10% 流量作为探测请求，其余拦截
        if (health.state === 'half-open') {
            return Math.random() < 0.1;
        }
        return true;
    }
    /**
     * 计算 UCB1 分数 (探索-利用平衡)
     * 置信上限 = 平均成功率 + sqrt(2 * ln(总探索次数) / 该模型探测次数)
     */
    calculateUCB1(stats, totalRuns) {
        if (!stats || stats.totalRequests === 0)
            return 1.0; // 新模型给予最高探索优先级
        const mean = stats.successCount / stats.totalRequests;
        const explorationBonus = Math.sqrt((2 * Math.log(Math.max(totalRuns, 1))) / stats.totalRequests);
        // 归一化到 0-1 范围的一个启发式分数
        return Math.min(mean + explorationBonus, 2.0) / 2.0;
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
            recentFailures: 0,
        };
    }
}
exports.ModelRouter = ModelRouter;
//# sourceMappingURL=ModelRouter.js.map