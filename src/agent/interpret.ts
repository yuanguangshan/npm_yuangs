import { AgentIntent, AgentMode, LLMResult, AgentAction } from './types';

export function interpretResult(
    result: LLMResult,
    intent: AgentIntent,
    mode: AgentMode
): AgentAction {
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
