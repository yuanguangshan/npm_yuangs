"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAIChat = handleAIChat;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const marked_1 = require("marked");
const marked_terminal_1 = __importDefault(require("marked-terminal"));
const readline_1 = __importDefault(require("readline"));
const client_1 = require("../ai/client");
// Configure marked
marked_1.marked.setOptions({
    renderer: new marked_terminal_1.default({
        code: chalk_1.default.yellow,
        heading: chalk_1.default.magenta.bold,
        firstHeading: chalk_1.default.magenta.underline.bold,
        listitem: chalk_1.default.cyan,
        table: chalk_1.default.white,
        strong: chalk_1.default.bold.red,
        em: chalk_1.default.italic
    }) // marked-terminal has no official TS types, safe cast as per review
});
async function handleAIChat(question, model) {
    if (!question) {
        // Interactive mode
        console.log(chalk_1.default.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const askLoop = () => {
            rl.question(chalk_1.default.green('你：'), async (q) => {
                const trimmed = q.trim();
                if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                    console.log(chalk_1.default.cyan('👋 再见！'));
                    rl.close();
                    return;
                }
                if (trimmed === '/clear') {
                    (0, client_1.clearConversationHistory)();
                    console.log(chalk_1.default.yellow('✓ 对话历史已清空\n'));
                    return askLoop();
                }
                if (trimmed === '/history') {
                    const history = (0, client_1.getConversationHistory)();
                    history.forEach((msg) => {
                        const prefix = msg.role === 'user' ? chalk_1.default.green('你: ') : chalk_1.default.blue('AI: ');
                        console.log(prefix + msg.content);
                    });
                    return askLoop();
                }
                if (!trimmed)
                    return askLoop();
                await askOnceStream(trimmed, model);
                askLoop();
            });
        };
        askLoop();
    }
    else {
        await askOnceStream(question, model);
    }
}
async function askOnceStream(question, model) {
    const startTime = Date.now();
    const messages = [...(0, client_1.getConversationHistory)()];
    messages.push({ role: 'user', content: question });
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
    let fullResponse = '';
    try {
        await (0, client_1.callAI_Stream)(messages, model, (chunk) => {
            if (spinner.isSpinning)
                spinner.stop();
            fullResponse += chunk;
            process.stdout.write(chunk);
        });
        (0, client_1.addToConversationHistory)('user', question);
        (0, client_1.addToConversationHistory)('assistant', fullResponse);
        console.log('\n' + chalk_1.default.gray('─'.repeat(80)));
        console.log((0, marked_1.marked)(fullResponse));
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(chalk_1.default.gray(`\n请求耗时: ${elapsed.toFixed(2)}s\n`));
    }
    catch (error) {
        if (spinner.isSpinning)
            spinner.fail(chalk_1.default.red('AI 响应出错'));
        console.error(error.message);
    }
}
//# sourceMappingURL=handleAIChat.js.map