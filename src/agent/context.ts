import { AgentInput, AgentContext } from './types';
import { ContextBuffer } from '../commands/contextBuffer';
import { generateFileSummary, generateSummaryReport } from './codeSummary';

/**
 * Build context for agent execution
 * Implements intelligent token optimization by using AST summaries for large files
 * instead of sending full file contents
 */
export function buildContext(input: AgentInput, contextBuffer: ContextBuffer): AgentContext {
    const items = contextBuffer.export();

    const files = items.map(item => {
        const content = item.content ?? item.summary ?? '';

        // Token optimization: Use summary instead of full content if file is large (> 500 lines or > 20KB)
        const lines = content.split('\n').length;
        const sizeKb = content.length / 1024;

        if (lines > 500 || sizeKb > 20) {
            const summary = generateFileSummary(item.path, content);
            return {
                path: item.path,
                content: summary.summary, // Use AST summary instead of full content
            };
        }

        return {
            path: item.path,
            content: content,
        };
    });

    return {
        files,
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}
