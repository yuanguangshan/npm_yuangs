"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noDangerousShellPolicy = exports.NoDangerousShellPolicy = void 0;
class NoDangerousShellPolicy {
    name = 'no-dangerous-shell';
    description = 'Prevents execution of dangerous shell commands';
    evaluate(context) {
        const { action } = context;
        if (action.type === 'shell_cmd') {
            const command = action.payload?.command || '';
            const dangerousPatterns = [
                { pattern: /rm\s+-rf\s+\//, name: 'rm -rf /', risk: 'high' },
                { pattern: /rm\s+-rf\s+~/, name: 'rm -rf ~', risk: 'high' },
                { pattern: />\s*\/dev\/null/, name: 'Redirect to /dev/null', risk: 'medium' },
                { pattern: /dd\s+if=/, name: 'dd command', risk: 'high' },
                { pattern: /mkfs/, name: 'mkfs (filesystem creation)', risk: 'high' },
                { pattern: /format/, name: 'format command', risk: 'high' },
                { pattern: /sudo\s+rm/, name: 'sudo rm', risk: 'high' },
                { pattern: /chmod\s+777\s+\/(?!dev)/, name: 'chmod 777 on system', risk: 'high' },
                { pattern: /:\s*~\(\)/, name: 'fork bomb', risk: 'high' }
            ];
            for (const { pattern, name, risk } of dangerousPatterns) {
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