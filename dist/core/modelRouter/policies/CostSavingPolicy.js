"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostSavingPolicy = void 0;
const BasePolicy_1 = require("./BasePolicy");
class CostSavingPolicy extends BasePolicy_1.BasePolicy {
    name = 'cost-saving';
    description = '成本优先策略：优先选择成本最低的模型';
    score(adapters, task, config, modelStats) {
        return adapters.map((adapter) => {
            let score = 0;
            let reasons = [];
            score += (6 - adapter.capabilities.costLevel) * 0.12;
            reasons.push(`成本等级 ${adapter.capabilities.costLevel}`);
            score += 0.2;
            const stats = modelStats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.1;
            }
            else {
                score += 0.05;
            }
            if (adapter.capabilities.avgResponseTime < 2000) {
                score += 0.1;
            }
            return {
                adapter,
                score,
                reason: reasons.join('; '),
            };
        });
    }
}
exports.CostSavingPolicy = CostSavingPolicy;
//# sourceMappingURL=CostSavingPolicy.js.map