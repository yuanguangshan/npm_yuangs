import { AgentInput, AgentIntent, AgentMode } from './types';
import { inferCapabilityRequirement } from '../core/capabilityInference';
import { AtomicCapability } from '../core/capabilities';

export function inferIntent(
    input: AgentInput,
    mode: AgentMode
): AgentIntent {
    if (mode === 'chat') {
        return {
            type: 'chat',
            capabilities: {
                reasoning: true,
                streaming: true,
                longContext: true,
            },
        };
    }

    // For command mode, use the existing capability inference
    const capReq = inferCapabilityRequirement(input.rawInput);

    return {
        type: 'shell',
        capabilities: {
            reasoning: capReq.required.includes(AtomicCapability.REASONING),
            code: capReq.required.includes(AtomicCapability.CODE_GENERATION),
            longContext: capReq.required.includes(AtomicCapability.LONG_CONTEXT),
        },
    };
}
