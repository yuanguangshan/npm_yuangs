import { AgentIntent, AgentMode, LLMResult, AgentAction } from './types';
export declare function interpretResult(result: LLMResult, intent: AgentIntent, mode: AgentMode): AgentAction;
