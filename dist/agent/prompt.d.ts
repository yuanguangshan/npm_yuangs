import { AgentIntent, AgentContext, AgentMode, AgentPrompt } from './types';
export declare function buildPrompt(intent: AgentIntent, context: AgentContext, mode: AgentMode, input: string): AgentPrompt;
