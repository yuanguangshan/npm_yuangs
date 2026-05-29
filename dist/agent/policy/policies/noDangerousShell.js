"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noDangerousShellPolicy = exports.NoDangerousShellPolicy = void 0;
const dangerousShellPatterns_1 = require("./dangerousShellPatterns");
class NoDangerousShellPolicy {
    name = 'no-dangerous-shell';
    description = 'Prevents execution of dangerous shell commands';
    evaluate(context) {
        const { action } = context;
        if (action.type === 'shell_cmd') {
            const command = action.payload.command || '';
            for (const { pattern, name, risk } of dangerousShellPatterns_1.DANGEROUS_SHELL_PATTERNS) {
                if (pattern.test(command)) {
                    return {
                        allowed: false,
                        reason: `Dangerous command detected: ${name} (${risk} risk)`,
                        requiresEscalation: risk === 'high',
                        suggestedActions: [
                            `Review the command: "${command}"`,
                            'Consider using safer alternatives',
                            'Break down the operation into smaller, safer steps'
                        ]
                    };
                }
            }
        }
        return {
            allowed: true,
            reason: 'No dangerous patterns detected'
        };
    }
}
exports.NoDangerousShellPolicy = NoDangerousShellPolicy;
exports.noDangerousShellPolicy = new NoDangerousShellPolicy();
//# sourceMappingURL=noDangerousShell.js.map