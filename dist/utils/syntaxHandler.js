"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSpecialSyntax = handleSpecialSyntax;
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const fileReader_1 = require("../core/fileReader");
const contextBuffer_1 = require("../commands/contextBuffer");
const contextStorage_1 = require("../commands/contextStorage");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 解析并处理特殊语法（@、#、:ls 等）
 */
async function handleSpecialSyntax(input, stdinData) {
    const trimmed = input.trim();
    // 处理 @ 文件引用语法
    if (trimmed.startsWith('@')) {
        // 检查是否是 @! 立即执行语法
        const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);
        if (immediateExecMatch) {
            const filePath = immediateExecMatch[1].trim();
            return await handleImmediateExec(filePath);
        }
        // 检查是否是带行号的语法 @file:start-end
        const lineRangeMatch = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?\s*(?:\n(.*))?$/s);
        if (lineRangeMatch) {
            const filePath = lineRangeMatch[1];
            const startLine = lineRangeMatch[2] ? parseInt(lineRangeMatch[2]) : null;
            const endLine = lineRangeMatch[3] ? parseInt(lineRangeMatch[3]) : null;
            const question = lineRangeMatch[4] || (stdinData ? `分析以下文件内容：\n\n${stdinData}` : '请分析这个文件');
            return await handleFileReference(filePath.trim(), startLine, endLine, question);
        }
    }
    // 处理 # 目录引用语法
    if (trimmed.startsWith('#')) {
        const dirMatch = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
        if (dirMatch) {
            const dirPath = dirMatch[1].trim();
            const question = dirMatch[2] || (stdinData ? `分析以下目录内容：\n\n${stdinData}` : '请分析这个目录');
            return await handleDirectoryReference(dirPath, question);
        }
    }
    // 处理 :ls 命令
    if (trimmed === ':ls') {
        return await handleListContext();
    }
    // 场景 5.1: :exec 原子执行
    if (trimmed.startsWith(':exec ')) {
        const command = trimmed.slice(6).trim();
        return await handleAtomicExec(command);
    }
    // 处理 :cat [index] 命令
    if (trimmed === ':cat' || trimmed.startsWith(':cat ')) {
        const parts = trimmed.split(' ');
        const index = parts.length > 1 ? parseInt(parts[1]) : null;
        return await handleCatContext(index);
    }
    // 处理 :clear 命令
    if (trimmed === ':clear') {
        return await handleClearContext();
    }
    // 如果不是特殊语法，返回未处理
    return { processed: false };
}
async function handleFileReference(filePath, startLine = null, endLine = null, question) {
    const fullPath = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(fullPath) || !fs_1.default.statSync(fullPath).isFile()) {
        return {
            processed: true,
            result: `错误: 文件 "${filePath}" 不存在或不是一个文件`
        };
    }
    try {
        let content = fs_1.default.readFileSync(fullPath, 'utf-8');
        // 如果指定了行号范围，则提取相应行
        if (startLine !== null) {
            const lines = content.split('\n');
            // 验证行号范围
            if (startLine < 1 || startLine > lines.length) {
                return {
                    processed: true,
                    result: `错误: 起始行号 ${startLine} 超出文件范围 (文件共有 ${lines.length} 行)`
                };
            }
            const startIdx = startLine - 1; // 转换为数组索引（从0开始）
            let endIdx = endLine ? Math.min(endLine, lines.length) : lines.length; // 如果未指定结束行，则到文件末尾
            if (endLine && (endLine < startLine || endLine > lines.length)) {
                return {
                    processed: true,
                    result: `错误: 结束行号 ${endLine} 超出有效范围 (应在 ${startLine}-${lines.length} 之间)`
                };
            }
            // 提取指定范围的行
            content = lines.slice(startIdx, endIdx).join('\n');
        }
        const contentMap = new Map();
        contentMap.set(filePath, content);
        const prompt = (0, fileReader_1.buildPromptWithFileContent)(`文件: ${filePath}${startLine !== null ? `:${startLine}${endLine ? `-${endLine}` : ''}` : ''}`, [filePath], contentMap, question || `请分析文件: ${filePath}`);
        return { processed: true, result: prompt };
    }
    catch (error) {
        return {
            processed: true,
            result: `读取文件失败: ${error}`
        };
    }
}
async function handleDirectoryReference(dirPath, question) {
    const fullPath = path_1.default.resolve(dirPath);
    if (!fs_1.default.existsSync(fullPath) || !fs_1.default.statSync(fullPath).isDirectory()) {
        return {
            processed: true,
            result: `错误: 目录 "${dirPath}" 不存在或不是一个目录`
        };
    }
    try {
        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;
        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);
        if (filePaths.length === 0) {
            return {
                processed: true,
                result: `目录 "${dirPath}" 下没有文件`
            };
        }
        const contentMap = (0, fileReader_1.readFilesContent)(filePaths);
        const prompt = (0, fileReader_1.buildPromptWithFileContent)(`目录: ${dirPath}\n找到 ${filePaths.length} 个文件`, filePaths.map(p => path_1.default.relative(process.cwd(), p)), contentMap, question);
        return { processed: true, result: prompt };
    }
    catch (error) {
        return {
            processed: true,
            result: `读取目录失败: ${error}`
        };
    }
}
async function handleImmediateExec(filePath) {
    const fullPath = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(fullPath)) {
        return {
            processed: true,
            result: `错误: 文件 "${filePath}" 不存在`
        };
    }
    try {
        // 1. 读取脚本内容
        const content = fs_1.default.readFileSync(fullPath, 'utf-8');
        console.log(chalk_1.default.gray(`正在执行 ${filePath} 并捕获输出...`));
        // 2. 执行脚本
        // 注意：这里使用 execAsync 捕获输出
        const { stdout, stderr } = await execAsync(`chmod +x "${fullPath}" && "${fullPath}"`, { cwd: process.cwd() });
        // 3. 构造组合上下文 (契约要求：命令内容 + 实际输出)
        const combinedContext = `
=== 脚本内容 (${filePath}) ===
\`\`\`bash
${content}
\`\`\`

=== 执行标准输出 (stdout) ===
\`\`\`
${stdout}
\`\`\`

=== 执行标准错误 (stderr) ===
\`\`\`
${stderr}
\`\`\`
`;
        // 持久化到上下文
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        const persisted = await (0, contextStorage_1.loadContext)();
        contextBuffer.import(persisted);
        contextBuffer.add({
            type: 'file',
            path: `${filePath} (Runtime Log)`,
            content: combinedContext,
            summary: '包含脚本源码和执行后的输出日志'
        });
        await (0, contextStorage_1.saveContext)(contextBuffer.export());
        // 返回给 AI 的 Prompt
        const result = `我执行了脚本 ${filePath}。\n以下是脚本源码和执行输出：\n${combinedContext}\n\n请分析为何会出现上述输出（特别是错误信息）？`;
        return { processed: true, result };
    }
    catch (error) {
        const errorMsg = error.message || String(error);
        const result = `执行脚本 ${filePath} 时发生错误：\n${errorMsg}\n\n请分析原因。`;
        return { processed: true, result };
    }
}
async function handleAtomicExec(command) {
    console.log(chalk_1.default.cyan(`\n⚡️ [Atomic Exec] 执行命令: ${command}\n`));
    try {
        // 对于原子执行，我们希望用户能实时看到输出，所以用 inherit
        const { spawn } = require('child_process');
        const child = spawn(command, {
            shell: true,
            stdio: 'inherit'
        });
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Exit code ${code}`));
            });
            child.on('error', reject);
        });
        // 原子执行不将结果传给 AI，直接返回空结果表示处理完成
        return { processed: true, result: '' };
    }
    catch (error) {
        console.error(chalk_1.default.red(`执行失败: ${error}`));
        return { processed: true, result: '' };
    }
}
async function handleListContext() {
    try {
        const persisted = await (0, contextStorage_1.loadContext)();
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        contextBuffer.import(persisted);
        if (contextBuffer.isEmpty()) {
            return { processed: true, result: '当前没有上下文' };
        }
        const list = contextBuffer.list();
        let result = '当前上下文列表：\n';
        list.forEach((item, index) => {
            result += `${index + 1}. ${item.type}: ${item.path} (${item.tokens} tokens)\n`;
        });
        return { processed: true, result };
    }
    catch (error) {
        return {
            processed: true,
            result: `读取上下文失败: ${error}`
        };
    }
}
async function handleCatContext(index) {
    try {
        const persisted = await (0, contextStorage_1.loadContext)();
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        contextBuffer.import(persisted);
        if (contextBuffer.isEmpty()) {
            return { processed: true, result: '当前没有上下文' };
        }
        const items = contextBuffer.export();
        if (index !== null) {
            // 查看指定索引
            if (index < 1 || index > items.length) {
                return { processed: true, result: `错误: 索引 ${index} 超出范围 (共有 ${items.length} 个项目)` };
            }
            const item = items[index - 1];
            return {
                processed: true,
                result: `--- [${index}] ${item.type}: ${item.path} ---\n${item.content}\n--- End ---`
            };
        }
        else {
            // 查看全部
            let result = '=== 当前完整上下文内容 ===\n\n';
            items.forEach((item, i) => {
                result += `--- [${i + 1}] ${item.type}: ${item.path} ---\n${item.content}\n\n`;
            });
            result += '==========================';
            return { processed: true, result };
        }
    }
    catch (error) {
        return {
            processed: true,
            result: `读取上下文失败: ${error}`
        };
    }
}
async function handleClearContext() {
    try {
        // 清除持久化存储
        await (0, contextStorage_1.saveContext)([]);
        return { processed: true, result: '上下文已清空（含持久化）' };
    }
    catch (error) {
        return {
            processed: true,
            result: `清除上下文失败: ${error}`
        };
    }
}
//# sourceMappingURL=syntaxHandler.js.map