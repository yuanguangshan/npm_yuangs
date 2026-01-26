import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory, getUserConfig } from '../ai/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ContextBuffer } from './contextBuffer';
import { ContextStore, ContextAssembler, ContextItem } from './context';
import { loadContext, saveContext, clearContextStorage } from './contextStorage';
import { getGitContext } from './gitContext';
import {
    Mode,
    detectMode,
    createCompleter,
    executeCommand as shellExecuteCommand,
    listPlugins
} from './shellCompletions';
import { runMacro } from '../core/macros';
import { StreamMarkdownRenderer } from '../utils/renderer';
import { wouldExpandAsGlob } from '../utils/globDetector';
const execAsync = promisify(exec);

// 全局变量：存储最后的 AI 输出内容，用于快速插入
let lastAIOutput: string = '';
let clipboardContent: string = '';

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

        const relativeFilePaths = filePaths.map(p => path.relative(process.cwd(), p));

        const prompt = buildPromptWithFileContent(
            `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
            relativeFilePaths,
            contentMap,
            question
        );

        const globalOptions = (global as any).yuangsOptions || {};
        if (globalOptions.showContextRelevance && question) {
            const { SmartContextManager } = await import('../agent/smartContextManager');
            const contextManager = new SmartContextManager();

            const enhancedContext = await contextManager.getEnhancedContext({
                query: question,
                minRelevance: 0.3,
                maxTokens: 5000,
                enableSmartSummary: true
            });

            if (enhancedContext.summary) {
                console.log(chalk.cyan('\n📊 Context Relevance Analysis\n'));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(enhancedContext.summary);

                if (enhancedContext.rankedItems.length > 0) {
                    console.log(chalk.cyan('\n📋 Ranked Files (Top 10)\n'));
                    enhancedContext.rankedItems.slice(0, 10).forEach((item, i) => {
                        const relevancePercent = (item.relevance * 100).toFixed(0);
                        const color = item.relevance > 0.8 ? chalk.green :
                            item.relevance > 0.5 ? chalk.yellow : chalk.gray;
                        console.log(`  ${i + 1}. ${color(item.path)} ${chalk.gray(`(${relevancePercent}%)`)}`);
                        if (item.matchReasons.length > 0) {
                            console.log(`     ${chalk.gray(item.matchReasons.join(', '))}`);
                        }
                    });
                }
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            }
        }

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
        const { AgentRuntime } = await import('../agent');
        const runtime = new AgentRuntime(getConversationHistory());

        const spinner = ora(chalk.cyan('AI 正在思考...')).start();
        const renderer = new StreamMarkdownRenderer(chalk.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);

        await runtime.run(initialQuestion, 'chat' as any, (chunk) => {
            renderer.onChunk(chunk);
        }, model, renderer);

        const fullResponse = renderer.finish();
        lastAIOutput = fullResponse;
        addToConversationHistory('user', initialQuestion);
        addToConversationHistory('assistant', fullResponse || '');
        return;
    }

    console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));

    const contextStore = new ContextStore();
    const contextAssembler = new ContextAssembler();
    const persisted = await loadContext();
    contextStore.import(persisted);

    if (persisted.length > 0) {
        console.log(chalk.yellow(`📦 已恢复 ${persisted.length} 条上下文\n`));
    }

    // 初始化 AgentRuntime (v2.0 引擎)
    const { AgentRuntime } = await import('../agent');
    const runtime = new AgentRuntime(getConversationHistory());

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
        // Ctrl+Y: 插入最后一条 AI 输出到命令行
        if (key.ctrl && key.name === 'y') {
            rl.write(lastAIOutput);
            console.log(chalk.gray('\n[已插入最后一条 AI 输出]'));
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

            const { handleSpecialSyntax } = await import('../utils/syntaxHandler');
            const specialResult = await handleSpecialSyntax(trimmed);
            if (specialResult.processed) {
                if (specialResult.result) {
                    console.log(specialResult.result);
                }
                continue;
            }

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

                        contextStore.add({
                            id: `file:${filePath}`,
                            source: 'file',
                            path: filePath,
                            content,
                            tokens: Math.ceil(content.length / 4),
                            importance: 0.5,
                            lastUsedAt: Date.now(),
                            addedAt: Date.now(),
                            status: 'active'
                        });

                        const displayName = filePath;
                        console.log(chalk.green(`✓ 已加入文件上下文: ${displayName}\n`));

                        await saveContext(contextStore.export());

                        console.log(chalk.cyan(`⚡️  正在执行: ${commandStr}\n`));

                        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(filePath) });
                        console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));

                        await saveContext(contextStore.export());
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

                            contextStore.add({
                                id: `file:${filePath} [Run Log]`,
                                source: 'file',
                                path: `${filePath} [Run Log]`,
                                alias: 'Execution Log',
                                content: combinedContent,
                                tokens: Math.ceil(combinedContent.length / 4),
                                importance: 0.5,
                                lastUsedAt: Date.now(),
                                addedAt: Date.now(),
                                status: 'active'
                            });

                            await saveContext(contextStore.export());
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

                        contextStore.add({
                            id: `file:${pathWithRange}`,
                            source: 'file',
                            path: pathWithRange,
                            alias,
                            content,
                            tokens: Math.ceil(content.length / 4),
                            importance: 0.5,
                            lastUsedAt: Date.now(),
                            addedAt: Date.now(),
                            status: 'active'
                        });
                    } else {
                        // 原始行为：添加整个文件
                        contextStore.add({
                            id: `file:${filePath}`,
                            source: 'file',
                            path: filePath,
                            alias,
                            content,
                            tokens: Math.ceil(content.length / 4),
                            importance: 0.5,
                            lastUsedAt: Date.now(),
                            addedAt: Date.now(),
                            status: 'active'
                        });
                    }

                    await saveContext(contextStore.export());
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

                    const userConfig = getUserConfig();
                    const maxFileTokens = userConfig.maxFileTokens || 20000;
                    const maxTotalTokensLimit = userConfig.maxTotalTokens || 200000;
                    const contentMap = readFilesContent(filePaths);

                    // 逐个添加文件，而不是将所有内容合并为一个大的目录项
                    // 这样可以更好地控制token使用，并保留之前的上下文
                    let addedCount = 0;
                    for (const [filePath, content] of contentMap) {
                        // 检查单个文件大小，如果太大则跳过
                        const fileTokens = Math.ceil(content.length / 4);
                        if (fileTokens > maxFileTokens) { // 使用配置的文件上限
                            console.log(chalk.yellow(`⚠️  跳过大文件: ${filePath} (太大)`));
                            continue;
                        }

                        contextStore.add({
                            id: `file:${filePath}`,
                            source: 'file',
                            path: filePath,
                            content: content,
                            tokens: Math.ceil(content.length / 4),
                            importance: 0.5,
                            lastUsedAt: Date.now(),
                            addedAt: Date.now(),
                            status: 'active'
                        });
                        addedCount++;

                        // 检查是否达到token限制，如果达到则停止添加更多文件
                        // 我们需要手动计算总tokens，因为totalTokens是私有方法
                        const currentTotalTokens = contextStore.export().reduce((sum, item) => sum + item.tokens, 0);
                        if (currentTotalTokens > maxTotalTokensLimit) { // 使用总上下文上限
                            console.log(chalk.yellow(`⚠️  达到token限制，停止添加更多文件`));
                            break;
                        }
                    }

                    await saveContext(contextStore.export());
                    console.log(chalk.green(`✓ 已成功加入 ${addedCount} 个文件到上下文\n`));
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
                const list = contextStore.list();
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
                const items = contextStore.export();

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
                contextStore.clear();
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

            // 检测 yuangs macro 命令，透传执行不经过AI
            if (trimmed.startsWith('yuangs macro') || trimmed.startsWith('ygs macro')) {
                rl.pause();
                try {
                    const parts = trimmed.split(/\s+/);
                    if (parts.length >= 3) { // 至少有 'yuangs', 'macro', 'name'
                        const macroName = parts[2];
                        console.log(chalk.cyan(`\n🔄 执行宏: ${macroName}\n`));

                        const success = runMacro(macroName);
                        if (success) {
                            console.log(chalk.green(`✓ 宏 "${macroName}" 执行完成\n`));
                        } else {
                            console.log(chalk.red(`✗ 宏 "${macroName}" 不存在或执行失败\n`));
                        }
                    } else {
                        console.log(chalk.yellow('用法: yuangs macro <name> 或 ygs macro <name>\n'));
                    }
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[Macro Error]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            // Alternative Zero-Mode entry: :ai command
            if (trimmed === ':ai') {
                rl.pause();
                try {
                    console.log(chalk.cyan('AI 模式启动...\n'));

                    // Use empty context or current context for AI interaction
                    let finalPrompt = contextStore.isEmpty()
                        ? '你好，请开始对话'
                        : contextAssembler.assemble(contextStore, '你好，请基于以上上下文开始对话');

                    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
                    const renderer = new StreamMarkdownRenderer(chalk.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);

                    await runtime.run(finalPrompt, 'chat' as any, (chunk) => {
                        renderer.onChunk(chunk);
                    }, model, renderer);

                    const fullResponse = renderer.finish();
                    lastAIOutput = fullResponse;

                    // 同步上下文到全局历史（为了兼容性）
                    addToConversationHistory('user', finalPrompt);
                    addToConversationHistory('assistant', fullResponse);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[AI execution error]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            if (!trimmed) {
                // Empty line + Enter as alternative to ?? for Zero-Mode
                rl.pause();
                try {
                    console.log(chalk.cyan('AI 模式启动 (空行触发)...\n'));

                    // Use empty context or current context for AI interaction
                    let finalPrompt = contextStore.isEmpty()
                        ? '你好，请开始对话'
                        : contextAssembler.assemble(contextStore, '你好，请基于以上上下文开始对话');

                    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
                    const renderer = new StreamMarkdownRenderer(chalk.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);

                    await runtime.run(finalPrompt, 'chat' as any, (chunk) => {
                        renderer.onChunk(chunk);
                    }, model, renderer);

                    const fullResponse = renderer.finish();
                    lastAIOutput = fullResponse;

                    // 同步上下文到全局历史（为了兼容性）
                    addToConversationHistory('user', finalPrompt);
                    addToConversationHistory('assistant', fullResponse);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[AI execution error]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            // Check for ?? pattern which could be expanded by shell glob
            if (trimmed === '??' || trimmed.startsWith('?? ')) {
                const globMatches = wouldExpandAsGlob('??', process.cwd());
                if (globMatches.wouldExpand) {
                    console.log(chalk.yellow('⚠️  Zero‑Mode 触发符 \'??\' 在当前目录可能被解释为文件名展开：'));
                    console.log(chalk.gray('匹配到：'));
                    globMatches.matches.forEach(match => {
                        console.log(chalk.gray(`- ${match}`));
                    });
                    console.log(chalk.gray('\n请使用 \':ai\' 或空行 + Enter 进入 Zero‑Mode'));
                    continue; // Skip processing and go to next input
                }
            }

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

            let finalPrompt = contextStore.isEmpty()
                ? trimmed
                : contextAssembler.assemble(contextStore, trimmed);

            const gitContext = await getGitContext();

            if (gitContext) {
                finalPrompt = `
${gitContext}

${finalPrompt}
`;
            }

            try {
                rl.pause();

                // 使用 AgentRuntime 执行提问
                const spinner = ora(chalk.cyan('AI 正在思考...')).start();
                const renderer = new StreamMarkdownRenderer(chalk.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);

                await runtime.run(finalPrompt, 'chat' as any, (chunk) => {
                    renderer.onChunk(chunk);
                }, model, renderer);

                    const fullResponse = renderer.finish();
                    lastAIOutput = fullResponse;

                // 同步上下文到全局历史（为了兼容性）
                addToConversationHistory('user', finalPrompt);
                addToConversationHistory('assistant', fullResponse);
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
    const renderer = new StreamMarkdownRenderer(chalk.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);

    try {
        await callAI_Stream(messages, model, (chunk) => {
            renderer.onChunk(chunk);
        });

        const fullResponse = renderer.finish();
        lastAIOutput = fullResponse;

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}
