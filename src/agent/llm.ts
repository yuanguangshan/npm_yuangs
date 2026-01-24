import { AgentPrompt, LLMResult } from './types';
import { callAI_Stream } from '../ai/client';
import axios from 'axios';
import { DEFAULT_AI_PROXY_URL, DEFAULT_MODEL, DEFAULT_ACCOUNT_TYPE, type AIRequestMessage } from '../core/validation';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { safeParseJSON } from '../core/validation';
import { z } from 'zod';
import { withRetry, RetryConfig } from './errorHandling';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

// Agent Action Schema for Native Structured Output
export { supportsStructuredOutput };

export const AgentActionSchema = z.object({
  action_type: z.enum(['tool_call', 'shell_cmd', 'answer', 'code_diff']),
  tool_name: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
  command: z.string().optional(),
  diff: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  risk_explanation: z.string().optional(),
  content: z.string().optional(),
  is_done: z.boolean().optional()
});

export type AgentAction = z.infer<typeof AgentActionSchema>;

// Models that support native structured output
const STRUCTURED_OUTPUT_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'claude-3.5-sonnet',
  'claude-3.5-haiku',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

/**
 * Check if a model supports native structured output
 */
function supportsStructuredOutput(model: string): boolean {
  const modelName = model.toLowerCase();
  return STRUCTURED_OUTPUT_MODELS.some(supported => 
    modelName.includes(supported.toLowerCase())
  );
}

function getUserConfig(): any {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content);
        } catch (e) { }
    }
    return {};
}

export async function runLLM({
    prompt,
    model,
    stream,
    onChunk,
}: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string) => void;
}): Promise<LLMResult> {
    const start = Date.now();

    if (stream) {
        let raw = '';
        const messages = prompt.system ? [{ role: 'system', content: prompt.system } as any, ...prompt.messages] : prompt.messages;
        await callAI_Stream(messages, model, (chunk) => {
            raw += chunk;
            onChunk?.(chunk);
        });
        return {
            rawText: raw,
            latencyMs: Date.now() - start,
        };
    }

    // Non-streaming mode with optional schema
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    // Native Structured Output: Check if model supports it and we're in Agent mode
    const modelUsed = model || config.defaultModel || DEFAULT_MODEL;
    const useStructuredOutput = supportsStructuredOutput(modelUsed) && !stream;

    let responseData: any = {
        model: modelUsed,
        messages: prompt.system ? [{ role: 'system', content: prompt.system }, ...prompt.messages] : prompt.messages,
        stream: false
    };

    if (useStructuredOutput && prompt.system?.includes('SYSTEM PROTOCOL')) {
        responseData.response_format = {
            type: 'json_schema',
            json_schema: {
                name: 'agent_action',
                description: 'Agent action following REACT protocol',
                strict: true,
                schema: {
                    type: 'object',
                    properties: {
                        action_type: {
                            type: 'string',
                            enum: ['tool_call', 'shell_cmd', 'answer', 'code_diff']
                        },
                        tool_name: {
                            type: 'string'
                        },
                        parameters: {
                            type: 'object',
                            additionalProperties: true
                        },
                        command: {
                            type: 'string'
                        },
                        diff: {
                            type: 'string'
                        },
                        risk_level: {
                            type: 'string',
                            enum: ['low', 'medium', 'high']
                        },
                        risk_explanation: {
                            type: 'string'
                        },
                        content: {
                            type: 'string'
                        },
                        is_done: {
                            type: 'boolean'
                        }
                    },
                    required: ['action_type', 'risk_level']
                }
            }
        };
    }

    try {
        const response = await withRetry(async () => await axios.post(url, responseData, { headers }) as any, {
          retryableErrors: ['network', 'timeout', 'rate limit', 'ECONNRESET', 'ETIMEDOUT', '503', '502', '429'],
          maxAttempts: 3
        });
        const rawText = (response.data as any)?.choices[0]?.message?.content || '';

        let parsed = undefined;
        if (prompt.outputSchema) {
            const parseResult = safeParseJSON(rawText, prompt.outputSchema, {});
            if (parseResult.success) {
                parsed = parseResult.data;
            }
        }

        return {
            rawText,
            parsed,
            latencyMs: Date.now() - start,
        };
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}
