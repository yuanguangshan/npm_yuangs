"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateProposal = evaluateProposal;
/**
 * 核心裁决函数 (未来可直接编译为 WASM)
 * 输入：提案、策略集、历史账本
 * 输出：决定
 */
function evaluateProposal(action, rules, ledger) {
    const now = Date.now();
    for (const rule of rules) {
        const typeMatch = !rule.when.type || rule.when.type === action.type;
        const payloadStr = JSON.stringify(action.payload);
        const patternMatch = !rule.when.pattern || new RegExp(rule.when.pattern, 'i').test(payloadStr);
        if (typeMatch && patternMatch) {
            // 检查风险预算 (速率限制)
            if (rule.when.max_per_minute) {
                const minuteAgo = now - 60000;
                const count = ledger.filter(e => e.ts > minuteAgo && e.actionType === action.type).length;
                if (count >= rule.when.max_per_minute) {
                    return { effect: 'deny', reason: `速率限制触发: ${rule.id} (每分钟限额 ${rule.when.max_per_minute} 次)` };
                }
            }
            return { effect: rule.effect, reason: rule.reason };
        }
    }
    return { effect: 'require_approval', reason: '默认需审核' };
}
//# sourceMappingURL=core.js.map