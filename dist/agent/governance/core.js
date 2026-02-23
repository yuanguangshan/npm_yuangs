"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateProposal = evaluateProposal;
function evaluateProposal(action, rules, ledger) {
    const now = Date.now();
    // 内置低风险工具自动批准规则
    if (action.type === 'tool_call') {
        const toolName = action.payload.tool_name;
        const lowRiskTools = ['read_file', 'list_files', 'web_search'];
        if (lowRiskTools.includes(toolName)) {
            return { effect: 'allow', reason: `Built-in allow for low-risk tool: ${toolName}` };
        }
    }
    // 检查用户自定义规则
    for (const rule of rules) {
        const typeMatch = !rule.when.type || rule.when.type === action.type;
        const payloadStr = JSON.stringify(action.payload);
        const patternMatch = !rule.when.pattern || new RegExp(rule.when.pattern, 'i').test(payloadStr);
        if (typeMatch && patternMatch) {
            if (rule.when.max_per_minute) {
                const count = ledger.filter(e => e.ts > now - 60000 && e.actionType === action.type).length;
                if (count >= rule.when.max_per_minute)
                    return { effect: 'deny', reason: `Rate limit: ${rule.id}` };
            }
            return { effect: rule.effect, reason: rule.reason };
        }
    }
    return { effect: 'require_approval', reason: 'Default human review required' };
}
//# sourceMappingURL=core.js.map