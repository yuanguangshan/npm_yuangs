const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Store conversation history
// 存储结构标准为: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
let conversationHistory = [];

// Default apps (fallback if no config file exists)
const DEFAULT_APPS = {
    shici: 'https://wealth.want.biz/shici/index.html',
    dict: 'https://wealth.want.biz/pages/dict.html',
    pong: 'https://wealth.want.biz/pages/pong.html'
};

// Load apps from configuration file
function loadAppsConfig() {
    // Define possible config file locations (JSON and YAML)
    const configPaths = [
        path.join(process.cwd(), 'yuangs.config.json'),           // Current working directory
        path.join(process.cwd(), '.yuangs.json'),                // Current working directory dot file
        path.join(process.cwd(), 'yuangs.config.yaml'),          // Current working directory YAML
        path.join(process.cwd(), 'yuangs.config.yml'),           // Current working directory YAML
        path.join(process.cwd(), '.yuangs.yaml'),                // Current working directory dot YAML
        path.join(process.cwd(), '.yuangs.yml'),                 // Current working directory dot YAML
        path.join(require('os').homedir(), '.yuangs.json'),      // User home directory
        path.join(require('os').homedir(), '.yuangs.yaml'),      // User home directory YAML
        path.join(require('os').homedir(), '.yuangs.yml'),       // User home directory YAML
        path.join(__dirname, 'yuangs.config.json'),              // Project directory
        path.join(__dirname, '.yuangs.json'),                     // Project directory dot file
        path.join(__dirname, 'yuangs.config.yaml'),              // Project directory YAML
        path.join(__dirname, 'yuangs.config.yml')                // Project directory YAML
    ];

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');

                // Determine if it's JSON or YAML based on file extension
                let config;
                if (configPath.endsWith('.json')) {
                    config = JSON.parse(configContent);
                } else {
                    // For YAML files, we need to require the yaml parser
                    let yaml;
                    try {
                        yaml = require('js-yaml');
                    } catch (yamlError) {
                        console.warn(`Warning: js-yaml not installed, skipping YAML file ${configPath}`);
                        console.warn('Install js-yaml with: npm install js-yaml');
                        continue; // Skip this file and try the next config file
                    }
                    config = yaml.load(configContent);
                }

                // If config has an 'apps' property, use it, otherwise use the whole config as apps
                return config.apps || config;
            } catch (error) {
                console.warn(`Warning: Could not parse config file at ${configPath}:`, error.message);
                // Continue to next config file
            }
        }
    }

    // If no config file is found, use default apps
    return DEFAULT_APPS;
}

const APPS = loadAppsConfig();

function openUrl(url) {
    let command;
    switch (process.platform) {
        case 'darwin': command = `open "${url}"`; break;
        case 'win32': command = `start "${url}"`; break;
        default: command = `xdg-open "${url}"`; break;
    }
    exec(command);
}

// Function to add a message to the conversation history
function addToConversationHistory(role, content) {
    conversationHistory.push({ role, content });

    // Keep only the last 20 messages to prevent history from growing too large
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
}

// Function to clear conversation history
function clearConversationHistory() {
    conversationHistory = [];
}

// Function to get conversation history
function getConversationHistory() {
    return conversationHistory;
}

/**
 * 获取 AI 回复 (OpenAI 兼容接口版)
 */
async function getAIAnswer(question, model, includeHistory = true) {
    // 1. 修改接口地址为 OpenAI 标准兼容路径
    const url = 'https://aiproxy.want.biz/v1/chat/completions';

    // 2. 准备 Headers (包含客户端标识)
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs', // 客户端 标识
        'Origin': 'https://cli.want.biz', // 配合后端白名单
        'Referer': 'https://cli.want.biz/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    // 3. 构建 messages 数组 (上下文 + 当前问题)
    let messages = [];
    if (includeHistory) {
        // history 已经是 [{role, content}, ...] 格式，直接展开
        messages = [...conversationHistory];
    }
    
    // 添加当前用户提问
    messages.push({ role: 'user', content: question });

    // 4. 构建 OpenAI 标准请求体
    const data = {
        model: model || "gemini-flash-lite-latest",
        messages: messages,
        stream: false
    };

    try {
        // 发送请求
        const response = await axios.post(url, data, { headers });
        
        // 5. 解析 OpenAI 格式响应 (choices[0].message.content)
        const aiContent = response.data?.choices?.[0]?.message?.content;

        if (!aiContent) {
            throw new Error('Invalid response structure from AI API');
        }

        // 6. 更新历史记录
        // 只有请求成功才记录
        addToConversationHistory('user', question);
        addToConversationHistory('assistant', aiContent);

        // 返回结果
        // 为了兼容旧代码可能使用的 .explanation 属性，这里做一层包装
        return {
            explanation: aiContent, // 兼容字段
            content: aiContent,     // 标准字段建议
            raw: response.data      // 原始响应
        };

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        console.error('AI 请求失败:', errorMsg);
        return null;
    }
}

module.exports = {
    urls: APPS,
    // Dynamic function to open any app by key
    openApp: (appKey) => {
        const url = APPS[appKey];
        if (url) {
            openUrl(url);
            return true;
        }
        console.error(`App '${appKey}' not found`);
        return false;
    },
    // Specific functions for default apps (for backward compatibility)
    openShici: () => openUrl(APPS.shici || DEFAULT_APPS.shici),
    openDict: () => openUrl(APPS.dict || DEFAULT_APPS.dict),
    openPong: () => openUrl(APPS.pong || DEFAULT_APPS.pong),
    listApps: () => {
        console.log('--- YGS Apps ---');
        Object.entries(APPS).forEach(([key, url]) => console.log(`${key}: ${url}`));
    },
    getAIAnswer,
    addToConversationHistory,
    clearConversationHistory,
    getConversationHistory
};