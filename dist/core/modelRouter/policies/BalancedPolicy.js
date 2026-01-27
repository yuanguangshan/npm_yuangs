"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancedPolicy = void 0;
const BasePolicy_1 = require("./BasePolicy");
class BalancedPolicy extends BasePolicy_1.BasePolicy {
    name = 'balanced';
    description = '均衡策略：综合考虑匹配度、性能、成本和历史表现';
    score(adapters, task, config, modelStats) {
        return adapters.map((adapter) => {
            let score = 0;
            let reasons = [];
            // 1. 任务类型匹配 (40%)
            score += 0.4;
            reasons.push('支持任务类型');
            // 2. 上下文窗口 (20%)
            score += 0.2;
            if (task.contextSize && adapter.capabilities.maxContextWindow >= task.contextSize * 2) {
                score += 0.05;
                reasons.push('上下文窗口充裕');
            }
            // 3. 响应时间 (20%)
            if (task.expectedResponseTime) {
                if (adapter.capabilities.avgResponseTime <= task.expectedResponseTime) {
                    score += 0.2;
                    reasons.push('响应时间符合要求');
                }
                else {
                    score += 0.1;
                }
            }
            else {
                if (adapter.capabilities.avgResponseTime < 1000) {
                    score += 0.2;
                    reasons.push('响应迅速');
                }
                else if (adapter.capabilities.avgResponseTime < 3000) {
                    score += 0.15;
                }
                else {
                    score += 0.1;
                }
            }
            // 4. 成本 (10%)
            if (config.maxCostLevel) {
                if (adapter.capabilities.costLevel <= config.maxCostLevel) {
                    score += 0.1;
                    reasons.push('成本符合预算');
                }
            }
            else {
                score += (6 - adapter.capabilities.costLevel) * 0.02;
            }
            // 5. 历史表现 (10%)
            const stats = modelStats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.1;
                if (successRate > 0.9) {
                    reasons.push('历史表现优秀');
                }
            }
            else {
                score += 0.05;
            }
            return {
                adapter,
                score,
                reason: reasons.join('; ') || '综合表现良好',
            };
        });
    }
}
exports.BalancedPolicy = BalancedPolicy;
//# sourceMappingURL=BalancedPolicy.js.map