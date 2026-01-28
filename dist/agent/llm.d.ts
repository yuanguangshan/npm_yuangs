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
export declare function runLLM({ prompt, model, stream, onChunk, bypassRouter }: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string, type?: 'thought' | 'json') => void;
    bypassRouter?: boolean;
}): Promise<LLMResult>;
