const { exec } = require('child_process');
const axios = require('axios');

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

async function getAIAnswer(question, model) {
    const url = 'https://aiproxy.want.biz/ai/explain';
    const prompt = question;

    const headers = {
        'Referer': 'https://wealth.want.biz/',
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
        return response.data;
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
    getAIAnswer
};
