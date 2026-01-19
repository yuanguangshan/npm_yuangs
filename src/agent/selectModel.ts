import { AgentIntent } from './types';
import { getUserConfig } from '../ai/client';

export function selectModel(
    intent: AgentIntent,
    override?: string
): string {
    if (override) return override;

    const config = getUserConfig();
    const defaultModel = config.defaultModel || 'Assistant';

    return defaultModel;
}
