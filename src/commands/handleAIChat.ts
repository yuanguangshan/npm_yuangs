import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';
import * as marked from 'marked';
import TerminalRenderer from 'marked-terminal';
import fs from 'fs';
import path from 'path';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function showFileSelector(rl: readline.Interface): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);
            
            if (files.length === 0) {
                console.log(chalk.yellow('当前目录为空\n'));
                resolve(null);
                return;
            }

            console.log(chalk.bold.cyan('📁 当前目录文件列表:\n'));
            
            files.forEach((file, index) => {
                const fullPath = path.join(currentDir, file);
                const isDir = fs.statSync(fullPath).isDirectory();
                const icon = isDir ? chalk.cyan('📁') : chalk.green('📄');
                const padding = (index + 1).toString().padStart(2);
                console.log(`  [${padding}] ${icon} ${file}`);
            });
            console.log();

            rl.question(chalk.cyan('请选择文件 (输入序号，或按 Enter 返回): '), (choice) => {
                if (choice.trim() === '') {
                    console.log(chalk.gray('已取消选择\n'));
                    resolve(null);
                    return;
                }

                const index = parseInt(choice) - 1;
                if (isNaN(index) || index < 0 || index >= files.length) {
                    console.log(chalk.red('无效的序号\n'));
                    resolve(null);
                    return;
                }

                const selectedFile = files[index];
                console.log(chalk.green(`✓ 已选择: ${selectedFile}\n`));
                resolve(selectedFile);
            });
        } catch (error) {
            console.error(chalk.red(`读取目录失败: ${error}\n`));
            resolve(null);
        }
    });
}

async function handleDirectoryReference(input: string): Promise<string> {
    const match = input.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: # 目录路径 [问题]\n'));
        return input;
    }

    const dirPath = match[1].trim();
    const question = match[2] ? match[2].trim() : '请分析这个目录下的文件';

    const fullPath = path.resolve(dirPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
        return question;
    }

    const spinner = ora(chalk.cyan('正在读取文件...')).start();
    
    try {
        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;

        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);

        spinner.stop();

        if (filePaths.length === 0) {
            console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
            return question;
        }

        const contentMap = readFilesContent(filePaths);
        
        const prompt = buildPromptWithFileContent(
            `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
            filePaths.map(p => path.relative(process.cwd(), p)),
            contentMap,
            question
        );

        console.log(chalk.green(`✓ 已读取 ${contentMap.size} 个文件\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取目录失败: ${error}\n`));
        return question;
    }
}

export async function handleAIChat(initialQuestion: string | null, model?: string) {
    if (initialQuestion) {
        // 如果有初始问题，直接回答并退出，不进入交互模式
        await askOnceStream(initialQuestion, model);
        return;
    }

    // 如果没有初始问题，进入交互模式
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

            if (trimmed === '@') {
                const selectedFile = await showFileSelector(rl);
                if (selectedFile) {
                    continue;
                }
                continue;
            }

            if (trimmed.startsWith('#')) {
                rl.pause();
                try {
                    const processedInput = await handleDirectoryReference(trimmed);
                    await askOnceStream(processedInput, model);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

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
