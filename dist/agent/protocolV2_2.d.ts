/**
 * System Prompt V2.2 - THINK → ACT → OBSERVE Protocol
 *
 * 链式思维 (CoT) 显式分离，结构化推理
 */
export interface ProtocolV2_2Config {
    mode: 'chat' | 'command' | 'replanning';
    enableStrictOutput: boolean;
    enableReasoningTrace: boolean;
}
/**
 * 构建完整的 V2.2 协议 Prompt
 */
export declare function buildV2_2ProtocolPrompt(config: ProtocolV2_2Config): string;
/**
 * 构建输出格式约束
 */
export declare function buildOutputConstraints(): string;
/**
 * 构建动态上下文注入模板
 */
export declare function buildDynamicContextTemplate(): string;
