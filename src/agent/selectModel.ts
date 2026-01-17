import { AgentIntent } from './types';

export function selectModel(
    intent: AgentIntent,
    override?: string
): string {
    if (override) return override;

    const caps = intent.capabilities;

    // Long context + reasoning = most powerful model
    if (caps.longContext && caps.reasoning) {
        return 'gemini-2.0-flash-exp';
    }

    // Code-focused tasks
    if (caps.code) {
        return 'gemini-2.5-flash-lite';
    }

    // Default to balanced model
    return 'gemini-2.5-flash-lite';
}
