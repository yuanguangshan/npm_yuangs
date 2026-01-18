import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { AIRequestMessage } from '../core/validation';

const CHAT_HISTORY_DIR = path.resolve(os.homedir(), '.yuangs_chat_history');
const CHAT_HISTORY_FILE = path.join(CHAT_HISTORY_DIR, 'chat_history.json');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const rmAsync = promisify(fs.rm);

export async function loadChatHistory(): Promise<AIRequestMessage[]> {
    if (fs.existsSync(CHAT_HISTORY_FILE)) {
        try {
            const raw = await readFileAsync(CHAT_HISTORY_FILE, 'utf-8');
            const data = JSON.parse(raw);

            // 验证数据结构
            if (Array.isArray(data) && data.every(msg =>
                typeof msg === 'object' &&
                ['user', 'assistant', 'system'].includes(msg.role) &&
                typeof msg.content === 'string'
            )) {
                return data as AIRequestMessage[];
            }
        } catch (e) {
            console.warn('警告: 加载聊天历史记录失败，使用空历史记录');
        }
    }
    return [];
}

export async function saveChatHistory(history: AIRequestMessage[]) {
    try {
        await mkdirAsync(CHAT_HISTORY_DIR, { recursive: true });
        await writeFileAsync(CHAT_HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error('错误: 保存聊天历史记录失败:', e);
    }
}

export async function clearChatHistory() {
    try {
        await rmAsync(CHAT_HISTORY_FILE, { force: true });
    } catch (e) {
        console.error('错误: 清除聊天历史记录失败:', e);
    }
}
