"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentActionSchema = void 0;
exports.supportsStructuredOutput = supportsStructuredOutput;
exports.runLLM = runLLM;
const client_1 = require("../ai/client");
const axios_1 = __importDefault(require("axios"));
const validation_1 = require("../core/validation");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const validation_2 = require("../core/validation");
const zod_1 = require("zod");
const modelRouterIntegration_1 = require("./modelRouterIntegration");
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
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
    if (fs_1.default.existsSync(CONFIG_FILE)) {
        try {
            const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content);
        }
        catch (e) { }
    }
    return {};
}
async function runLLM({ prompt, model, stream, onChunk, }) {
    const start = Date.now();
    const messages = prompt.system ? [{ role: 'system', content: prompt.system }, ...prompt.messages] : prompt.messages;
    // --- ModelRouter Integration ---
    if ((0, modelRouterIntegration_1.shouldUseRouter)(messages, 'command')) {
        try {
            const routerResult = await (0, modelRouterIntegration_1.callLLMWithRouter)(messages, 'command', {
                onChunk: onChunk,
                enableFallback: true // Let the router handle its own fallbacks too
            });
            if (routerResult.usedRouter && !routerResult.error) {
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
        let raw = '';
        const messages = prompt.system ? [{ role: 'system', content: prompt.system }, ...prompt.messages] : prompt.messages;
        // Track current block type for streaming
        let currentBlockType = 'none';
        let buffer = '';
        await (0, client_1.callAI_Stream)(messages, model, (chunk) => {
            raw += chunk;
            onChunk?.(chunk, 'thought');
        });
        return {
            rawText: raw,
            latencyMs: Date.now() - start,
            modelName: model,
            usedRouter: false
        };
    }
    // Non-streaming mode with optional schema
    const config = getUserConfig();
    const url = config.aiProxyUrl || validation_1.DEFAULT_AI_PROXY_URL;
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || validation_1.DEFAULT_ACCOUNT_TYPE,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };
    // Native Structured Output: Check if model supports it and we're in Agent mode
    const modelUsed = model || config.defaultModel || validation_1.DEFAULT_MODEL;
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
    try {
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
            const parseResult = (0, validation_2.safeParseJSON)(rawText, prompt.outputSchema, {});
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
    }
    catch (error) {
        // Safely extract error message without accessing circular references
        let errorMsg = '未知错误';
        // Only access the basic message property to avoid circular reference issues
        try {
            if (error && typeof error.message === 'string') {
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
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}
//# sourceMappingURL=llm.js.map