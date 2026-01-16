import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

let conversationHistory: { role: string; content: string }[] = [];

export function addToConversationHistory(role: string, content: string) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
}

export function clearConversationHistory() {
    conversationHistory = [];
}

export function getConversationHistory() {
    return conversationHistory;
}

export function getUserConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) { }
    }
    return {};
}

export async function askAI(prompt: string, model?: string): Promise<string> {
    const config = getUserConfig();
    const url = config.aiProxyUrl || 'https://aiproxy.want.biz/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || 'free',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    const data = {
        model: model || config.defaultModel || 'Assistant',
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };

    try {
        const response = await axios.post(url, data, { headers });
        const content = response.data?.choices?.[0]?.message?.content;
        return content || '';
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}

export async function callAI_Stream(messages: any[], model: string | undefined, onChunk: (content: string) => void): Promise<void> {
    const config = getUserConfig();
    const url = config.aiProxyUrl || 'https://aiproxy.want.biz/v1/chat/completions';

    const response = await axios({
        method: 'post',
        url: url,
        data: {
            model: model || config.defaultModel || 'Assistant',
            messages: messages,
            stream: true
        },
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'npm_yuangs',
            'Origin': 'https://cli.want.biz',
            'Referer': 'https://cli.want.biz/',
            'account': config.accountType || 'free',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json'
        }
    });

    return new Promise((resolve, reject) => {
        let buffer = '';
        response.data.on('data', (chunk: Buffer) => {
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
                        if (content) onChunk(content);
                    } catch (e) { }
                }
            }
        });
        response.data.on('error', reject);
        response.data.on('end', () => {
            resolve();
        });
    });
}
