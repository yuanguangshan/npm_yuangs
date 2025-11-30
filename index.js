const { exec } = require('child_process');
const axios = require('axios');

// Store conversation history
let conversationHistory = [];

const APPS = {
    shici: 'https://wealth.want.biz/shici/index.html',
    dict: 'https://wealth.want.biz/pages/dict.html',
    pong: 'https://wealth.want.biz/pages/pong.html'
};

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
    openShici: () => openUrl(APPS.shici),
    openDict: () => openUrl(APPS.dict),
    openPong: () => openUrl(APPS.pong),
    listApps: () => {
        console.log('--- YGS Apps ---');
        Object.entries(APPS).forEach(([key, url]) => console.log(`${key}: ${url}`));
    },
    getAIAnswer,
    addToConversationHistory,
    clearConversationHistory,
    getConversationHistory
};
