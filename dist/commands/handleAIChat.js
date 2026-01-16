"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAIChat = handleAIChat;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const readline_1 = __importDefault(require("readline"));
const client_1 = require("../ai/client");
const marked = __importStar(require("marked"));
const marked_terminal_1 = __importDefault(require("marked-terminal"));
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
                const message = err instanceof Error ? err.message : String(err);
                console.error(chalk_1.default.red(`\n[AI execution error]: ${message}`));
            }
            finally {
                // Always resume input
                rl.resume();
            }
        }
    }
    catch (criticalErr) {
        const message = criticalErr instanceof Error ? criticalErr.message : String(criticalErr);
        console.error(chalk_1.default.red(`\n[Critical Loop Error]: ${message}`));
    }
    finally {
        rl.close();
    }
}
// 配置 marked 使用 TerminalRenderer
marked.setOptions({
    renderer: new marked_terminal_1.default({
        // 自定义终端渲染选项
        tab: 2,
        width: process.stdout.columns || 80,
        showSectionPrefix: false,
    })
});
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
                // 在第一次输出前添加标签
                process.stdout.write(chalk_1.default.bold.blue('🤖 AI：'));
            }
            fullResponse += chunk;
            // 由于流式输出的限制，我们不能完美地渲染 Markdown（因为 Markdown 需要完整的上下文）
            // 所以我们先输出原始内容，然后在最后重新渲染格式化的内容
            // 但为了避免覆盖用户输入，我们只在内部缓存
        });
        // 在完整响应接收完成后，渲染整个响应以应用 Markdown 格式
        process.stdout.write(chalk_1.default.bold.blue('🤖 AI：'));
        const formattedResponse = marked.parse(fullResponse, { async: false });
        process.stdout.write(formattedResponse);
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