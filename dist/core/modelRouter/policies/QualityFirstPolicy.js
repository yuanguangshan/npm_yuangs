"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityFirstPolicy = void 0;
const types_1 = require("../types");
const BasePolicy_1 = require("./BasePolicy");
class QualityFirstPolicy extends BasePolicy_1.BasePolicy {
    name = 'quality-first';
    description = '质量优先策略：优先选择能力最强、最专业的模型';
    score(adapters, task, config, modelStats) {
        return adapters.map((adapter) => {
            let score = 0;
            let reasons = [];
            if (task.type === types_1.TaskType.CODE_GENERATION ||
                task.type === types_1.TaskType.CODE_REVIEW ||
                task.type === types_1.TaskType.DEBUG) {
                if (adapter.capabilities.specialCapabilities?.includes('code-expert')) {
                    score += 0.4;
                    reasons.push('代码专家模型');
                }
                else {
                    score += 0.2;
                }
            }
            else {
                if (adapter.capabilities.maxContextWindow > 100000) {
                    score += 0.3;
                    reasons.push('大上下文模型');
                }
                else {
                    score += 0.15;
                }
            }
            score += adapter.capabilities.costLevel * 0.04;
            score += 0.2;
            const stats = modelStats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.2;
                if (successRate > 0.95) {
                    reasons.push('极其稳定');
                }
            }
            else {
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
exports.QualityFirstPolicy = QualityFirstPolicy;
//# sourceMappingURL=QualityFirstPolicy.js.map