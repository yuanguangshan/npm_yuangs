"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyEngine = exports.PolicyEngine = void 0;
class PolicyEngine {
    policies = new Map();
    registerPolicy(policy) {
        this.policies.set(policy.name, policy);
    }
    unregisterPolicy(name) {
        this.policies.delete(name);
    }
    async evaluate(context) {
        let finalResult = {
            allowed: true,
            reason: 'All policies passed'
        };
        for (const [name, policy] of this.policies) {
            const result = await policy.evaluate(context);
            if (!result.allowed) {
                return {
                    allowed: false,
                    reason: `Policy "${name}" blocked: ${result.reason}`,
                    requiresEscalation: result.requiresEscalation || false,
                    suggestedActions: result.suggestedActions
                };
            }
            if (result.requiresEscalation) {
                finalResult.requiresEscalation = true;
                finalResult.suggestedActions = result.suggestedActions;
            }
        }
        return finalResult;
    }
    evaluateRisk(action) {
        const { type, payload } = action;
        if (type === 'tool_call') {
            const toolName = payload.tool_name;
            const lowRiskTools = ['read_file', 'list_files', 'web_search'];
            if (lowRiskTools.includes(toolName)) {
                return 'low';
            }
            const mediumRiskTools = ['write_file', 'shell'];
            if (mediumRiskTools.includes(toolName)) {
                const cmd = payload.parameters?.command || payload.command || '';
                if (this.containsDangerousCommand(cmd)) {
                    return 'high';
                }
                return 'medium';
            }
            return 'medium';
        }
        if (type === 'shell_cmd') {
            const cmd = payload.command || '';
            if (this.containsDangerousCommand(cmd)) {
                return 'high';
            }
            return 'medium';
        }
        return 'low';
    }
    containsDangerousCommand(cmd) {
        const dangerousPatterns = [
            /rm\s+-rf\s+\//,
            /rm\s+-rf\s+~/,
            />\s*\/dev\/null/,
            /dd\s+if=/,
            /mkfs/,
            /format/,
            /sudo\s+rm/
        ];
        return dangerousPatterns.some(pattern => pattern.test(cmd));
    }
}
exports.PolicyEngine = PolicyEngine;
exports.policyEngine = new PolicyEngine();
//# sourceMappingURL=engine.js.map