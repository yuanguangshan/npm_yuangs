import chalk from 'chalk';
import ora from 'ora';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';

// Configure marked
marked.setOptions({
    renderer: new TerminalRenderer({
        code: chalk.yellow,
        heading: chalk.magenta.bold,
        firstHeading: chalk.magenta.underline.bold,
        listitem: chalk.cyan,
        table: chalk.white,
        strong: chalk.bold.red,
        em: chalk.italic
    }) as any // marked-terminal has no official TS types, safe cast as per review
});


export async function handleAIChat(question: string | null, model?: string) {
    if (!question) {
        // Interactive mode
        console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askLoop = () => {
            rl.question(chalk.green('你：'), async (q) => {
                const trimmed = q.trim();
                if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                    console.log(chalk.cyan('👋 再见！'));
                    rl.close();
                    return;
                }
                if (trimmed === '/clear') {
                    clearConversationHistory();
                    console.log(chalk.yellow('✓ 对话历史已清空\n'));
                    return askLoop();
                }
                if (trimmed === '/history') {
                    const history = getConversationHistory();
                    history.forEach((msg) => {
                        const prefix = msg.role === 'user' ? chalk.green('你: ') : chalk.blue('AI: ');
                        console.log(prefix + msg.content);
                    });
                    return askLoop();
                }
                if (!trimmed) return askLoop();

                await askOnceStream(trimmed, model);
                askLoop();
            });
        };
        askLoop();
    } else {
        await askOnceStream(question, model);
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
            if (spinner.isSpinning) spinner.stop();
            fullResponse += chunk;
            process.stdout.write(chunk);
        });

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);

        console.log('\n' + chalk.gray('─'.repeat(80)));
        console.log(marked(fullResponse));

        const elapsed = (Date.now() - startTime) / 1000;
        console.log(chalk.gray(`\n请求耗时: ${elapsed.toFixed(2)}s\n`));
    } catch (error: any) {
        if (spinner.isSpinning) spinner.fail(chalk.red('AI 响应出错'));
        console.error(error.message);
    }
}
