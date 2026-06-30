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
/**
 * 轻量 CHAT 模式 Prompt（通用助手 + 默认直接回答）
 *
 * 与 buildV2_3ProtocolPrompt 的关键差异：
 * - 身份通用化（不再以"技术助手"自我设限）；
 * - 明确"默认直接 answer，不调工具"的规则，避免把知识问题误判为工具任务；
 * - 不输出 [PHASE ...] 阶段标签（chat 推理内联）；
 * - 内联精简工具列表，不加载重型 JSON Schema（弱模型看长 schema 反被诱导调工具）。
 *
 * 仅用于 mode === 'chat'。command/workflow/replanning 仍走 buildV2_3ProtocolPrompt。
 */
export declare function buildChatProtocolPrompt(): string;
