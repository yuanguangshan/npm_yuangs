import { AgentInput, AgentContext } from './types';
import { ContextBuffer } from '../commands/contextBuffer';

export function buildContext(input: AgentInput, contextBuffer: ContextBuffer): AgentContext {
    const items = contextBuffer.export();

    return {
        files: items.map(item => ({
            path: item.path,
            content: item.content ?? item.summary ?? '',
        })),
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}
