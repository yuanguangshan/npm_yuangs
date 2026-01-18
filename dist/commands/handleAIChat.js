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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fileReader_1 = require("../core/fileReader");
const child_process_1 = require("child_process");
const util_1 = require("util");
const contextBuffer_1 = require("./contextBuffer");
const contextStorage_1 = require("./contextStorage");
const gitContext_1 = require("./gitContext");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function findCommonPrefix(strings) {
    if (strings.length === 0)
        return '';
    if (strings.length === 1)
        return strings[0];
    let common = '';
    const first = strings[0];
    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        }
        else {
            break;
        }
    }
    return common;
}
async function showFileSelector(rl) {
    return new Promise((resolve) => {
        try {
            const currentDir = process.cwd();
            const files = fs_1.default.readdirSync(currentDir);
            if (files.length === 0) {
                console.log(chalk_1.default.yellow('当前目录为空\n'));
                resolve(null);
                return;
            }
            console.log(chalk_1.default.bold.cyan('📁 当前目录文件列表:\n'));
            files.forEach((file, index) => {
                const fullPath = path_1.default.join(currentDir, file);
                const isDir = fs_1.default.statSync(fullPath).isDirectory();
                const icon = isDir ? chalk_1.default.cyan('📁') : chalk_1.default.green('📄');
                const padding = (index + 1).toString().padStart(2);
                console.log(`  [${padding}] ${icon} ${file}`);
            });
            console.log();
            rl.question(chalk_1.default.cyan('请选择文件 (输入序号，或按 Enter 返回): '), (choice) => {
                if (choice.trim() === '') {
                    console.log(chalk_1.default.gray('已取消选择\n'));
                    resolve(null);
                    return;
                }
                const index = parseInt(choice) - 1;
                if (isNaN(index) || index < 0 || index >= files.length) {
                    console.log(chalk_1.default.red('无效的序号\n'));
                    resolve(null);
                    return;
                }
                const selectedFile = files[index];
                console.log(chalk_1.default.green(`✓ 已选择: ${selectedFile}\n`));
                resolve(selectedFile);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`读取目录失败: ${error}\n`));
            resolve(null);
        }
    });
}
async function handleFileReference(filePath, question) {
    const fullPath = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(fullPath) || !fs_1.default.statSync(fullPath).isFile()) {
        console.log(chalk_1.default.red(`错误: 文件 "${filePath}" 不存在或不是一个文件\n`));
        return question || '';
    }
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('正在读取文件...')).start();
    try {
        const content = fs_1.default.readFileSync(fullPath, 'utf-8');
        const relativePath = path_1.default.relative(process.cwd(), fullPath);
        const contentMap = new Map();
        contentMap.set(relativePath, content);
        const prompt = (0, fileReader_1.buildPromptWithFileContent)(`文件: ${relativePath}`, [relativePath], contentMap, question || `请分析文件: ${relativePath}`);
        spinner.stop();
        console.log(chalk_1.default.green(`✓ 已读取文件: ${relativePath}\n`));
        return prompt;
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red(`读取文件失败: ${error}\n`));
        return question || '';
    }
}
async function handleFileReferenceInput(input) {
    const match = input.match(/^@\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk_1.default.yellow('格式错误，正确用法: @文件路径 [问题]\n'));
        return '';
    }
    const filePath = match[1].trim();
    const question = match[2] ? match[2].trim() : '';
    return handleFileReference(filePath, question);
}
async function handleDirectoryReference(input) {
    const match = input.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk_1.default.yellow('格式错误，正确用法: # 目录路径 [问题]\n'));
        return input;
    }
    const dirPath = match[1].trim();
    const question = match[2] ? match[2].trim() : '请分析这个目录下的文件';
    const fullPath = path_1.default.resolve(dirPath);
    if (!fs_1.default.existsSync(fullPath) || !fs_1.default.statSync(fullPath).isDirectory()) {
        console.log(chalk_1.default.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
        return question;
    }
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('正在读取文件...')).start();
    try {
        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;
        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);
        spinner.stop();
        if (filePaths.length === 0) {
            console.log(chalk_1.default.yellow(`目录 "${dirPath}" 下没有文件\n`));
            return question;
        }
        const contentMap = (0, fileReader_1.readFilesContent)(filePaths);
        const prompt = (0, fileReader_1.buildPromptWithFileContent)(`目录: ${dirPath}\n找到 ${filePaths.length} 个文件`, filePaths.map(p => path_1.default.relative(process.cwd(), p)), contentMap, question);
        console.log(chalk_1.default.green(`✓ 已读取 ${contentMap.size} 个文件\n`));
        return prompt;
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red(`读取目录失败: ${error}\n`));
        return question;
    }
}
async function handleAIChat(initialQuestion, model) {
    if (initialQuestion) {
        await askOnceStream(initialQuestion, model);
        return;
    }
    console.log(chalk_1.default.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
    const contextBuffer = new contextBuffer_1.ContextBuffer();
    const persisted = await (0, contextStorage_1.loadContext)();
    contextBuffer.import(persisted);
    if (persisted.length > 0) {
        console.log(chalk_1.default.yellow(`📦 已恢复 ${persisted.length} 条上下文\n`));
    }
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer: (line) => {
            if (!line.startsWith('@') && !line.startsWith('#')) {
                return [[], line];
            }
            const isFileMode = line.startsWith('@');
            const prefix = isFileMode ? '@ ' : '# ';
            const inputAfterPrefix = line.substring(prefix.length);
            if (!inputAfterPrefix) {
                const currentDir = process.cwd();
                const files = fs_1.default.readdirSync(currentDir);
                const completions = isFileMode
                    ? files.filter(f => {
                        const fullPath = path_1.default.join(currentDir, f);
                        return fs_1.default.statSync(fullPath).isFile();
                    })
                    : files.filter(f => {
                        const fullPath = path_1.default.join(currentDir, f);
                        return fs_1.default.statSync(fullPath).isDirectory();
                    });
                return [completions.map(c => prefix + c), prefix];
            }
            const parts = inputAfterPrefix.split(path_1.default.sep);
            const partialName = parts[parts.length - 1];
            const basePath = parts.slice(0, -1).join(path_1.default.sep);
            const searchPath = basePath ? path_1.default.resolve(basePath) : process.cwd();
            if (!fs_1.default.existsSync(searchPath) || !fs_1.default.statSync(searchPath).isDirectory()) {
                return [[], line];
            }
            const files = fs_1.default.readdirSync(searchPath);
            const completions = files
                .filter(f => {
                const fullPath = path_1.default.join(searchPath, f);
                const isDir = fs_1.default.statSync(fullPath).isDirectory();
                const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());
                if (isFileMode) {
                    return matchesPrefix && !isDir;
                }
                else {
                    return matchesPrefix && isDir;
                }
            })
                .map(f => {
                const fullPath = path_1.default.join(searchPath, f);
                const isDir = fs_1.default.statSync(fullPath).isDirectory();
                return isDir ? f + path_1.default.sep : f;
            });
            const commonPrefix = completions.length === 1
                ? completions[0]
                : findCommonPrefix(completions);
            const newLine = basePath
                ? prefix + basePath + path_1.default.sep + commonPrefix
                : prefix + commonPrefix;
            return [completions.map(c => {
                    const fullCompletion = basePath
                        ? prefix + basePath + path_1.default.sep + c
                        : prefix + c;
                    return fullCompletion;
                }), completions.length === 1 ? newLine : line];
        }
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
            if (trimmed.startsWith('@')) {
                rl.pause();
                try {
                    // 增强的匹配模式，支持行号指定: @ filepath:startLine-endLine as alias
                    const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);
                    const filePath = match?.[1] ?? (await showFileSelector(rl));
                    const lineStart = match?.[2] ? parseInt(match[2]) : null;
                    const lineEnd = match?.[3] ? parseInt(match[3]) : null;
                    const alias = match?.[4];
                    if (!filePath)
                        continue;
                    const absolutePath = path_1.default.resolve(filePath);
                    let content = await fs_1.default.promises.readFile(absolutePath, 'utf-8');
                    // 如果指定了行号范围，则提取相应行
                    if (lineStart !== null) {
                        const lines = content.split('\n');
                        // 验证行号范围
                        if (lineStart < 1 || lineStart > lines.length) {
                            console.log(chalk_1.default.red(`\n错误: 起始行号 ${lineStart} 超出文件范围 (文件共有 ${lines.length} 行)\n`));
                            rl.resume();
                            continue;
                        }
                        const startIdx = lineStart - 1; // 转换为数组索引（从0开始）
                        let endIdx = lineEnd ? Math.min(lineEnd, lines.length) : lines.length; // 如果未指定结束行，则到文件末尾
                        if (lineEnd && (lineEnd < lineStart || lineEnd > lines.length)) {
                            console.log(chalk_1.default.red(`\n错误: 结束行号 ${lineEnd} 超出有效范围 (应在 ${lineStart}-${lines.length} 之间)\n`));
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
                    }
                    else {
                        // 原始行为：添加整个文件
                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            alias,
                            content
                        });
                    }
                    await (0, contextStorage_1.saveContext)(contextBuffer.export());
                    const displayName = alias ? `${alias} (${filePath}${lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''})` :
                        (filePath + (lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''));
                    console.log(chalk_1.default.green(`✅ 已加入文件上下文: ${displayName}\n`));
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk_1.default.red(`\n[处理错误]: ${message}\n`));
                }
                finally {
                    rl.resume();
                }
                continue;
            }
            if (trimmed.startsWith('#')) {
                rl.pause();
                try {
                    const match = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
                    if (!match) {
                        console.log(chalk_1.default.yellow('格式错误，正确用法: # 目录路径\n'));
                        rl.resume();
                        continue;
                    }
                    const dirPath = match[1].trim();
                    const fullPath = path_1.default.resolve(dirPath);
                    if (!fs_1.default.existsSync(fullPath) || !fs_1.default.statSync(fullPath).isDirectory()) {
                        console.log(chalk_1.default.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
                        rl.resume();
                        continue;
                    }
                    const findCommand = process.platform === 'darwin' || process.platform === 'linux'
                        ? `find "${fullPath}" -type f`
                        : `dir /s /b "${fullPath}"`;
                    const { stdout } = await execAsync(findCommand);
                    const filePaths = stdout.trim().split('\n').filter(f => f);
                    if (filePaths.length === 0) {
                        console.log(chalk_1.default.yellow(`目录 "${dirPath}" 下没有文件\n`));
                        rl.resume();
                        continue;
                    }
                    const contentMap = (0, fileReader_1.readFilesContent)(filePaths);
                    const prompt = (0, fileReader_1.buildPromptWithFileContent)(`目录: ${dirPath}\n找到 ${filePaths.length} 个文件`, filePaths.map(p => path_1.default.relative(process.cwd(), p)), contentMap, '');
                    contextBuffer.add({
                        type: 'directory',
                        path: dirPath,
                        content: prompt
                    });
                    await (0, contextStorage_1.saveContext)(contextBuffer.export());
                    console.log(chalk_1.default.green(`✅ 已加入目录上下文: ${dirPath}\n`));
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk_1.default.red(`\n[处理错误]: ${message}\n`));
                }
                finally {
                    rl.resume();
                }
                continue;
            }
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
            if (trimmed === ':ls') {
                const list = contextBuffer.list();
                if (list.length === 0) {
                    console.log(chalk_1.default.gray('📭 当前没有上下文\n'));
                }
                else {
                    console.table(list);
                }
                continue;
            }
            if (trimmed === ':clear') {
                contextBuffer.clear();
                await (0, contextStorage_1.clearContextStorage)();
                console.log(chalk_1.default.yellow('🧹 上下文已清空（含持久化）\n'));
                continue;
            }
            if (!trimmed)
                continue;
            let finalPrompt = contextBuffer.isEmpty()
                ? trimmed
                : contextBuffer.buildPrompt(trimmed);
            const gitContext = await (0, gitContext_1.getGitContext)();
            if (gitContext) {
                finalPrompt = `
${gitContext}

${finalPrompt}
`;
            }
            try {
                rl.pause();
                await askOnceStream(finalPrompt, model);
                contextBuffer.clear();
                await (0, contextStorage_1.saveContext)([]);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(chalk_1.default.red(`\n[AI execution error]: ${message}`));
            }
            finally {
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
        tab: 2,
        width: process.stdout.columns || 80,
        showSectionPrefix: false
    })
});
async function askOnceStream(question, model) {
    const startTime = Date.now();
    const messages = [...(0, client_1.getConversationHistory)()];
    messages.push({ role: 'user', content: question });
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
    let fullResponse = '';
    const BOT_PREFIX = chalk_1.default.bold.blue('🤖 AI：');
    try {
        let isFirstOutput = true;
        await (0, client_1.callAI_Stream)(messages, model, (chunk) => {
            if (spinner.isSpinning) {
                spinner.stop();
                if (isFirstOutput) {
                    process.stdout.write(BOT_PREFIX);
                    isFirstOutput = false;
                }
            }
            fullResponse += chunk;
            process.stdout.write(chunk);
        });
        const formatted = marked.parse(fullResponse, { async: false }).trim();
        if (process.stdout.isTTY) {
            // TTY模式（交互模式）
            // 1. 先输出原本的流式内容（Raw）
            // 2. 结束时，计算 Raw 内容的高度（Visual Line Count）
            // 3. 向上清除相应行数
            // 4. 输出渲染后的 Markdown 内容
            const screenWidth = process.stdout.columns || 80;
            const totalContent = BOT_PREFIX + fullResponse;
            let lineCount = getVisualLineCount(totalContent, screenWidth);
            // 清除 Raw Output
            // 移至当前行开头并清除
            process.stdout.write('\r\x1b[K');
            // 向上移动并清除
            for (let i = 0; i < lineCount - 1; i++) {
                process.stdout.write('\x1b[A\x1b[K');
            }
            // 输出格式化的 Markdown 内容
            process.stdout.write(BOT_PREFIX + formatted + '\n');
        }
        else {
            // 非TTY模式（如管道模式）
            // 只输出格式化内容，不执行清除逻辑，避免转义序列可见
            if (spinner.isSpinning) {
                spinner.stop();
            }
            process.stdout.write(BOT_PREFIX + formatted + '\n');
        }
        (0, client_1.addToConversationHistory)('user', question);
        (0, client_1.addToConversationHistory)('assistant', fullResponse);
        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\n' + chalk_1.default.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));
    }
    catch (error) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}
function getVisualLineCount(text, screenWidth) {
    const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    const lines = text.split('\n');
    let totalLines = 0;
    for (const line of lines) {
        // Expand tabs (assuming 8 spaces)
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);
        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            // Most characters > 255 are 2 cells (CJK, Emojis, etc.)
            lineWidth += code > 255 ? 2 : 1;
        }
        if (lineWidth === 0) {
            totalLines += 1;
        }
        else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }
    return totalLines;
}
//# sourceMappingURL=handleAIChat.js.map