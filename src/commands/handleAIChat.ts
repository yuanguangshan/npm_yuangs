import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';
import * as marked from 'marked';
import TerminalRenderer from 'marked-terminal';

export async function handleAIChat(initialQuestion: string | null, model?: string) {
    if (initialQuestion) {
        await askOnceStream(initialQuestion, model);
        if (!process.stdin.isTTY) return;
    }

    console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    // Helper to wrap rl.question in a Promise
    const ask = (query: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(query, (answer) => {
                resolve(answer);
            });
        });
    };

    try {
        while (true) {
            const input = await ask(chalk.green('你：'));
            const trimmed = input.trim();

            // Handle Exit
            if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log(chalk.cyan('👋 再见！'));
                break;
            }

            // Handle Commands
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

            // Handle AI Request
            try {
                // Pause input while AI is processing to avoid interference
                rl.pause();
                await askOnceStream(trimmed, model);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(chalk.red(`\n[AI execution error]: ${message}`));
            } finally {
                // Always resume input
                rl.resume();
            }
        }
    } catch (criticalErr: unknown) {
        const message = criticalErr instanceof Error ? criticalErr.message : String(criticalErr);
        console.error(chalk.red(`\n[Critical Loop Error]: ${message}`));
    } finally {
        rl.close();
    }
}

// 配置 marked 使用 TerminalRenderer
marked.setOptions({
  renderer: new TerminalRenderer({
    // 自定义终端渲染选项
    tab: 2,
    width: process.stdout.columns || 80,
    showSectionPrefix: false,
  })
});

async function askOnceStream(question: string, model?: string) {
    const startTime = Date.now();
    const messages = [...getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    let fullResponse = '';

    try {
        // 显示流式输出（打字机效果）
        let isFirstOutput = true;
        await callAI_Stream(messages, model, (chunk) => {
            if (spinner.isSpinning) {
                spinner.stop();
                if (isFirstOutput) {
                    process.stdout.write(chalk.bold.blue('🤖 AI：'));
                    isFirstOutput = false;
                }
            }
            fullResponse += chunk;
            // 实现流式输出
            process.stdout.write(chunk);
        });

        // 计算流式输出占用的行数
        const lines = fullResponse.split('\n');
        const lineCount = lines.length;

        // 移动光标到输出开始的位置并清除内容
        // \x1b[A 是向上移动一行
        // \x1b[K 是清除从光标到行尾的内容
        for (let i = 0; i < lineCount; i++) {
            process.stdout.write('\x1b[A\x1b[K'); // Move up one line and clear it
        }

        // 额外清除 "🤖 AI：" 这一行
        process.stdout.write('\x1b[A\x1b[K');

        // 输出格式化的 AI 响应
        process.stdout.write(chalk.bold.blue('🤖 AI：'));
        const formattedResponse = marked.parse(fullResponse, { async: false });
        process.stdout.write(formattedResponse);

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);

        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\n' + chalk.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        // Re-throw to be caught by the loop
        throw error;
    }
}
