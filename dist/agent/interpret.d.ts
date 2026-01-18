import { AgentIntent, AgentMode, LLMResult } from './types';
import { AgentPlan } from './plan';
export declare function interpretResultToPlan(result: LLMResult, intent: AgentIntent, mode: AgentMode, alreadyStreamed?: boolean): AgentPlan;
