import axios from 'axios';
import { type AIRequestMessage, type UserConfig } from '../core/validation';
import { getConfigService } from '../core/ConfigService';
import { appendMessageToDB, getRecentMessagesFromDB, clearMessagesInDB } from '../core/db';

export function getUserConfig(): UserConfig {
    const svc = getConfigService();
    return {
        aiProxyUrl: svc.getAiProxyUrl(),
        defaultModel: svc.getDefaultModel(),
        accountType: svc.getAccountType(),
    };
}

let conversationHistory: AIRequestMessage[] = getRecentMessagesFromDB(20);

export function addToConversationHistory(role: 'system' | 'user' | 'assistant', content: string) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
    appendMessageToDB(role, content);
}

export function clearConversationHistory() {
    conversationHistory = [];
    clearMessagesInDB();
}

export function getConversationHistory() {
    return conversationHistory;
}

export async function askAI(prompt: string, model?: string): Promise<string> {
    const config = getUserConfig();
    const url = config.aiProxyUrl!;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    const data = {
        model: model || config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };

    try {
        const response = await axios.post(url, data, { headers });
        const content = response.data?.choices?.[0]?.message?.content;
        return content || '';
    } catch (error: any) {
        // Safely extract error message without accessing circular references
        let errorMsg = '未知错误';
        
        if (typeof error.message === 'string') {
            errorMsg = error.message;
        } else if (typeof error === 'string') {
            errorMsg = error;
        }
        
        // Try to get response data error message (safely)
        if (error.response && typeof error.response.data === 'object') {
            const responseData = error.response.data;
            if (typeof responseData.error?.message === 'string') {
                errorMsg = responseData.error.message;
            } else if (typeof responseData.message === 'string') {
                errorMsg = responseData.message;
            }
        }
        
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}

export async function callAI_Stream(messages: AIRequestMessage[], model: string | undefined, onChunk: (content: string) => void): Promise<void> {
    const config = getUserConfig();
    const url = config.aiProxyUrl!;

    const response = await axios({
        method: 'post',
        url: url,
        data: {
            model: model || config.defaultModel,
            messages: messages,
            stream: true
        },
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'npm_yuangs',
            'Origin': 'https://cli.want.biz',
            'Referer': 'https://cli.want.biz/',
            'account': config.accountType,
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
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            onChunk(content);
                        }
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
