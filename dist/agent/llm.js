"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLLM = runLLM;
const client_1 = require("../ai/client");
const axios_1 = __importDefault(require("axios"));
const validation_1 = require("../core/validation");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const validation_2 = require("../core/validation");
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
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
    if (stream) {
        let raw = '';
        await (0, client_1.callAI_Stream)(prompt.messages, model, (chunk) => {
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
    const data = {
        model: model || config.defaultModel || validation_1.DEFAULT_MODEL,
        messages: prompt.messages,
        stream: false
    };
    try {
        const response = await axios_1.default.post(url, data, { headers });
        const rawText = response.data.choices[0]?.message?.content || '';
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
        };
    }
    catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}
//# sourceMappingURL=llm.js.map