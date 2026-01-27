"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LatencyCriticalPolicy = void 0;
const BasePolicy_1 = require("./BasePolicy");
class LatencyCriticalPolicy extends BasePolicy_1.BasePolicy {
    name = 'latency-critical';
    description = '低延迟策略：优先选择响应最快的模型';
    score(adapters, task, config, modelStats) {
        return adapters.map((adapter) => {
            let score = 0;
            let reasons = [];
            const latency = adapter.capabilities.avgResponseTime;
            if (latency < 500) {
                score += 0.6;
                reasons.push('极速响应 (<500ms)');
            }
            else if (latency < 1000) {
                score += 0.5;
                reasons.push('快速响应 (<1s)');
            }
            else if (latency < 2000) {
                score += 0.3;
            }
            else {
                score += 0.1;
            }
            score += 0.2;
            const stats = modelStats.get(adapter.name);
            if (stats && stats.totalRequests > 0) {
                const successRate = stats.successCount / stats.totalRequests;
                score += successRate * 0.1;
            }
            else {
                score += 0.05;
            }
            score += (6 - adapter.capabilities.costLevel) * 0.02;
            return {
                adapter,
                score,
                reason: reasons.join('; '),
            };
        });
    }
}
exports.LatencyCriticalPolicy = LatencyCriticalPolicy;
//# sourceMappingURL=LatencyCriticalPolicy.js.map