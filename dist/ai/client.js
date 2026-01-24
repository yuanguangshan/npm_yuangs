"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToConversationHistory = addToConversationHistory;
exports.clearConversationHistory = clearConversationHistory;
exports.getConversationHistory = getConversationHistory;
exports.getUserConfig = getUserConfig;
exports.askAI = askAI;
exports.callAI_Stream = callAI_Stream;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const validation_1 = require("../core/validation");
const db_1 = require("../core/db");
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
let conversationHistory = (0, db_1.getRecentMessagesFromDB)(20);
function addToConversationHistory(role, content) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
    // Deep persist
    (0, db_1.appendMessageToDB)(role, content);
}
function clearConversationHistory() {
    conversationHistory = [];
    (0, db_1.clearMessagesInDB)();
}
function getConversationHistory() {
    return conversationHistory;
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
async function askAI(prompt, model) {
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
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };
    try {
        const response = await axios_1.default.post(url, data, { headers });
        const content = response.data?.choices?.[0]?.message?.content;
        return content || '';
    }
    catch (error) {
        // Safely extract error message without accessing circular references
        let errorMsg = '未知错误';
        if (typeof error.message === 'string') {
            errorMsg = error.message;
        }
        else if (typeof error === 'string') {
            errorMsg = error;
        }
        // Try to get response data error message (safely)
        if (error.response && typeof error.response.data === 'object') {
            const responseData = error.response.data;
            if (typeof responseData.error?.message === 'string') {
                errorMsg = responseData.error.message;
            }
            else if (typeof responseData.message === 'string') {
                errorMsg = responseData.message;
            }
        }
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}
async function callAI_Stream(messages, model, onChunk) {
    const config = getUserConfig();
    const url = config.aiProxyUrl || validation_1.DEFAULT_AI_PROXY_URL;
    const response = await (0, axios_1.default)({
        method: 'post',
        url: url,
        data: {
            model: model || config.defaultModel || validation_1.DEFAULT_MODEL,
            messages: messages,
            stream: true
        },
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'npm_yuangs',
            'Origin': 'https://cli.want.biz',
            'Referer': 'https://cli.want.biz/',
            'account': config.accountType || validation_1.DEFAULT_ACCOUNT_TYPE,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json'
        }
    });
    return new Promise((resolve, reject) => {
        let buffer = '';
        response.data.on('data', (chunk) => {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') {
                        resolve();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content)
                            onChunk(content);
                    }
                    catch (e) { }
                }
            }
        });
        response.data.on('error', reject);
        response.data.on('end', () => {
            resolve();
        });
    });
}
//# sourceMappingURL=client.js.map