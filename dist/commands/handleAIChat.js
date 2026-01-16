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
const readline = __importStar(require("node:readline/promises"));
const client_1 = require("../ai/client");
async function handleAIChat(question, model) {
    if (question) {
        // First answer the provided question
        await askOnceStream(question, model);
        // If not a TTY, we stop here (likely piped input)
        if (!process.stdin.isTTY) {
            return;
        }
    }
    // Interactive mode
    console.log(chalk_1.default.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        while (true) {
            const q = await rl.question(chalk_1.default.green('你：'));
            const trimmed = q.trim();
            if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log(chalk_1.default.cyan('👋 再见！'));
                break;
            }
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
            await askOnceStream(trimmed, model);
        }
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
        console.log('\n' + chalk_1.default.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n'));
    }
    catch (error) {
        if (spinner.isSpinning) {
            spinner.fail(chalk_1.default.red('AI 响应出错'));
        }
        else {
            console.log(chalk_1.default.red('\n[AI Error]: ' + error.message));
        }
    }
}
//# sourceMappingURL=handleAIChat.js.map