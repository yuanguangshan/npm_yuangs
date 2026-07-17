import { AgentPrompt, LLMResult } from './types';
import { z } from 'zod';
/**
 * 结构化 AI 错误类
 */
export declare class AIError extends Error {
    statusCode: number;
    rawError?: any | undefined;
    constructor(message: string, statusCode?: number, rawError?: any | undefined);
}
export { supportsStructuredOutput };
export declare const AgentActionSchema: z.ZodObject<{
    action_type: z.ZodEnum<{
        tool_call: "tool_call";
        code_diff: "code_diff";
        shell_cmd: "shell_cmd";
        answer: "answer";
    }>;
    tool_name: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    command: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    risk_level: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    risk_explanation: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    is_done: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
/**
 * Check if a model supports native structured output
 */
declare function supportsStructuredOutput(model: string): boolean;
/**
 * 从流式累积的 Agent JSON 响应中，增量提取可安全展示给用户的正文文本。
 *
 * chat 模式要求模型输出单个 JSON 对象，形如：
 *   {"action_type":"answer","content":"回答正文…","is_done":true}
 * 若把原始 chunk 直接推给终端，用户会实时看到 JSON 语法（花括号、字段名、转义符）。
 * 本函数定位 "content"（或 final_answer / text）字符串字段，按 JSON 规则解码转义后，
 * 返回“截至当前缓冲区为止已确定”的正文；遇到尚未到达的转义序列或闭合引号时停下，
 * 等下一批 chunk 到达后重新扫描即可补齐，从而支持安全的增量下发（不会吐出半截转义或闭合引号）。
 *
 * @returns 已确定的正文文本；若尚未定位到正文字段则返回 null（调用方应保持等待态）。
 *          字段已定位但值尚未开始（冒号后等待引号）时返回空字符串。
 */
export declare function extractStreamableContent(raw: string): string | null;
export declare function runLLM({ prompt, model, stream, onChunk, bypassRouter }: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string, type?: 'thought' | 'json') => void;
    bypassRouter?: boolean;
}): Promise<LLMResult>;
