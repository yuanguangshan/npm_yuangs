import { AgentInput, AgentMode } from './types';
export declare class AgentPipeline {
    private contextBuffer;
    run(input: AgentInput, mode: AgentMode): Promise<void>;
}
