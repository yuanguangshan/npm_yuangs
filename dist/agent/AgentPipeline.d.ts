import { AgentInput, AgentMode } from './types';
export declare class AgentPipeline {
    run(input: AgentInput, mode: AgentMode): Promise<void>;
}
