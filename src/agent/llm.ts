import { AgentPrompt, LLMResult } from './types';
import chalk from 'chalk';
import { callAI_Stream } from '../ai/client';
import axios from 'axios';
import { type AIRequestMessage } from '../core/validation';
import { safeParseJSON } from '../core/validation';
import { z } from 'zod';
import { getConfigService } from '../core/ConfigService';
import { withRetry, RetryConfig } from './errorHandling';
import { callLLMWithRouter, shouldUseRouter } from './modelRouterIntegration';

/**
 * 结构化 AI 错误类
 */
export class AIError extends Error {
    constructor(
        message: string,
        public statusCode: number = 0,
        public rawError?: any
    ) {
        super(message);
        this.name = 'AIError';
    }
}

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
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
  'Assistant',
  'gemini-2.5-pro'
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
    const svc = getConfigService();
    return {
        aiProxyUrl: svc.getAiProxyUrl(),
        defaultModel: svc.getDefaultModel(),
        accountType: svc.getAccountType(),
    };
}

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
export function extractStreamableContent(raw: string): string | null {
  const SIMPLE_ESCAPES: Record<string, string> = {
    '"': '"', '\\': '\\', '/': '/', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t'
  };

  for (const key of ['"content"', '"final_answer"', '"text"']) {
    const keyIdx = raw.indexOf(key);
    if (keyIdx === -1) continue;

    let i = keyIdx + key.length;
    while (i < raw.length && /\s/.test(raw[i])) i++;        // 跳过 key 后空白
    if (i >= raw.length || raw[i] !== ':') continue;        // 等待冒号 / 并非该字段
    i++;
    while (i < raw.length && /\s/.test(raw[i])) i++;        // 跳过冒号后空白
    if (i >= raw.length) return '';                         // 冒号已到，等待起始引号
    if (raw[i] !== '"') continue;                           // 值非字符串，尝试下一个字段名

    i++;                                                    // 进入字符串内部
    let out = '';
    while (i < raw.length) {
      const ch = raw[i];
      if (ch === '\\') {
        if (i + 1 >= raw.length) break;                     // 转义符尚未到达，停下等下批
        const next = raw[i + 1];
        if (next === 'u') {
          if (i + 5 >= raw.length) break;                   // \uXXXX 尚未完整到达
          out += String.fromCharCode(parseInt(raw.slice(i + 2, i + 6), 16));
          i += 6;
          continue;
        }
        out += SIMPLE_ESCAPES[next] ?? next;
        i += 2;
        continue;
      }
      if (ch === '"') break;                                // 闭合引号 → 停止
      out += ch;
      i++;
    }
    return out;
  }
  return null;
}

export async function runLLM({
    prompt,
    model,
    stream,
    onChunk,
    bypassRouter
  }: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string, type?: 'thought' | 'json') => void;
    bypassRouter?: boolean;
  }): Promise<LLMResult> {
    const start = Date.now();
    const messages = prompt.system ? [{ role: 'system', content: prompt.system } as any, ...prompt.messages] : prompt.messages;

    // 包装 onChunk：Agent chat 模式下模型输出的是 JSON 对象（如 {"action_type":"answer","content":"…"}），
    // 直接把原始 chunk 下发会让终端实时打印 JSON 语法（花括号、字段名、转义符）。这里先累积原始流，
    // 增量提取 content 正文后再下发，用户看到的就是回答正文逐字流出。非 JSON（不以 { 或 ``` 开头）
    // 的流式输出按纯文本直通，兼容不走 JSON 协议的 adapter。两条下游路径（路由 / 直连）共用此包装。
    let streamRaw = '';
    let streamEmitted = 0;
    const wrappedOnChunk: ((chunk: string) => void) | undefined = stream
      ? (chunk: string) => {
          streamRaw += chunk;
          const head = streamRaw.trimStart();
          if (!head.startsWith('{') && !head.startsWith('```')) {
            onChunk?.(chunk, 'thought');
            return;
          }
          const content = extractStreamableContent(streamRaw);
          if (content === null) return;                 // 尚未定位到正文字段，保持等待态
          if (content.length > streamEmitted) {
            onChunk?.(content.slice(streamEmitted), 'thought');
            streamEmitted = content.length;
          }
        }
      : undefined;

    // --- ModelRouter Integration ---
    if (!bypassRouter && shouldUseRouter(messages, 'command')) {
      try {
        const routerResult = await callLLMWithRouter(messages, 'command', {
          onChunk: wrappedOnChunk,
          enableFallback: true // Let the router handle its own fallbacks too
        });

        if (routerResult.usedRouter && !routerResult.error) {
          console.log(chalk.blue(`📡 [Router] 任务路由成功 -> `) + chalk.bold.green(routerResult.modelName));
          return {
            rawText: routerResult.rawText,
            latencyMs: Date.now() - start,
            modelName: routerResult.modelName,
            usedRouter: true
          };
        }
        
        if (routerResult.error) {
            console.warn(`[ModelRouter] Routing failed, falling back to legacy path: ${routerResult.error}`);
        }
      } catch (error: any) {
        console.warn(`[ModelRouter] Unexpected error: ${error.message}, falling back...`);
      }
    }
    // --- End ModelRouter Integration ---

    if (stream) {
        // 路由失败回退到此处时，重置累积状态，避免把两段输出拼在一起污染提取
        streamRaw = '';
        streamEmitted = 0;

        await callAI_Stream(messages, model, wrappedOnChunk!);

        return {
            rawText: streamRaw,
            latencyMs: Date.now() - start,
            modelName: model,
            usedRouter: false
        };
    }

    // Non-streaming mode with optional schema
    const config = getUserConfig();
    const url = config.aiProxyUrl;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    // Native Structured Output: Check if model supports it and we're in Agent mode
    const modelUsed = model || config.defaultModel;
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

    const executeCall = async () => {
        const response = await axios.post(url, responseData, { headers }) as any;

        // Safely extract content from response
        let rawText = '';
        if (response.data && typeof response.data === 'object') {
          if (response.data.choices && Array.isArray(response.data.choices) && response.data.choices.length > 0) {
            rawText = response.data.choices[0]?.message?.content || '';
          } else {
            // Handle cases where response format is different
            rawText = response.data.content || response.data.text || JSON.stringify(response.data);
          }
        } else {
          rawText = String(response.data || '');
        }

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
            modelName: modelUsed,
            usedRouter: false
        };
    };

    try {
        const retryResult = await withRetry(executeCall, {
            maxAttempts: 3,
            retryableErrors: ['network', 'timeout', '503', '502', '429', 'ECONNRESET']
        });

        if (retryResult.success && retryResult.data) {
            return retryResult.data;
        }
        
        const retryError = retryResult.error;
        if (retryError instanceof AIError) {
            throw retryError;
        }
        throw new AIError(
            retryError?.message || 'AI 请求重试失败',
            (retryError as any)?.statusCode || 0,
            retryError
        );
    } catch (error: any) {
        if (error instanceof AIError) {
            throw error;
        }
        // Safely extract error message without accessing circular references
        let errorMsg = '未知错误';
        let statusCode = 0;
        
        // Only access the basic message property to avoid circular reference issues
        try {
            if (error.response) {
                statusCode = error.response.status;
                const responseData = error.response.data;
                if (typeof responseData.error?.message === 'string') {
                    errorMsg = responseData.error.message;
                } else if (typeof responseData.message === 'string') {
                    errorMsg = responseData.message;
                }
            } else if (error && typeof error.message === 'string') {
                errorMsg = error.message;
            } else if (typeof error === 'string') {
                errorMsg = error;
            } else {
                errorMsg = String(error);
            }
        } catch (e) {
            errorMsg = '未知错误（无法解析错误信息）';
        }
        
        const finalError = new AIError(`AI 请求失败 (Status: ${statusCode}): ${errorMsg}`, statusCode, error);
        throw finalError;
    }
}
