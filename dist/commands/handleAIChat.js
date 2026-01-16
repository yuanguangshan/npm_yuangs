"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAIChat = handleAIChat;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const readline_1 = __importDefault(require("readline"));
const client_1 = require("../ai/client");
async function handleAIChat(initialQuestion, model) {
    if (initialQuestion) {
        await askOnceStream(initialQuestion, model);
        if (!process.stdin.isTTY)
            return;
    }
    console.log(chalk_1.default.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });
    // Helper to wrap rl.question in a Promise
    const ask = (query) => {
        return new Promise((resolve) => {
            rl.question(query, (answer) => {
                resolve(answer);
            });
        });
    };
    try {
        while (true) {
            const input = await ask(chalk_1.default.green('你：'));
            const trimmed = input.trim();
            // Handle Exit
            if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log(chalk_1.default.cyan('👋 再见！'));
                break;
            }
            // Handle Commands
            if (trimmed === '/clear') {
                (0, client_1.clearConversationHistory)();
                console.log(chalk_1.default.yellow('✓ 对话历史已清空\n'));
                continue;
            }
            if (trimmed === '/history') {
                const history = (0, client_1.getConversationHistory)();
                if (history.length === 0) {
                    console.log(chalk_1.default.gray('暂无对话历史\n'));
                }
                else {
                    history.forEach((msg) => {
                        const prefix = msg.role === 'user' ? chalk_1.default.green('你: ') : chalk_1.default.blue('AI: ');
                        console.log(prefix + msg.content);
                    });
                }
                continue;
            }
            if (!trimmed)
                continue;
            // Handle AI Request
            try {
                // Pause input while AI is processing to avoid interference
                rl.pause();
                await askOnceStream(trimmed, model);
            }
            catch (err) {
                console.error(chalk_1.default.red(`\n[AI execution error]: ${err.message}`));
            }
            finally {
                // Always resume input
                rl.resume();
            }
        }
    }
    catch (criticalErr) {
        console.error(chalk_1.default.red(`\n[Critical Loop Error]: ${criticalErr.message}`));
    }
    finally {
        rl.close();
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
            if (spinner.isSpinning) {
                spinner.stop();
                process.stdout.write(chalk_1.default.bold.blue('🤖 AI：'));
            }
            fullResponse += chunk;
            process.stdout.write(chunk);
        });
        (0, client_1.addToConversationHistory)('user', question);
        (0, client_1.addToConversationHistory)('assistant', fullResponse);
        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\n' + chalk_1.default.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));
    }
    catch (error) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        // Re-throw to be caught by the loop
        throw error;
    }
}
//# sourceMappingURL=handleAIChat.js.map