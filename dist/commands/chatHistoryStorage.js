"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadChatHistory = loadChatHistory;
exports.saveChatHistory = saveChatHistory;
exports.clearChatHistory = clearChatHistory;
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CHAT_HISTORY_DIR = path_1.default.resolve(os_1.default.homedir(), '.yuangs_chat_history');
const CHAT_HISTORY_FILE = path_1.default.join(CHAT_HISTORY_DIR, 'chat_history.json');
const readFileAsync = (0, util_1.promisify)(fs_1.default.readFile);
const writeFileAsync = (0, util_1.promisify)(fs_1.default.writeFile);
const mkdirAsync = (0, util_1.promisify)(fs_1.default.mkdir);
const rmAsync = (0, util_1.promisify)(fs_1.default.rm);
async function loadChatHistory() {
    if (fs_1.default.existsSync(CHAT_HISTORY_FILE)) {
        try {
            const raw = await readFileAsync(CHAT_HISTORY_FILE, 'utf-8');
            const data = JSON.parse(raw);
            // 验证数据结构
            if (Array.isArray(data) && data.every(msg => typeof msg === 'object' &&
                ['user', 'assistant', 'system'].includes(msg.role) &&
                typeof msg.content === 'string')) {
                return data;
            }
        }
        catch (e) {
            console.warn('警告: 加载聊天历史记录失败，使用空历史记录');
        }
    }
    return [];
}
async function saveChatHistory(history) {
    try {
        await mkdirAsync(CHAT_HISTORY_DIR, { recursive: true });
        await writeFileAsync(CHAT_HISTORY_FILE, JSON.stringify(history, null, 2));
    }
    catch (e) {
        console.error('错误: 保存聊天历史记录失败:', e);
    }
}
async function clearChatHistory() {
    try {
        await rmAsync(CHAT_HISTORY_FILE, { force: true });
    }
    catch (e) {
        console.error('错误: 清除聊天历史记录失败:', e);
    }
}
//# sourceMappingURL=chatHistoryStorage.js.map