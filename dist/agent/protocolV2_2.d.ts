/**
 * System Protocol V2.3 - Based on src/agent/how.md
 * THINK → ACT → OBSERVE Protocol with Explicit Mode Switching
 */
export interface ProtocolV2_3Config {
    mode: 'chat' | 'command' | 'workflow' | 'replanning';
    enableStrictOutput: boolean;
    enableReasoningTrace: boolean;
}
/**
 * 构建完整的 V2.3 协议 Prompt
 */
export declare function buildV2_3ProtocolPrompt(config: ProtocolV2_3Config): string;
/**
 * 构建输出格式约束
 */
export declare function buildOutputConstraints(): string;
/**
 * 构建动态上下文注入模板
 */
export declare function buildDynamicContextTemplate(): string;
