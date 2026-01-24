import { AgentInput, AgentContext } from './types';
import { ContextBuffer } from '../commands/contextBuffer';
/**
 * Build context for agent execution
 * Implements intelligent token optimization by using AST summaries for large files
 * instead of sending full file contents
 */
export declare function buildContext(input: AgentInput, contextBuffer: ContextBuffer): AgentContext;
