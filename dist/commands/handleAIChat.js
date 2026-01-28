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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fileReader_1 = require("../core/fileReader");
const child_process_1 = require("child_process");
const util_1 = require("util");
const context_1 = require("./context");
const contextStorage_1 = require("./contextStorage");
const gitContext_1 = require("./gitContext");
const shellCompletions_1 = require("./shellCompletions");
const macros_1 = require("../core/macros");
const renderer_1 = require("../utils/renderer");
const globDetector_1 = require("../utils/globDetector");
const syntaxHandler_1 = require("../utils/syntaxHandler");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// 全局变量：存储最后的 AI 输出内容，用于快速插入
let lastAIOutput = '';
let clipboardContent = '';
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
async function executeCommand(filePath, command) {
    const fullPath = path_1.default.resolve(filePath);
    const commandStr = command || '';
    if (command) {
        const { stdout, stderr } = await (0, child_process_1.exec)(commandStr, { cwd: path_1.default.dirname(fullPath) });
        console.log(stdout);
        if (stderr)
            console.error(chalk_1.default.red(stderr));
    }
    else {
        const { stdout, stderr } = await (0, child_process_1.exec)(fullPath, { cwd: process.cwd() });
        console.log(stdout);
        if (stderr)
            console.error(chalk_1.default.red(stderr));
    }
}
async function readFileContent(filePath) {
    const fullPath = path_1.default.resolve(filePath);
    return await fs_1.default.promises.readFile(fullPath, 'utf-8');
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
        const relativeFilePaths = filePaths.map(p => path_1.default.relative(process.cwd(), p));
        const prompt = (0, fileReader_1.buildPromptWithFileContent)(`目录: ${dirPath}\n找到 ${filePaths.length} 个文件`, relativeFilePaths, contentMap, question);
        const globalOptions = global.yuangsOptions || {};
        if (globalOptions.showContextRelevance && question) {
            const { SmartContextManager } = await Promise.resolve().then(() => __importStar(require('../agent/smartContextManager')));
            const contextManager = new SmartContextManager();
            const enhancedContext = await contextManager.getEnhancedContext({
                query: question,
                minRelevance: 0.3,
                maxTokens: 5000,
                enableSmartSummary: true
            });
            if (enhancedContext.summary) {
                console.log(chalk_1.default.cyan('\n📊 Context Relevance Analysis\n'));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(enhancedContext.summary);
                if (enhancedContext.rankedItems.length > 0) {
                    console.log(chalk_1.default.cyan('\n📋 Ranked Files (Top 10)\n'));
                    enhancedContext.rankedItems.slice(0, 10).forEach((item, i) => {
                        const relevancePercent = (item.relevance * 100).toFixed(0);
                        const color = item.relevance > 0.8 ? chalk_1.default.green :
                            item.relevance > 0.5 ? chalk_1.default.yellow : chalk_1.default.gray;
                        console.log(`  ${i + 1}. ${color(item.path)} ${chalk_1.default.gray(`(${relevancePercent}%)`)}`);
                        if (item.matchReasons.length > 0) {
                            console.log(`     ${chalk_1.default.gray(item.matchReasons.join(', '))}`);
                        }
                    });
                }
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            }
        }
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
    // 初始化 AgentRuntime (v2.0 引擎)
    const { AgentRuntime } = await Promise.resolve().then(() => __importStar(require('../agent')));
    const runtime = new AgentRuntime((0, client_1.getConversationHistory)());
    const processInteraction = async (question) => {
        const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
        const renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);
        await runtime.run(question, 'chat', (chunk) => {
            renderer.onChunk(chunk);
        }, model, renderer);
        const fullResponse = renderer.finish();
        lastAIOutput = fullResponse;
        (0, client_1.addToConversationHistory)('user', question);
        (0, client_1.addToConversationHistory)('assistant', fullResponse || '');
    };
    if (initialQuestion) {
        // 先检查是否为特殊语法
        const result = await (0, syntaxHandler_1.handleSpecialSyntax)(initialQuestion);
        if (result.processed) {
            if (result.result) {
                if (result.type === 'management') {
                    console.log(result.result);
                    return;
                }
                else if (result.isPureReference) {
                    // 纯引用且没有后续提问，输出提示并退出
                    if (result.error) {
                        console.log(chalk_1.default.red(result.result));
                        throw new Error(result.result);
                    }
                    else {
                        console.log(chalk_1.default.green(`✓ ${result.result || '已加入上下文'}`));
                        return;
                    }
                }
                else {
                    // 带问题的引用，将处理后的 prompt 作为新的 initialQuestion
                    initialQuestion = result.result;
                }
            }
            else {
                return;
            }
        }
        // 如果 initialQuestion 仍有效（且不是 null），发送给 AI
        if (initialQuestion) {
            await processInteraction(initialQuestion);
        }
    }
    console.log(chalk_1.default.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
    const contextStore = new context_1.ContextStore();
    const contextAssembler = new context_1.ContextAssembler();
    const persisted = await (0, contextStorage_1.loadContext)();
    contextStore.import(persisted);
    if (persisted.length > 0) {
        console.log(chalk_1.default.yellow(`📦 已恢复 ${persisted.length} 条上下文\n`));
    }
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer: (0, shellCompletions_1.createCompleter)(),
        historySize: 1000
    });
    readline_1.default.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'r') {
            rl.write(null, { ctrl: true, name: 'r' });
        }
        // Ctrl+Y: 插入最后一条 AI 输出到命令行
        if (key.ctrl && key.name === 'y') {
            rl.write(lastAIOutput);
            console.log(chalk_1.default.gray('\n[已插入最后一条 AI 输出]'));
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
            if (!trimmed)
                continue;
            if (trimmed.includes('|')) {
                await runPipeline(trimmed, rl, runtime, model, contextStore, processInteraction);
                continue;
            }
            const specialResult = await (0, syntaxHandler_1.handleSpecialSyntax)(trimmed);
            if (specialResult.processed) {
                if (specialResult.result) {
                    if (specialResult.type === 'management') {
                        console.log(specialResult.result);
                    }
                    else if (specialResult.isPureReference) {
                        if (specialResult.error) {
                            console.log(chalk_1.default.red(specialResult.result));
                        }
                        else {
                            console.log(chalk_1.default.green(`✓ ${specialResult.result || '已加入上下文'}`));
                        }
                    }
                    else {
                        // 带问题的引用，发送给 AI (注意：processInteraction 内部已处理 errors)
                        await processInteraction(specialResult.result);
                    }
                }
                // 同步本地 contextStore，因为 handleSpecialSyntax 可能修改了持久化上下文
                const updatedPersisted = await (0, contextStorage_1.loadContext)();
                contextStore.import(updatedPersisted);
                continue;
            }
            if (trimmed.startsWith(':exec ')) {
                const cmd = trimmed.slice(6).trim();
                if (cmd) {
                    console.log(chalk_1.default.cyan(`\n⚡️ [Atomic Exec] ${cmd}\n`));
                    rl.pause();
                    try {
                        await (0, shellCompletions_1.executeCommand)(cmd, (code) => {
                            if (code !== 0)
                                console.log(chalk_1.default.red(`Exited with ${code}`));
                        });
                    }
                    finally {
                        rl.resume();
                    }
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
                const list = contextStore.list();
                if (list.length === 0) {
                    console.log(chalk_1.default.gray('📭 当前没有上下文\n'));
                }
                else {
                    console.table(list);
                }
                continue;
            }
            if (trimmed === ':cat' || trimmed.startsWith(':cat ')) {
                const parts = trimmed.split(' ');
                const index = parts.length > 1 ? parseInt(parts[1]) : null;
                const items = contextStore.export();
                if (items.length === 0) {
                    console.log(chalk_1.default.gray('📭 当前没有上下文内容可查阅\n'));
                }
                else if (index !== null) {
                    if (index < 1 || index > items.length) {
                        console.log(chalk_1.default.red(`❌ 索引 ${index} 超出范围 (1-${items.length})\n`));
                    }
                    else {
                        const item = items[index - 1];
                        console.log(chalk_1.default.cyan(`\n=== [${index}] ${item.path} ===`));
                        console.log(item.content);
                        console.log(chalk_1.default.cyan(`=== End ===\n`));
                    }
                }
                else {
                    console.log(chalk_1.default.cyan('\n=== 当前完整上下文内容 ==='));
                    items.forEach((item, i) => {
                        console.log(chalk_1.default.yellow(`\n--- [${i + 1}] ${item.path} ---`));
                        console.log(item.content);
                    });
                    console.log(chalk_1.default.cyan('\n==========================\n'));
                }
                continue;
            }
            if (trimmed === ':clear') {
                contextStore.clear();
                await (0, contextStorage_1.clearContextStorage)();
                console.log(chalk_1.default.yellow('🧹 上下文已清空（含持久化）\n'));
                continue;
            }
            if (trimmed === ':plugins') {
                const plugins = (0, shellCompletions_1.listPlugins)();
                if (plugins.length === 0) {
                    console.log(chalk_1.default.gray('📭 当前没有加载的插件\n'));
                }
                else {
                    console.log(chalk_1.default.cyan('已加载的插件:\n'));
                    plugins.forEach(p => console.log(chalk_1.default.green(`  - ${p}`)));
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
                        console.log(chalk_1.default.cyan(`\n🔄 执行宏: ${macroName}\n`));
                        const success = (0, macros_1.runMacro)(macroName);
                        if (success) {
                            console.log(chalk_1.default.green(`✓ 宏 "${macroName}" 执行完成\n`));
                        }
                        else {
                            console.log(chalk_1.default.red(`✗ 宏 "${macroName}" 不存在或执行失败\n`));
                        }
                    }
                    else {
                        console.log(chalk_1.default.yellow('用法: yuangs macro <name> 或 ygs macro <name>\n'));
                    }
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk_1.default.red(`\n[Macro Error]: ${message}`));
                }
                finally {
                    rl.resume();
                }
                continue;
            }
            // Alternative Zero-Mode entry: :ai command
            if (trimmed === ':ai') {
                rl.pause();
                try {
                    console.log(chalk_1.default.cyan('AI 模式启动...\n'));
                    // Use empty context or current context for AI interaction
                    let finalPrompt = contextStore.isEmpty()
                        ? '你好，请开始对话'
                        : contextAssembler.assemble(contextStore, '你好，请基于以上上下文开始对话');
                    const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
                    const renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);
                    await runtime.run(finalPrompt, 'chat', (chunk) => {
                        renderer.onChunk(chunk);
                    }, model, renderer);
                    const fullResponse = renderer.finish();
                    lastAIOutput = fullResponse;
                    // 同步上下文到全局历史（为了兼容性）
                    (0, client_1.addToConversationHistory)('user', finalPrompt);
                    (0, client_1.addToConversationHistory)('assistant', fullResponse);
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk_1.default.red(`\n[AI execution error]: ${message}`));
                }
                finally {
                    rl.resume();
                }
                continue;
            }
            if (!trimmed) {
                // Empty line + Enter as alternative to ?? for Zero-Mode
                rl.pause();
                try {
                    console.log(chalk_1.default.cyan('AI 模式启动 (空行触发)...\n'));
                    // Use empty context or current context for AI interaction
                    let finalPrompt = contextStore.isEmpty()
                        ? '你好，请开始对话'
                        : contextAssembler.assemble(contextStore, '你好，请基于以上上下文开始对话');
                    const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
                    const renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);
                    await runtime.run(finalPrompt, 'chat', (chunk) => {
                        renderer.onChunk(chunk);
                    }, model, renderer);
                    const fullResponse = renderer.finish();
                    lastAIOutput = fullResponse;
                    // 同步上下文到全局历史（为了兼容性）
                    (0, client_1.addToConversationHistory)('user', finalPrompt);
                    (0, client_1.addToConversationHistory)('assistant', fullResponse);
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk_1.default.red(`\n[AI execution error]: ${message}`));
                }
                finally {
                    rl.resume();
                }
                continue;
            }
            // Check for ?? pattern which could be expanded by shell glob
            if (trimmed === '??' || trimmed.startsWith('?? ')) {
                const globMatches = (0, globDetector_1.wouldExpandAsGlob)('??', process.cwd());
                if (globMatches.wouldExpand) {
                    console.log(chalk_1.default.yellow('⚠️  Zero‑Mode 触发符 \'??\' 在当前目录可能被解释为文件名展开：'));
                    console.log(chalk_1.default.gray('匹配到：'));
                    globMatches.matches.forEach(match => {
                        console.log(chalk_1.default.gray(`- ${match}`));
                    });
                    console.log(chalk_1.default.gray('\n请使用 \':ai\' 或空行 + Enter 进入 Zero‑Mode'));
                    continue; // Skip processing and go to next input
                }
            }
            const mode = (0, shellCompletions_1.detectMode)(trimmed);
            if (mode === 'command') {
                rl.pause();
                try {
                    await (0, shellCompletions_1.executeCommand)(trimmed, (code) => {
                        if (code !== 0) {
                            console.log(chalk_1.default.red(`\n[command exited with code ${code}]\n`));
                        }
                    });
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk_1.default.red(`\n[Command Error]: ${message}`));
                }
                finally {
                    rl.resume();
                }
                continue;
            }
            let finalPrompt = contextStore.isEmpty()
                ? trimmed
                : contextAssembler.assemble(contextStore, trimmed);
            const gitContext = await (0, gitContext_1.getGitContext)();
            if (gitContext) {
                finalPrompt = `
${gitContext}

${finalPrompt}
`;
            }
            try {
                rl.pause();
                // 使用 AgentRuntime 执行提问
                const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
                const renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);
                await runtime.run(finalPrompt, 'chat', (chunk) => {
                    renderer.onChunk(chunk);
                }, model, renderer);
                const fullResponse = renderer.finish();
                lastAIOutput = fullResponse;
                // 同步上下文到全局历史（为了兼容性）
                (0, client_1.addToConversationHistory)('user', finalPrompt);
                (0, client_1.addToConversationHistory)('assistant', fullResponse);
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
/**
 * 管道流水线执行核心引擎
 */
async function runPipeline(input, rl, runtime, model, contextStore, processInteraction) {
    const segments = input.split('|').map(s => s.trim());
    let currentData = undefined;
    try {
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (!segment)
                continue;
            const isLast = i === segments.length - 1;
            currentData = await processPipelineSegment(segment, currentData, isLast, rl, processInteraction);
        }
        // 管道执行完后，同步一下上下文状态
        const updatedPersisted = await (0, contextStorage_1.loadContext)();
        contextStore.import(updatedPersisted);
    }
    catch (err) {
        console.error(chalk_1.default.red(`\n[Pipeline Error]: ${err.message}`));
    }
}
/**
 * 分发并处理单个管道片段
 */
async function processPipelineSegment(segment, upstreamData, isLast, rl, processInteraction) {
    // 1. 尝试处理特殊语法 (@, #, :cat 等)
    const specialResult = await (0, syntaxHandler_1.handleSpecialSyntax)(segment, upstreamData);
    if (specialResult.processed) {
        if (isLast) {
            if (specialResult.result) {
                if (specialResult.type === 'management') {
                    console.log(specialResult.result);
                }
                else if (specialResult.isPureReference) {
                    console.log(chalk_1.default.green(`✓ ${specialResult.result || '已加入上下文'}`));
                }
                else {
                    await processInteraction(specialResult.result);
                }
            }
            return undefined;
        }
        return specialResult.result;
    }
    // 2. 尝试处理 Shell 命令
    const mode = (0, shellCompletions_1.detectMode)(segment);
    if (mode === 'command' || segment.startsWith(':exec ')) {
        const cmd = segment.startsWith(':exec ') ? segment.slice(6).trim() : segment;
        rl.pause();
        try {
            // 如果是最后一段，直接展示输出；否则捕获输出传给下一环
            const output = await (0, shellCompletions_1.executeCommand)(cmd, undefined, upstreamData, !isLast);
            return isLast ? undefined : output;
        }
        finally {
            rl.resume();
        }
    }
    // 3. 兜底逻辑：作为对话文本或 AI 提问
    if (isLast) {
        let finalPrompt = segment;
        if (upstreamData) {
            finalPrompt = `以下是来自上游指令的输入内容：\n\n${upstreamData}\n\n问题：${segment}`;
        }
        await processInteraction(finalPrompt);
        return undefined;
    }
    // 非最后一段的纯文本，作为下一段的输入
    return segment;
}
async function askOnceStream(question, model) {
    const messages = [...(0, client_1.getConversationHistory)()];
    messages.push({ role: 'user', content: question });
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI 正在思考...')).start();
    // 初始化渲染器
    const renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ', spinner, true);
    try {
        await (0, client_1.callAI_Stream)(messages, model, (chunk) => {
            renderer.onChunk(chunk);
        });
        const fullResponse = renderer.finish();
        lastAIOutput = fullResponse;
        (0, client_1.addToConversationHistory)('user', question);
        (0, client_1.addToConversationHistory)('assistant', fullResponse);
    }
    catch (error) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}
//# sourceMappingURL=handleAIChat.js.map