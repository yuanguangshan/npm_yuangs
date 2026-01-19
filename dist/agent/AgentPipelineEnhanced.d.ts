import { AgentInput, AgentMode } from './types';
import { ModelRegistry } from '../policy/model/ModelRegistry';
export declare class AgentPipelineEnhanced {
    private contextBuffer;
    private modelRegistry;
    private policy;
    constructor(modelRegistry?: ModelRegistry);
    run(input: AgentInput, mode: AgentMode): Promise<void>;
    /**
     * 执行带 TokenPolicy 的 pipeline
     */
    private runWithTokenPolicy;
    /**
     * 处理 Policy 结果
     */
    private handlePolicyResult;
    /**
     * 应用用户决策
     */
    private applyDecision;
    /**
     * 执行 LLM Pipeline（原有的流程）
     */
    private executeLLMPipeline;
    /**
     * 从输入中提取上下文 tokens (@file, #dir)
     */
    private extractContextTokens;
    /**
     * 确定 mode
     */
    private determineMode;
}
