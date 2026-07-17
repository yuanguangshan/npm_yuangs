"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentActionSchema = exports.AIError = void 0;
exports.supportsStructuredOutput = supportsStructuredOutput;
exports.extractStreamableContent = extractStreamableContent;
exports.runLLM = runLLM;
const chalk_1 = __importDefault(require("chalk"));
const client_1 = require("../ai/client");
const axios_1 = __importDefault(require("axios"));
const validation_1 = require("../core/validation");
const zod_1 = require("zod");
const ConfigService_1 = require("../core/ConfigService");
const errorHandling_1 = require("./errorHandling");
const modelRouterIntegration_1 = require("./modelRouterIntegration");
/**
 * 结构化 AI 错误类
 */
class AIError extends Error {
    statusCode;
    rawError;
    constructor(message, statusCode = 0, rawError) {
        super(message);
        this.statusCode = statusCode;
        this.rawError = rawError;
        this.name = 'AIError';
    }
}
exports.AIError = AIError;
exports.AgentActionSchema = zod_1.z.object({
    action_type: zod_1.z.enum(['tool_call', 'shell_cmd', 'answer', 'code_diff']),
    tool_name: zod_1.z.string().optional(),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    command: zod_1.z.string().optional(),
    diff: zod_1.z.string().optional(),
    risk_level: zod_1.z.enum(['low', 'medium', 'high']),
    risk_explanation: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    is_done: zod_1.z.boolean().optional()
});
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
function supportsStructuredOutput(model) {
    const modelName = model.toLowerCase();
    return STRUCTURED_OUTPUT_MODELS.some(supported => modelName.includes(supported.toLowerCase()));
}
function getUserConfig() {
    const svc = (0, ConfigService_1.getConfigService)();
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
function extractStreamableContent(raw) {
    const SIMPLE_ESCAPES = {
        '"': '"', '\\': '\\', '/': '/', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t'
    };
    for (const key of ['"content"', '"final_answer"', '"text"']) {
        const keyIdx = raw.indexOf(key);
        if (keyIdx === -1)
            continue;
        let i = keyIdx + key.length;
        while (i < raw.length && /\s/.test(raw[i]))
            i++; // 跳过 key 后空白
        if (i >= raw.length || raw[i] !== ':')
            continue; // 等待冒号 / 并非该字段
        i++;
        while (i < raw.length && /\s/.test(raw[i]))
            i++; // 跳过冒号后空白
        if (i >= raw.length)
            return ''; // 冒号已到，等待起始引号
        if (raw[i] !== '"')
            continue; // 值非字符串，尝试下一个字段名
        i++; // 进入字符串内部
        let out = '';
        while (i < raw.length) {
            const ch = raw[i];
            if (ch === '\\') {
                if (i + 1 >= raw.length)
                    break; // 转义符尚未到达，停下等下批
                const next = raw[i + 1];
                if (next === 'u') {
                    if (i + 5 >= raw.length)
                        break; // \uXXXX 尚未完整到达
                    out += String.fromCharCode(parseInt(raw.slice(i + 2, i + 6), 16));
                    i += 6;
                    continue;
                }
                out += SIMPLE_ESCAPES[next] ?? next;
                i += 2;
                continue;
            }
            if (ch === '"')
                break; // 闭合引号 → 停止
            out += ch;
            i++;
        }
        return out;
    }
    return null;
}
async function runLLM({ prompt, model, stream, onChunk, bypassRouter }) {
    const start = Date.now();
    const messages = prompt.system ? [{ role: 'system', content: prompt.system }, ...prompt.messages] : prompt.messages;
    // 包装 onChunk：Agent chat 模式下模型输出的是 JSON 对象（如 {"action_type":"answer","content":"…"}），
    // 直接把原始 chunk 下发会让终端实时打印 JSON 语法（花括号、字段名、转义符）。这里先累积原始流，
    // 增量提取 content 正文后再下发，用户看到的就是回答正文逐字流出。非 JSON（不以 { 或 ``` 开头）
    // 的流式输出按纯文本直通，兼容不走 JSON 协议的 adapter。两条下游路径（路由 / 直连）共用此包装。
    let streamRaw = '';
    let streamEmitted = 0;
    const wrappedOnChunk = stream
        ? (chunk) => {
            streamRaw += chunk;
            const head = streamRaw.trimStart();
            if (!head.startsWith('{') && !head.startsWith('```')) {
                onChunk?.(chunk, 'thought');
                return;
            }
            const content = extractStreamableContent(streamRaw);
            if (content === null)
                return; // 尚未定位到正文字段，保持等待态
            if (content.length > streamEmitted) {
                onChunk?.(content.slice(streamEmitted), 'thought');
                streamEmitted = content.length;
            }
        }
        : undefined;
    // --- ModelRouter Integration ---
    if (!bypassRouter && (0, modelRouterIntegration_1.shouldUseRouter)(messages, 'command')) {
        try {
            const routerResult = await (0, modelRouterIntegration_1.callLLMWithRouter)(messages, 'command', {
                onChunk: wrappedOnChunk,
                enableFallback: true // Let the router handle its own fallbacks too
            });
            if (routerResult.usedRouter && !routerResult.error) {
                console.log(chalk_1.default.blue(`📡 [Router] 任务路由成功 -> `) + chalk_1.default.bold.green(routerResult.modelName));
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
        }
        catch (error) {
            console.warn(`[ModelRouter] Unexpected error: ${error.message}, falling back...`);
        }
    }
    // --- End ModelRouter Integration ---
    if (stream) {
        // 路由失败回退到此处时，重置累积状态，避免把两段输出拼在一起污染提取
        streamRaw = '';
        streamEmitted = 0;
        await (0, client_1.callAI_Stream)(messages, model, wrappedOnChunk);
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
    let responseData = {
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
        const response = await axios_1.default.post(url, responseData, { headers });
        // Safely extract content from response
        let rawText = '';
        if (response.data && typeof response.data === 'object') {
            if (response.data.choices && Array.isArray(response.data.choices) && response.data.choices.length > 0) {
                rawText = response.data.choices[0]?.message?.content || '';
            }
            else {
                // Handle cases where response format is different
                rawText = response.data.content || response.data.text || JSON.stringify(response.data);
            }
        }
        else {
            rawText = String(response.data || '');
        }
        let parsed = undefined;
        if (prompt.outputSchema) {
            const parseResult = (0, validation_1.safeParseJSON)(rawText, prompt.outputSchema, {});
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
        const retryResult = await (0, errorHandling_1.withRetry)(executeCall, {
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
        throw new AIError(retryError?.message || 'AI 请求重试失败', retryError?.statusCode || 0, retryError);
    }
    catch (error) {
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
                }
                else if (typeof responseData.message === 'string') {
                    errorMsg = responseData.message;
                }
            }
            else if (error && typeof error.message === 'string') {
                errorMsg = error.message;
            }
            else if (typeof error === 'string') {
                errorMsg = error;
            }
            else {
                errorMsg = String(error);
            }
        }
        catch (e) {
            errorMsg = '未知错误（无法解析错误信息）';
        }
        const finalError = new AIError(`AI 请求失败 (Status: ${statusCode}): ${errorMsg}`, statusCode, error);
        throw finalError;
    }
}
//# sourceMappingURL=llm.js.map