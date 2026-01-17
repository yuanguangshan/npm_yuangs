"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretResult = interpretResult;
function interpretResult(result, intent, mode) {
    if (mode === 'chat') {
        return { type: 'print', content: result.rawText };
    }
    const plan = result.parsed;
    if (!plan || !plan.command) {
        throw new Error('Invalid command plan from LLM');
    }
    return {
        type: 'confirm',
        next: {
            type: 'execute',
            command: plan.command,
            risk: plan.risk ?? 'medium',
        },
    };
}
//# sourceMappingURL=interpret.js.map