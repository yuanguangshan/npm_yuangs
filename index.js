const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Store conversation history
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

async function getAIAnswer(question, model, includeHistory = true) {
    const url = 'https://aiproxy.want.biz/ai/explain';

    // Prepare the prompt with conversation history if enabled
    let prompt;
    if (includeHistory) {
        prompt = JSON.stringify({
            history: conversationHistory,
            query: question
        }, null, 2);
    } else {
        // If not including history, still use JSON format for consistency but with empty history
        prompt = JSON.stringify({
            history: [],
            query: question
        }, null, 2);
    }

    const headers = {
        'Referer': 'https://cli.want.biz/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const data = {
        text: prompt,
        model: model || "gemini-flash-lite-latest"
    };

    try {
        const response = await axios.post(url, data, { headers });
        const answer = response.data;

        // Add the user's question to the conversation history
        addToConversationHistory('user', question);

        // Add the AI response to the conversation history
        if (answer && answer.explanation) {
            addToConversationHistory('assistant', answer.explanation);
        }

        return answer;
    } catch (error) {
        console.error('AI 请求失败:', error.response?.data?.message || error.message || '未知错误');
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
