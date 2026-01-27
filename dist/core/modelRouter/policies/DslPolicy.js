"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DslPolicy = void 0;
const types_1 = require("../types");
const BasePolicy_1 = require("./BasePolicy");
/**
 * 通用 DSL 驱动策略
 * 通过配置权重和 Gate 规则来定义路由行为
 */
class DslPolicy extends BasePolicy_1.BasePolicy {
    dsl;
    constructor(dsl) {
        super();
        this.dsl = dsl;
    }
    get name() { return this.dsl.name; }
    get description() { return this.dsl.description; }
    /**
     * 实现 DSL 驱动的 Gate 过滤
     */
    async gate(adapters, task, modelStats, domainHealthMap) {
        // 先调用基类的通用过滤 (TaskType, ContextSize, FailureDomain)
        let filtered = await super.gate(adapters, task, modelStats, domainHealthMap);
        const gateConfig = this.dsl.gate;
        if (!gateConfig)
            return filtered;
        return filtered.filter(adapter => {
            // 1. 最小上下文阈值
            if (gateConfig.minContext && adapter.capabilities.maxContextWindow < gateConfig.minContext) {
                return false;
            }
            // 2. 流式输出要求
            if (gateConfig.requireStreaming && !adapter.capabilities.supportsStreaming) {
                return false;
            }
            // 3. 特殊能力要求
            if (gateConfig.requiredCapabilities) {
                const hasAll = gateConfig.requiredCapabilities.every(req => adapter.capabilities.specialCapabilities?.includes(req));
                if (!hasAll)
                    return false;
            }
            return true;
        });
    }
    /**
     * 实现 DSL 驱动的加权评分
     */
    score(adapters, task, config, modelStats) {
        const weights = this.dsl.weights;
        return adapters.map(adapter => {
            let totalScore = 0;
            let reasons = [];
            // 1. 任务匹配度 (Task Match)
            if (weights.taskMatch) {
                const isSupported = adapter.capabilities.supportedTaskTypes.includes(task.type);
                const score = isSupported ? 1.0 : 0.0;
                totalScore += score * weights.taskMatch;
                if (isSupported)
                    reasons.push('任务类型匹配');
            }
            // 2. 上下文富余度 (Context Capacity)
            if (weights.context) {
                const requested = task.contextSize || 0;
                const ratio = Math.min(adapter.capabilities.maxContextWindow / Math.max(requested * 2, 8000), 1.0);
                totalScore += ratio * weights.context;
                if (ratio > 0.8)
                    reasons.push('上下文资源充足');
            }
            // 3. 延迟性能 (Latency)
            if (weights.latency) {
                // 归一化延迟: < 1s 为 1.0, > 10s 为 0.0
                const latency = adapter.capabilities.avgResponseTime;
                const score = Math.max(0, 1 - (latency / 10000));
                totalScore += score * weights.latency;
                if (score > 0.8)
                    reasons.push('响应速度快');
            }
            // 4. 成本效益 (Cost)
            if (weights.cost) {
                // 等级 1(最廉价) -> 1.0, 等级 5(最昂贵) -> 0.2
                const score = (6 - adapter.capabilities.costLevel) * 0.2;
                totalScore += score * weights.cost;
                if (score > 0.7)
                    reasons.push('性价比高');
            }
            // 5. 历史成功率 (History Performance)
            if (weights.history) {
                const stats = modelStats.get(adapter.name);
                let score = 0.5; // 新模型默认中等
                if (stats && stats.totalRequests > 0) {
                    score = stats.successCount / stats.totalRequests;
                }
                totalScore += score * weights.history;
                if (score > 0.9)
                    reasons.push('历史表现非常稳定');
            }
            // 6. 质量专家 (Quality/Expert)
            if (weights.quality) {
                let score = 0.5;
                const isSpecialist = ((task.type === types_1.TaskType.CODE_GENERATION || task.type === types_1.TaskType.DEBUG) &&
                    adapter.capabilities.specialCapabilities?.includes('code-expert'));
                if (isSpecialist)
                    score = 1.0;
                totalScore += score * weights.quality;
                if (isSpecialist)
                    reasons.push('领域专家模型');
            }
            return {
                adapter,
                score: totalScore,
                reason: reasons.length > 0 ? reasons.join('; ') : '评分符合预期'
            };
        });
    }
}
exports.DslPolicy = DslPolicy;
//# sourceMappingURL=DslPolicy.js.map