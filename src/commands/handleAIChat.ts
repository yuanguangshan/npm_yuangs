import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'node:readline/promises';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';



export async function handleAIChat(question: string | null, model?: string) {
    if (question) {
        // First answer the provided question
        await askOnceStream(question, model);

        // If not a TTY, we stop here (likely piped input)
        if (!process.stdin.isTTY) {
            return;
        }
    }

    // Interactive mode
    console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        while (true) {
            const q = await rl.question(chalk.green('你：'));
            const trimmed = q.trim();

            if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log(chalk.cyan('👋 再见！'));
                break;
            }
            if (trimmed === '/clear') {
                clearConversationHistory();
                console.log(chalk.yellow('✓ 对话历史已清空\n'));
                continue;
            }
            if (trimmed === '/history') {
                const history = getConversationHistory();
                if (history.length === 0) {
                    console.log(chalk.gray('暂无对话历史\n'));
                } else {
                    history.forEach((msg) => {
                        const prefix = msg.role === 'user' ? chalk.green('你: ') : chalk.blue('AI: ');
                        console.log(prefix + msg.content);
                    });
                }
                continue;
            }
            if (!trimmed) continue;

            await askOnceStream(trimmed, model);
        }
    } finally {
        rl.close();
    }
}

async function askOnceStream(question: string, model?: string) {
    const startTime = Date.now();
    const messages = [...getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    let fullResponse = '';

    try {
        await callAI_Stream(messages, model, (chunk) => {
            if (spinner.isSpinning) {
                spinner.stop();
                process.stdout.write(chalk.bold.blue('🤖 AI：'));
            }
            fullResponse += chunk;
            process.stdout.write(chunk);
        });

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);

        const elapsed = (Date.now() - startTime) / 1000;
        console.log('\n' + chalk.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n'));
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.fail(chalk.red('AI 响应出错'));
        } else {
            console.log(chalk.red('\n[AI Error]: ' + error.message));
        }
    }
}
