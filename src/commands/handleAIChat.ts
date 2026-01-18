import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';
import fs from 'fs';
import path from 'path';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ContextBuffer } from './contextBuffer';
import { loadContext, saveContext, clearContextStorage } from './contextStorage';
import { getGitContext } from './gitContext';
import {
    Mode,
    detectMode,
    createCompleter,
    executeCommand as shellExecuteCommand,
    listPlugins
} from './shellCompletions';
import { StreamMarkdownRenderer } from '../utils/renderer';
const execAsync = promisify(exec);

function findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

async function executeCommand(filePath: string, command?: string) {
    const fullPath = path.resolve(filePath);
    const commandStr = command || '';

    if (command) {
        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(fullPath) });
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    } else {
        const { stdout, stderr } = await exec(fullPath, { cwd: process.cwd() });
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    }
}

async function readFileContent(filePath: string): Promise<string> {
    const fullPath = path.resolve(filePath);
    return await fs.promises.readFile(fullPath, 'utf-8');
}

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

async function handleFileReference(filePath: string, question?: string): Promise<string> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        console.log(chalk.red(`错误: 文件 "${filePath}" 不存在或不是一个文件\n`));
        return question || '';
    }

    const spinner = ora(chalk.cyan('正在读取文件...')).start();

    try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(process.cwd(), fullPath);

        const contentMap = new Map<string, string>();
        contentMap.set(relativePath, content);

        const prompt = buildPromptWithFileContent(
            `文件: ${relativePath}`,
            [relativePath],
            contentMap,
            question || `请分析文件: ${relativePath}`
        );

        spinner.stop();
        console.log(chalk.green(`✓ 已读取文件: ${relativePath}\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取文件失败: ${error}\n`));
        return question || '';
    }
}

async function handleFileReferenceInput(input: string): Promise<string> {
    const match = input.match(/^@\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: @文件路径 [问题]\n'));
        return '';
    }

    const filePath = match[1].trim();
    const question = match[2] ? match[2].trim() : '';
    return handleFileReference(filePath, question);
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
        // 先检查是否为特殊语法
        const { handleSpecialSyntax } = await import('../utils/syntaxHandler');
        const result = await handleSpecialSyntax(initialQuestion);
        
        if (result.processed) {
            // 如果是管理命令（:ls, :cat, :clear），直接输出结果
            if (result.result) {
                console.log(result.result);
            }
            return;
        }
        
        // 不是特殊语法，正常发给 AI
        await askOnceStream(initialQuestion, model);
        return;
    }

    console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));

    const contextBuffer = new ContextBuffer();
    const persisted = await loadContext();
    contextBuffer.import(persisted);

    if (persisted.length > 0) {
        console.log(chalk.yellow(`📦 已恢复 ${persisted.length} 条上下文\n`));
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer: createCompleter(),
        historySize: 1000
    });

    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'r') {
            rl.write(null, { ctrl: true, name: 'r' });
        }
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

            // === 场景 5.1: 原子执行 (:exec) ===
            if (trimmed.startsWith(':exec ')) {
                const cmd = trimmed.slice(6).trim();
                if (cmd) {
                    console.log(chalk.cyan(`\n⚡️ [Atomic Exec] ${cmd}\n`));
                    rl.pause();
                    try {
                        await shellExecuteCommand(cmd, (code) => {
                            if (code !== 0) console.log(chalk.red(`Exited with ${code}`));
                        });
                    } finally {
                        rl.resume();
                    }
                }
                continue;
            }

            if (trimmed.startsWith('@')) {
                rl.pause();
                try {
                    // 新增：支持执行命令的语法
                    // @ filename:command - 添加并执行命令
                    // @!filename - 添加并立即执行文件

                    const execMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^].*)?$/);
                    const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);

                    if (execMatch && execMatch[2]) {
                        // @ filename:command - 添加并执行命令
                        const filePath = execMatch[1].trim();
                        const commandStr = execMatch[2].trim();

                        const content = await readFileContent(filePath);

                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            content
                        });

                        const displayName = filePath;
                        console.log(chalk.green(`✓ 已加入文件上下文: ${displayName}\n`));
                        
                        await saveContext(contextBuffer.export());
                        
                        console.log(chalk.cyan(`⚡️  正在执行: ${commandStr}\n`));
                        
                        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(filePath) });
                        console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));

                        await saveContext(contextBuffer.export());
                        console.log(chalk.green(`✓ 执行完成\n`));

                        rl.resume();
                        continue;
                    }

                    if (immediateExecMatch) {
                        // 场景 3.2: @!filename - 添加脚本源码并捕获执行输出
                        const filePath = immediateExecMatch[1].trim();
                        const fullPath = path.resolve(filePath);

                        if (fs.existsSync(fullPath)) {
                            // 1. 读取源码
                            const sourceContent = await readFileContent(filePath);
                            
                            console.log(chalk.cyan(`⚡️ 正在执行并捕获: ${filePath}\n`));
                            
                            // 2. 执行并捕获
                            const { stdout, stderr } = await execAsync(`chmod +x "${fullPath}" && "${fullPath}"`, { cwd: process.cwd() });
                            console.log(stdout); // 实时打印给用户看
                            if (stderr) console.error(chalk.red(stderr));

                            // 3. 构造组合上下文 (契约：命令内容 + 实际输出)
                            const combinedContent = `
=== Source: ${filePath} ===
\`\`\`bash
${sourceContent}
\`\`\`

=== Stdout ===
\`\`\`
${stdout}
\`\`\`

=== Stderr ===
\`\`\`
${stderr}
\`\`\`
`;

                            contextBuffer.add({
                                type: 'file',
                                path: `${filePath} [Run Log]`,
                                alias: 'Execution Log',
                                content: combinedContent
                            });
                            
                            await saveContext(contextBuffer.export());
                            console.log(chalk.green(`\n✓ 已捕获脚本源码及执行日志到上下文\n`));
                        } else {
                            console.log(chalk.red(`错误: 文件 ${filePath} 不存在`));
                        }

                        rl.resume();
                        continue;
                    }

                    // 增强的匹配模式，支持行号指定: @ filepath:startLine-endLine as alias
                    const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);
                    const filePath = match?.[1] ?? (await showFileSelector(rl));
                    const lineStart = match?.[2] ? parseInt(match[2]) : null;
                    const lineEnd = match?.[3] ? parseInt(match[3]) : null;
                    const alias = match?.[4];

                    if (!filePath) continue;

                    const absolutePath = path.resolve(filePath);
                    let content = await fs.promises.readFile(absolutePath, 'utf-8');

                    // 如果指定了行号范围，则提取相应行
                    if (lineStart !== null) {
                        const lines = content.split('\n');

                        // 验证行号范围
                        if (lineStart < 1 || lineStart > lines.length) {
                            console.log(chalk.red(`\n错误: 起始行号 ${lineStart} 超出文件范围 (文件共有 ${lines.length} 行)\n`));
                            rl.resume();
                            continue;
                        }

                        const startIdx = lineStart - 1; // 转换为数组索引（从0开始）
                        let endIdx = lineEnd ? Math.min(lineEnd, lines.length) : lines.length; // 如果未指定结束行，则到文件末尾

                        if (lineEnd && (lineEnd < lineStart || lineEnd > lines.length)) {
                            console.log(chalk.red(`\n错误: 结束行号 ${lineEnd} 超出有效范围 (应在 ${lineStart}-${lines.length} 之间)\n`));
                            rl.resume();
                            continue;
                        }

                        // 提取指定范围的行
                        content = lines.slice(startIdx, endIdx).join('\n');

                        // 更新路径显示，包含行号信息
                        const rangeInfo = lineEnd ? `${lineStart}-${lineEnd}` : `${lineStart}`;
                        const pathWithRange = `${filePath}:${rangeInfo}`;

                        contextBuffer.add({
                            type: 'file',
                            path: pathWithRange,
                            alias,
                            content
                        }, true); // bypassTokenLimit = true
                    } else {
                        // 原始行为：添加整个文件
                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            alias,
                            content
                        });
                    }

                    await saveContext(contextBuffer.export());
                    const displayName = alias ? `${alias} (${filePath}${lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''})` :
                        (filePath + (lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''));
                    console.log(chalk.green(`✅ 已加入文件上下文: ${displayName}\n`));
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}\n`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            if (trimmed.startsWith('#')) {
                rl.pause();
                try {
                    const match = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
                    if (!match) {
                        console.log(chalk.yellow('格式错误，正确用法: # 目录路径\n'));
                        rl.resume();
                        continue;
                    }

                    const dirPath = match[1].trim();
                    const fullPath = path.resolve(dirPath);

                    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
                        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
                        rl.resume();
                        continue;
                    }

                    const findCommand = process.platform === 'darwin' || process.platform === 'linux'
                        ? `find "${fullPath}" -type f`
                        : `dir /s /b "${fullPath}"`;

                    const { stdout } = await execAsync(findCommand);
                    const filePaths = stdout.trim().split('\n').filter(f => f);

                    if (filePaths.length === 0) {
                        console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
                        rl.resume();
                        continue;
                    }

                    const contentMap = readFilesContent(filePaths);

                    // 逐个添加文件，而不是将所有内容合并为一个大的目录项
                    // 这样可以更好地控制token使用，并保留之前的上下文
                    let addedCount = 0;
                    for (const [filePath, content] of contentMap) {
                        // 检查单个文件大小，如果太大则跳过
                        const fileTokens = Math.ceil(content.length / 4);
                        if (fileTokens > 2000) { // 限制单个文件不超过2000 tokens
                            console.log(chalk.yellow(`⚠️  跳过大文件: ${filePath} (太大)`));
                            continue;
                        }

                        contextBuffer.add({
                            type: 'file',  // 改为file类型，因为实际上是单个文件
                            path: filePath,
                            content: content
                        });
                        addedCount++;

                        // 检查是否达到token限制，如果达到则停止添加更多文件
                        // 我们需要手动计算总tokens，因为totalTokens是私有方法
                        const totalTokens = contextBuffer.export().reduce((sum, item) => sum + item.tokens, 0);
                        if (totalTokens > 30000) { // 留2000 token余量
                            console.log(chalk.yellow(`⚠️  达到token限制，停止添加更多文件`));
                            break;
                        }
                    }

                    await saveContext(contextBuffer.export());
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}\n`));
                } finally {
                    rl.resume();
                }
                continue;
            }

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

            if (trimmed === ':ls') {
                const list = contextBuffer.list();
                if (list.length === 0) {
                    console.log(chalk.gray('📭 当前没有上下文\n'));
                } else {
                    console.table(list);
                }
                continue;
            }

            if (trimmed === ':cat' || trimmed.startsWith(':cat ')) {
                const parts = trimmed.split(' ');
                const index = parts.length > 1 ? parseInt(parts[1]) : null;
                const items = contextBuffer.export();

                if (items.length === 0) {
                    console.log(chalk.gray('📭 当前没有上下文内容可查阅\n'));
                } else if (index !== null) {
                    if (index < 1 || index > items.length) {
                        console.log(chalk.red(`❌ 索引 ${index} 超出范围 (1-${items.length})\n`));
                    } else {
                        const item = items[index - 1];
                        console.log(chalk.cyan(`\n=== [${index}] ${item.path} ===`));
                        console.log(item.content);
                        console.log(chalk.cyan(`=== End ===\n`));
                    }
                } else {
                    console.log(chalk.cyan('\n=== 当前完整上下文内容 ==='));
                    items.forEach((item, i) => {
                        console.log(chalk.yellow(`\n--- [${i + 1}] ${item.path} ---`));
                        console.log(item.content);
                    });
                    console.log(chalk.cyan('\n==========================\n'));
                }
                continue;
            }

            if (trimmed === ':clear') {
                contextBuffer.clear();
                await clearContextStorage();
                console.log(chalk.yellow('🧹 上下文已清空（含持久化）\n'));
                continue;
            }

            if (trimmed === ':plugins') {
                const plugins = listPlugins();
                if (plugins.length === 0) {
                    console.log(chalk.gray('📭 当前没有加载的插件\n'));
                } else {
                    console.log(chalk.cyan('已加载的插件:\n'));
                    plugins.forEach(p => console.log(chalk.green(`  - ${p}`)));
                    console.log();
                }
                continue;
            }

            if (!trimmed) continue;

            const mode = detectMode(trimmed);

            if (mode === 'command') {
                rl.pause();
                try {
                    await shellExecuteCommand(trimmed, (code) => {
                        if (code !== 0) {
                            console.log(chalk.red(`\n[command exited with code ${code}]\n`));
                        }
                    });
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[Command Error]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            let finalPrompt = contextBuffer.isEmpty()
                ? trimmed
                : contextBuffer.buildPrompt(trimmed);

            const gitContext = await getGitContext();

            if (gitContext) {
                finalPrompt = `
${gitContext}

${finalPrompt}
`;
            }

            try {
                rl.pause();
                await askOnceStream(finalPrompt, model);

                // IMPORTANT: Removed auto-clearing of contextBuffer.
                // Keeping it for follow-up questions until :clear is called.
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(chalk.red(`\n[AI execution error]: ${message}`));
            } finally {
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

async function askOnceStream(question: string, model?: string) {
    const messages = [...getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    
    // 初始化渲染器
    const renderer = new StreamMarkdownRenderer(chalk.bold.blue('🤖 AI：'), spinner);

    try {
        await callAI_Stream(messages, model, (chunk) => {
            renderer.onChunk(chunk);
        });

        const fullResponse = renderer.finish();

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}
