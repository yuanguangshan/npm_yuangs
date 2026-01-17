import { AgentInput, AgentContext } from './types';
import { ContextBuffer } from '../commands/contextBuffer';

// Create a singleton instance for the agent
const globalContextBuffer = new ContextBuffer();

export function buildContext(input: AgentInput): AgentContext {
    const items = globalContextBuffer.export();

    return {
        files: items.map(item => ({
            path: item.path,
            content: item.content,
        })),
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}

export function getAgentContextBuffer(): ContextBuffer {
    return globalContextBuffer;
}
