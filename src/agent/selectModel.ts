import { AgentIntent } from './types';
import { getUserConfig } from '../ai/client';

export function selectModel(
    intent: AgentIntent,
    override?: string
): string {
    if (override) return override;

    const config = getUserConfig();
    const defaultModel = config.defaultModel || 'gemini-2.5-flash-lite';

    return defaultModel;
}
