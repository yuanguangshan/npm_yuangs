const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Store conversation history
// 存储结构标准为: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
let conversationHistory = [];

const HISTORY_FILE = path.join(os.homedir(), '.yuangs_cmd_history.json');
const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');
const MACROS_FILE = path.join(os.homedir(), '.yuangs_macros.json');

function getUserConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) {}
    }
    return {};
}

function getCommandHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {}
    }
    return [];
}

function saveSuccessfulCommand(question, command) {
    if (!command) return;
    let history = getCommandHistory();
    const newEntry = { question, command, time: new Date().toLocaleString() };
    history = [newEntry, ...history.filter(item => item.command !== command)].slice(0, 5);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function getMacros() {
    if (fs.existsSync(MACROS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(MACROS_FILE, 'utf8'));
        } catch (e) {}
    }
    return {};
}

function saveMacro(name, commands, description = '') {
    const macros = getMacros();
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}

function deleteMacro(name) {
    const macros = getMacros();
    if (macros[name]) {
        delete macros[name];
        fs.writeFileSync(MACROS_FILE, JSON.stringify(macros, null, 2));
        return true;
    }
    return false;
}

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
 * 通用 AI 调用函数 (OpenAI 兼容接口)
 */
async function callAI_Stream(messages, model, onChunk) {
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
        response.data.on('data', chunk => {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            // 数组的最后一个元素可能是不完整的行，留到下一次处理
            buffer = lines.pop(); 

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
                    } catch (e) {
                        // 如果这一行真的有问题，忽略它
                    }
                }
            }
        });
        response.data.on('error', reject);
        response.data.on('end', () => {
             // 处理缓冲区中剩余的内容（如果有）
            if (buffer.trim().startsWith('data: ')) {
                 try {
                    const data = buffer.trim().slice(6);
                    if (data !== '[DONE]') {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) onChunk(content);
                    }
                } catch (e) {}
            }
            resolve();
        });
    });
}

async function callAI_OpenAI(messages, model) {
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
        messages: messages,
        stream: false
    };

    return await axios.post(url, data, { headers });
}

/**
 * 获取 AI 回复
 */
async function getAIAnswer(question, model, includeHistory = true) {
    // 构建 messages 数组 (上下文 + 当前问题)
    let messages = [];
    if (includeHistory) {
        messages = [...conversationHistory];
    }
    messages.push({ role: 'user', content: question });

    try {
        const response = await callAI_OpenAI(messages, model);
        const aiContent = response.data?.choices?.[0]?.message?.content;

        if (!aiContent) {
            throw new Error('Invalid response structure from AI API');
        }

        // 只有请求成功才记录历史
        addToConversationHistory('user', question);
        addToConversationHistory('assistant', aiContent);

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

async function generateCommand(instruction, model) {
    const config = getUserConfig();
    const messages = [
        {
            role: 'system',
            content: `You are a Linux command generator. Convert the user's natural language request into a single, executable Linux command. 
            IMPORTANT: Output ONLY the command. Do not check for safety. Do not output markdown code blocks (no backticks). Do not explain.`
        },
        {
            role: 'user',
            content: `Request: ${instruction}`
        }
    ];

    try {
        const response = await callAI_OpenAI(messages, model || config.defaultModel);
        const aiContent = response.data?.choices?.[0]?.message?.content;

        if (aiContent) {
            let command = aiContent.trim();
            if (command.startsWith('`') && command.endsWith('`')) {
                command = command.slice(1, -1);
            }
            if (command.startsWith('```') && command.endsWith('```')) {
                command = command.split('\n').filter(line => !line.startsWith('```')).join('\n').trim();
            }
            if (command.startsWith('$ ')) command = command.slice(2);
            if (command.startsWith('> ')) command = command.slice(2);

            return command;
        }
        return null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    urls: APPS,
    openApp: (appKey) => {
        const url = APPS[appKey];
        if (url) {
            openUrl(url);
            return true;
        }
        console.error(`App '${appKey}' not found`);
        return false;
    },
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
    getConversationHistory,
    generateCommand,
    getUserConfig,
    getCommandHistory,
    saveSuccessfulCommand,
    callAI_Stream,
    getMacros,
    saveMacro,
    deleteMacro
};
