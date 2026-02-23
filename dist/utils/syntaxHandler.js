"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSpecialSyntax = handleSpecialSyntax;
exports.tokenizeWithQuotes = tokenizeWithQuotes;
exports.resolveFilePathsAndQuestion = resolveFilePathsAndQuestion;
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const fileReader_1 = require("../core/fileReader");
const contextBuffer_1 = require("../commands/contextBuffer");
const contextStorage_1 = require("../commands/contextStorage");
const renderer_1 = require("./renderer");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 解析并处理特殊语法（@、#、:ls 等）
 */
const MAX_FILE_TOKENS = 10000;
const CONTEXT_MAX_TOKENS = 100000;
async function handleSpecialSyntax(input, stdinData) {
    const trimmed = input.trim();
    // 处理 @ 文件引用语法
    if (trimmed.startsWith("@")) {
        // 如果是 @ 开头的语法，跳转到独立的处理器
        return await handleAtSyntax(trimmed, stdinData);
    }
    // 处理 # 目录引用语法
    // 支持两种格式：
    //   1. `#folder\n问题`    (换行分隔，旧格式)
    //   2. `#folder 问题`     (空格分隔，自然输入格式)
    if (trimmed.startsWith("#")) {
        // 先尝试换行分隔格式（优先级更高，避免目录名含空格时误判）
        const newlineDirMatch = trimmed.match(/^#\s*(.+?)\s*\n(.*)$/s);
        if (newlineDirMatch) {
            const dirPath = newlineDirMatch[1].trim();
            const question = newlineDirMatch[2].trim() ||
                (stdinData ? `分析以下目录内容：\n\n${stdinData}` : undefined);
            const hasQuestion = !!question || !!stdinData;
            const res = await handleDirectoryReference(dirPath, question);
            return {
                ...res,
                isPureReference: !hasQuestion,
                type: "directory",
            };
        }
        // 空格分隔格式：取 # 后的内容，按第一个空白切分为「路径」和「问题」
        // 策略：第一个空格前视为目录路径，之后视为问题
        const afterHash = trimmed.slice(1).trim(); // 去掉 # 前缀
        const spaceIdx = afterHash.search(/\s/); // 第一个空白符位置
        let candidatePath;
        let inlineQuestion;
        if (spaceIdx === -1) {
            // 没有空格：整体视为目录路径，无问题
            candidatePath = afterHash;
            inlineQuestion = undefined;
        }
        else {
            // 有空格：切分为路径 + 问题
            candidatePath = afterHash.slice(0, spaceIdx).trim();
            inlineQuestion = afterHash.slice(spaceIdx).trim() || undefined;
        }
        if (!candidatePath) {
            return { processed: false };
        }
        // 检查目录路径是否真实存在于磁盘
        const candidateFullPath = path_1.default.resolve(candidatePath);
        let diskExists = false;
        try {
            diskExists = fs_1.default.statSync(candidateFullPath).isDirectory();
        }
        catch {
            diskExists = false;
        }
        if (diskExists) {
            // ✅ 目录存在：candidatePath 是合法目录，inlineQuestion 是可选问题
            const question = inlineQuestion ||
                (stdinData ? `分析以下目录内容：\n\n${stdinData}` : undefined);
            const hasQuestion = !!question || !!stdinData;
            const res = await handleDirectoryReference(candidatePath, question);
            return {
                ...res,
                isPureReference: !hasQuestion,
                type: "directory",
            };
        }
        else if (!inlineQuestion) {
            // 目录不存在，且无内联问题：整体直接传给 handleDirectoryReference（路径可能含空格）
            const res = await handleDirectoryReference(candidatePath, stdinData ? `分析以下目录内容：\n\n${stdinData}` : undefined);
            return {
                ...res,
                isPureReference: !stdinData,
                type: "directory",
            };
        }
        else {
            // 目录不存在，且有内联问题：给出明确错误提示
            return {
                processed: true,
                result: `错误: 目录 "${candidatePath}" 不存在或不是一个目录\n💡 提示: 使用格式 #目录路径 问题，例如: #src 解释这个文件夹的作用`,
                error: true,
                isPureReference: false,
                type: "directory",
            };
        }
    }
    // 处理 :ls 命令
    if (trimmed === ":ls") {
        const res = await handleListContext();
        return { ...res, type: "management" };
    }
    // 场景 5.1: :exec 原子执行
    if (trimmed.startsWith(":exec ")) {
        const command = trimmed.slice(6).trim();
        const res = await handleAtomicExec(command);
        return { ...res, type: "command" };
    }
    // 处理 :cat [index] 命令 (支持 :cat index:start-end)
    if (trimmed === ":cat" || trimmed.startsWith(":cat ")) {
        const spec = trimmed.slice(4).trim();
        if (!spec) {
            const res = await handleCatContext(null);
            return { ...res, type: "management" };
        }
        const parsed = parseCatSpec(spec);
        if (parsed.error) {
            return {
                processed: true,
                result: parsed.error,
                error: true,
                type: "management",
            };
        }
        const res = await handleCatContext(parsed.index, parsed.startLine, parsed.endLine);
        return { ...res, type: "management" };
    }
    // 处理 :clear 命令
    if (trimmed === ":clear") {
        const res = await handleClearContext();
        return { ...res, type: "management" };
    }
    // 如果不是特殊语法，返回未处理
    return { processed: false };
}
/**
 * 解析 :cat 命名的参数定义 (如 "1:10-20")
 */
function parseCatSpec(spec) {
    // 兼容只有数字的情况
    if (/^\d+$/.test(spec)) {
        return { index: parseInt(spec), startLine: null, endLine: null };
    }
    const match = spec.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?$/);
    if (!match) {
        return {
            index: null,
            startLine: null,
            endLine: null,
            error: `错误: 无效的索引格式 "${spec}"。请使用 :cat index 或 :cat index:start-end (例如 :cat 1:10-20)`,
        };
    }
    const index = parseInt(match[1]);
    const startLine = match[2] ? parseInt(match[2]) : null;
    const endLine = match[3] ? parseInt(match[3]) : null;
    if (isNaN(index)) {
        return {
            index: null,
            startLine: null,
            endLine: null,
            error: `错误: 索引 "${match[1]}" 不是有效的数字`,
        };
    }
    return { index, startLine, endLine };
}
/**
 * 引号感知的令牌解析器 (Tokenizer)
 * 用于解析包含空格、引号及转义字符的复杂路径列表。
 *
 * 行为特性：
 * 1. 支持使用 ' 或 " 包裹路径，支持内部嵌套转义。
 * 2. 自动修剪非引号部分的空格。
 * 3. 容错处理：若引号未闭合，自动将剩余全量内容视为一个带引号的 Token。
 */
function tokenizeWithQuotes(input) {
    const tokens = [];
    const isQuoted = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
        }
        else if (inQuotes && char === quoteChar) {
            inQuotes = false;
            tokens.push(current);
            isQuoted.push(true);
            current = "";
        }
        else if (!inQuotes && (char === "," || char === "，" || char === " ")) {
            if (current) {
                tokens.push(current.trim());
                isQuoted.push(false);
                current = "";
            }
        }
        else {
            current += char;
        }
    }
    if (current || inQuotes) {
        tokens.push(current.trim());
        isQuoted.push(inQuotes);
    }
    return { tokens, isQuoted };
}
/**
 * 处理 @ 语法的独立函数
 */
async function handleAtSyntax(trimmed, stdinData) {
    // 1. @! 立即执行语法
    const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);
    if (immediateExecMatch) {
        const filePath = immediateExecMatch[1].trim();
        return await handleImmediateExec(filePath);
    }
    // 2. @filename:command 语法 (添加文件并执行命令)
    const fileExecMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^0-9\s].*)$/);
    if (fileExecMatch) {
        const filePath = fileExecMatch[1].trim();
        const command = fileExecMatch[2].trim();
        return await handleFileAndCommand(filePath, command);
    }
    // 3. 带行号或批量引用的语法 @file:start-end as alias (优化正则，非贪婪捕获路径部分)
    // 路径部分 ([^\s\n]+) 不应包含空格，遇到空格、换行或 as 则认为路径结束
    const lineRangeMatch = trimmed.match(/^@\s*([^\s\n]+)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+([^\s\n]+))?\s*(.*)$/s);
    if (lineRangeMatch) {
        const rawPart = lineRangeMatch[1].trim();
        const startLine = lineRangeMatch[2] ? parseInt(lineRangeMatch[2]) : null;
        const endLine = lineRangeMatch[3] ? parseInt(lineRangeMatch[3]) : null;
        const alias = lineRangeMatch[4];
        let question = lineRangeMatch[5]?.trim() ||
            (stdinData ? `分析以下内容：\n\n${stdinData}` : undefined);
        const { filePaths, extraQuestion } = await resolveFilePathsAndQuestion(rawPart);
        if (extraQuestion) {
            question = question ? `${extraQuestion}\n\n${question}` : extraQuestion;
        }
        const hasQuestion = !!question || !!stdinData;
        if (filePaths.length > 1) {
            let warningPrefix = "";
            if (alias) {
                warningPrefix += chalk_1.default.yellow("⚠️ 警告: 别名 (alias) 仅支持单个文件引用，当前多个文件引用将忽略别名。\n");
            }
            if (startLine !== null) {
                warningPrefix += chalk_1.default.yellow("⚠️ 警告: 行号范围仅支持单个文件引用，当前多个文件引用将忽略行号范围。\n");
            }
            const res = await handleMultipleFileReferences(filePaths, question, !hasQuestion);
            return {
                ...res,
                result: warningPrefix + res.result,
                isPureReference: !hasQuestion,
                type: "file",
            };
        }
        else if (filePaths.length === 1) {
            const res = await handleFileReference(filePaths[0], startLine, endLine, question, alias, !hasQuestion);
            return {
                ...res,
                isPureReference: !hasQuestion,
                type: "file",
            };
        }
        else {
            return {
                processed: true,
                result: `错误: 未找到有效的文件或序号引用 "${rawPart}"`,
                error: true,
            };
        }
    }
    return { processed: false };
}
/**
 * 解析增强的路径语法 (识别路径列表与同行提问)
 *
 * 💡 识别优先级与规则 (Heuristic Rules):
 * 1. 引号包裹: 只要被 "" 或 '' 包裹，一律视为文件路径 (支持空格)。
 * 2. 范围语法: 符合 n-m 格式且为数字，视为上下文序号范围。
 * 3. 磁盘存在: 如果字符串在当前工作目录真实存在 (文件或目录)，视为路径。
 *    - 注意：如果文件名叫 "1" 且磁盘存在，它会覆盖序号 1 的语义 (文件优先)。
 * 4. 上下文索引: 如果是纯数字且在当前 ContextBuffer 范围内，视为序号引用。
 * 5. 提问边界: 遇到第一个不满足上述任何条件的单词时，该单词及其后内容均识别为提问。
 */
async function resolveFilePathsAndQuestion(input) {
    const persisted = await (0, contextStorage_1.loadContext)();
    const filePaths = [];
    // 1. 获取初步 Token
    const { tokens, isQuoted } = tokenizeWithQuotes(input);
    let questionStartIndex = -1;
    // 2. 预先并行检查所有 Token 的磁盘状态，避免循环中同步 I/O
    const stats = await Promise.all(tokens.map(async (t, i) => {
        if (isQuoted[i])
            return { exists: true }; // 引号包裹强制视为路径
        try {
            const fullPath = path_1.default.resolve(t);
            await fs_1.default.promises.access(fullPath, fs_1.default.constants.F_OK);
            return { exists: true };
        }
        catch {
            return { exists: false };
        }
    }));
    // 3. 扫描识别边界
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const quoted = isQuoted[i];
        const existsOnDisk = stats[i].exists;
        if (quoted)
            continue;
        const isRange = /^\d+-\d+$/.test(token);
        const isIndex = !isNaN(parseInt(token)) &&
            parseInt(token) > 0 &&
            parseInt(token) <= persisted.length;
        // 【智能边界识别】即便没有空格，如果 token 开头是序号但后面跟着非数字(如 @1分析)，也要切分
        // 或者当前的 token 本身就不可识别为路径/索引
        if (!existsOnDisk) {
            if (isRange || isIndex) {
                continue;
            }
            // 如果 token 开头是数字但包含非数字字符，且不是范围，尝试二次切分 (处理 @1分析 这种 Case)
            const numMatch = token.match(/^(\d+)(.+)$/);
            if (numMatch && parseInt(numMatch[1]) <= persisted.length) {
                // 这是一个混合 Token，我们需要重构 tokens 数组（较复杂，此处采用简化的截断策略）
                questionStartIndex = i;
                break;
            }
            // 既不是物理路径，也不是范围/序号 -> 提问开始
            questionStartIndex = i;
            break;
        }
    }
    let pathTokens = tokens;
    let pathStats = stats;
    let extraQuestion;
    if (questionStartIndex !== -1) {
        pathTokens = tokens.slice(0, questionStartIndex);
        pathStats = stats.slice(0, questionStartIndex);
        extraQuestion = tokens.slice(questionStartIndex).join(" ");
    }
    // 4. 解析确定的路径部分
    for (let i = 0; i < pathTokens.length; i++) {
        const part = pathTokens[i];
        const existsOnDisk = pathStats[i].exists;
        // A. 物理路径 (磁盘存在) 或强制路径 (带有引号)
        // 优先级最高：磁盘上真的有这个文件，直接用路径
        if (existsOnDisk || isQuoted[i]) {
            filePaths.push(part);
            continue;
        }
        // B. 范围语法: 1-5
        const rangeMatch = part.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
            const start = Math.min(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
            const end = Math.max(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
            for (let j = start; j <= end; j++) {
                if (j > 0 && j <= persisted.length) {
                    filePaths.push(persisted[j - 1].path);
                }
            }
            continue;
        }
        // C. 上下文序号: 1
        const idx = parseInt(part);
        if (!isNaN(idx) && idx > 0 && idx <= persisted.length) {
            filePaths.push(persisted[idx - 1].path);
            continue;
        }
    }
    return {
        filePaths: [...new Set(filePaths)],
        extraQuestion,
    };
}
/**
 * 批量处理多个文件引用 (异步并行版)
 */
async function handleMultipleFileReferences(filePaths, question, isPureReference = false) {
    const contextBuffer = new contextBuffer_1.ContextBuffer();
    const persisted = await (0, contextStorage_1.loadContext)();
    contextBuffer.import(persisted);
    const contentMap = new Map();
    const addedFiles = [];
    const warningList = [];
    // 并行读取文件
    const readPromises = filePaths.map(async (filePath) => {
        const fullPath = path_1.default.resolve(filePath);
        try {
            await fs_1.default.promises.access(fullPath, fs_1.default.constants.F_OK);
            const content = await fs_1.default.promises.readFile(fullPath, "utf-8");
            return { filePath, content, success: true };
        }
        catch (e) {
            return { filePath, success: false, error: e.message };
        }
    });
    const results = await Promise.all(readPromises);
    for (const res of results) {
        if (res.success && res.content !== undefined) {
            contentMap.set(res.filePath, res.content);
            contextBuffer.add({
                type: "file",
                path: res.filePath,
                content: res.content,
            });
            addedFiles.push(res.filePath);
        }
        else {
            warningList.push(`警告: 跳过 "${res.filePath}": ${res.error}`);
        }
    }
    const warnings = warningList.length > 0 ? warningList.join("\n") + "\n" : "";
    if (addedFiles.length === 0) {
        return {
            processed: true,
            result: warnings || "❌ 未找到任何有效的文件引用",
            error: true,
        };
    }
    await (0, contextStorage_1.saveContext)(contextBuffer.export());
    if (isPureReference) {
        return {
            processed: true,
            result: `${warnings}✅ 已将 ${addedFiles.length} 个文件加入上下文：\n${addedFiles.map((f) => `  • ${f}`).join("\n")}`,
        };
    }
    const prompt = (0, fileReader_1.buildPromptWithFileContent)(`引用了 ${addedFiles.length} 个文件`, addedFiles, contentMap, question || "请分析以上文件");
    return { processed: true, result: warnings + prompt };
}
async function handleFileReference(filePath, startLine = null, endLine = null, question, alias, isPureReference = false) {
    const fullPath = path_1.default.resolve(filePath);
    try {
        await fs_1.default.promises.access(fullPath, fs_1.default.constants.F_OK);
        const stats = await fs_1.default.promises.stat(fullPath);
        if (!stats.isFile())
            throw new Error("不是一个文件");
        let content = await fs_1.default.promises.readFile(fullPath, "utf-8");
        // 如果指定了行号范围，则提取相应行
        if (startLine !== null) {
            const lines = content.split("\n");
            if (startLine < 1 || startLine > lines.length) {
                return {
                    processed: true,
                    result: `错误: 起始行号 ${startLine} 超出文件范围 (文件共有 ${lines.length} 行)`,
                };
            }
            const startIdx = startLine - 1;
            let endIdx = endLine ? Math.min(endLine, lines.length) : lines.length;
            if (endLine && (endLine < startLine || endLine > lines.length)) {
                return {
                    processed: true,
                    result: `错误: 结束行号 ${endLine} 超出有效范围 (应在 ${startLine}-${lines.length} 之间)`,
                };
            }
            content = lines.slice(startIdx, endIdx).join("\n");
        }
        const contentMap = new Map();
        contentMap.set(filePath, content);
        // 持久化到上下文
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        const persisted = await (0, contextStorage_1.loadContext)();
        contextBuffer.import(persisted);
        contextBuffer.add({
            type: "file",
            path: filePath +
                (startLine !== null
                    ? `:${startLine}${endLine ? `-${endLine}` : ""}`
                    : ""),
            content: content,
            alias: alias,
        });
        await (0, contextStorage_1.saveContext)(contextBuffer.export());
        if (isPureReference) {
            return { processed: true, result: `✅ 已将文件 ${filePath} 加入上下文` };
        }
        const prompt = (0, fileReader_1.buildPromptWithFileContent)(`文件: ${filePath}${startLine !== null ? `:${startLine}${endLine ? `-${endLine}` : ""}` : ""}`, [filePath], contentMap, question || `请分析文件: ${filePath}`);
        return { processed: true, result: prompt };
    }
    catch (error) {
        return {
            processed: true,
            result: `错误: 无法处理文件 "${filePath}": ${error.message}`,
            error: true,
        };
    }
}
async function handleDirectoryReference(dirPath, question) {
    const fullPath = path_1.default.resolve(dirPath);
    if (!fs_1.default.existsSync(fullPath) || !fs_1.default.statSync(fullPath).isDirectory()) {
        return {
            processed: true,
            result: `错误: 目录 "${dirPath}" 不存在或不是一个目录`,
        };
    }
    try {
        const findCommand = process.platform === "darwin" || process.platform === "linux"
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;
        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout
            .trim()
            .split("\n")
            .filter((f) => f);
        if (filePaths.length === 0) {
            return {
                processed: true,
                result: `目录 "${dirPath}" 下没有文件`,
            };
        }
        const contentMap = await (0, fileReader_1.readFilesContent)(filePaths, {
            showProgress: true,
            concurrency: 5,
        });
        // 持久化到上下文
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        const persisted = await (0, contextStorage_1.loadContext)();
        contextBuffer.import(persisted);
        let successfullyAddedCount = 0;
        let totalOriginalTokens = 0;
        for (const [filePath, content] of contentMap) {
            const tokens = Math.ceil(content.length / 4);
            totalOriginalTokens += tokens;
            // 如果单个文件太大，跳过它以免撑爆上下文
            if (tokens > MAX_FILE_TOKENS) {
                continue;
            }
            contextBuffer.add({
                type: "file",
                path: filePath,
                content: content,
            });
            successfullyAddedCount++;
        }
        if (successfullyAddedCount === 0 && filePaths.length > 0) {
            return {
                processed: true,
                result: `错误: 目录 "${dirPath}" 中的文件都太大，无法加入上下文`,
                error: true,
            };
        }
        await (0, contextStorage_1.saveContext)(contextBuffer.export());
        return {
            processed: true,
            result: `已成功加入 ${successfullyAddedCount} 个文件到上下文 (共找到 ${filePaths.length} 个文件)`,
            itemCount: successfullyAddedCount,
        };
    }
    catch (error) {
        return {
            processed: true,
            result: `错误: 读取目录失败: ${error}`,
            error: true,
        };
    }
}
async function handleImmediateExec(filePath) {
    const fullPath = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(fullPath)) {
        return {
            processed: true,
            result: `错误: 文件 "${filePath}" 不存在`,
        };
    }
    try {
        // 1. 读取脚本内容
        const content = fs_1.default.readFileSync(fullPath, "utf-8");
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
            type: "file",
            path: `${filePath} (Runtime Log)`,
            content: combinedContext,
            summary: "包含脚本源码和执行后的输出日志",
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
        const { spawn } = require("child_process");
        const child = spawn(command, {
            shell: true,
            stdio: "inherit",
        });
        await new Promise((resolve, reject) => {
            child.on("close", (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Exit code ${code}`));
            });
            child.on("error", reject);
        });
        // 原子执行不将结果传给 AI，直接返回空结果表示处理完成
        return { processed: true, result: "" };
    }
    catch (error) {
        console.error(chalk_1.default.red(`执行失败: ${error}`));
        return { processed: true, result: "" };
    }
}
async function handleListContext() {
    try {
        const persisted = await (0, contextStorage_1.loadContext)();
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        contextBuffer.import(persisted);
        if (contextBuffer.isEmpty()) {
            return { processed: true, result: "当前没有上下文" };
        }
        const list = contextBuffer.list();
        // 格式化时间显示
        const formatAge = (ageMin) => {
            if (ageMin < 1)
                return "刚刚";
            if (ageMin < 60)
                return `${ageMin}分钟前`;
            const hours = Math.floor(ageMin / 60);
            if (hours < 24)
                return `${hours}小时前`;
            const days = Math.floor(hours / 24);
            return `${days}天前`;
        };
        // 格式化重要度显示
        const formatImportance = (importance) => {
            const value = parseFloat(importance);
            if (value >= 0.8)
                return chalk_1.default.red("★★★");
            if (value >= 0.6)
                return chalk_1.default.yellow("★★☆");
            if (value >= 0.4)
                return chalk_1.default.green("★☆☆");
            return chalk_1.default.gray("☆☆☆");
        };
        // 列宽常量定义
        const IMPORTANCE_WIDTH = 6; // "重要度"文本宽度
        const AGE_WIDTH = 10;
        const TOKENS_WIDTH = 6;
        const PINNED_WIDTH = 2; // 📌 表情占 2 个字符位
        const MAX_PATH_DISPLAY_WIDTH = 40;
        // 计算动态列宽
        const maxIndexWidth = Math.max(String(list.length).length, 1);
        const maxTypeWidth = Math.max(...list.map((item) => item.type.length), 4);
        const pathColWidth = Math.min(Math.max(...list.map((item) => item.path.length), 4), MAX_PATH_DISPLAY_WIDTH);
        // 构建表格边框
        const header = `┌${"─".repeat(maxIndexWidth + 2)}┬${"─".repeat(PINNED_WIDTH + 2)}┬${"─".repeat(maxTypeWidth + 2)}┬${"─".repeat(pathColWidth + 2)}┬${"─".repeat(IMPORTANCE_WIDTH + 2)}┬${"─".repeat(AGE_WIDTH + 2)}┬${"─".repeat(TOKENS_WIDTH + 2)}┐`;
        const separator = `├${"─".repeat(maxIndexWidth + 2)}┼${"─".repeat(PINNED_WIDTH + 2)}┼${"─".repeat(maxTypeWidth + 2)}┼${"─".repeat(pathColWidth + 2)}┼${"─".repeat(IMPORTANCE_WIDTH + 2)}┼${"─".repeat(AGE_WIDTH + 2)}┼${"─".repeat(TOKENS_WIDTH + 2)}┤`;
        const footer = `└${"─".repeat(maxIndexWidth + 2)}┴${"─".repeat(PINNED_WIDTH + 2)}┴${"─".repeat(maxTypeWidth + 2)}┴${"─".repeat(pathColWidth + 2)}┴${"─".repeat(IMPORTANCE_WIDTH + 2)}┴${"─".repeat(AGE_WIDTH + 2)}┴${"─".repeat(TOKENS_WIDTH + 2)}┘`;
        // 表头
        const headerRow = `│ ${chalk_1.default.bold("#".padEnd(maxIndexWidth))} │ ${chalk_1.default.bold("📌".padEnd(PINNED_WIDTH))} │ ${chalk_1.default.bold("Type".padEnd(maxTypeWidth))} │ ${chalk_1.default.bold("Path".padEnd(pathColWidth))} │ ${chalk_1.default.bold("重要度")} │ ${chalk_1.default.bold("添加时间".padEnd(AGE_WIDTH))} │ ${chalk_1.default.bold("Tokens".padEnd(TOKENS_WIDTH))} │`;
        let result = chalk_1.default.cyan.bold("📋 当前上下文列表\n\n");
        result += chalk_1.default.blue.dim(header) + "\n";
        result += headerRow + "\n";
        result += chalk_1.default.blue.dim(separator) + "\n";
        // 行内虚线分隔符 (使用更清晰的蓝色和更饱满的字符)
        const rowSeparator = `├${"┈".repeat(maxIndexWidth + 2)}┼${"┈".repeat(PINNED_WIDTH + 2)}┼${"┈".repeat(maxTypeWidth + 2)}┼${"┈".repeat(pathColWidth + 2)}┼${"┈".repeat(IMPORTANCE_WIDTH + 2)}┼${"┈".repeat(AGE_WIDTH + 2)}┼${"┈".repeat(TOKENS_WIDTH + 2)}┤`;
        // 数据行
        list.forEach((item, index) => {
            const indexStr = String(index + 1).padEnd(maxIndexWidth);
            const pinnedStr = (item.pinned ? "📌" : "  ").padEnd(PINNED_WIDTH);
            const typeStr = item.type.padEnd(maxTypeWidth);
            // 路径截断处理
            let pathStr = item.path;
            if (pathStr.length > MAX_PATH_DISPLAY_WIDTH) {
                pathStr = "..." + pathStr.slice(-(MAX_PATH_DISPLAY_WIDTH - 3));
            }
            pathStr = pathStr.padEnd(pathColWidth);
            const importanceStr = formatImportance(item.importance);
            const ageStr = formatAge(item.ageMin).padEnd(AGE_WIDTH);
            const tokensStr = String(item.tokens).padStart(TOKENS_WIDTH);
            // 根据类型着色
            let typeColor = chalk_1.default.cyan;
            if (item.type === "memory")
                typeColor = chalk_1.default.magenta;
            if (item.type === "antipattern")
                typeColor = chalk_1.default.red;
            result += `│ ${chalk_1.default.yellow(indexStr)} │ ${pinnedStr} │ ${typeColor(typeStr)} │ ${chalk_1.default.white(pathStr)} │ ${importanceStr} │ ${chalk_1.default.gray(ageStr)} │ ${chalk_1.default.green(tokensStr)} │\n`;
            // 如果不是最后一行，添加虚线分隔符
            if (index < list.length - 1) {
                result += chalk_1.default.blue.dim(rowSeparator) + "\n";
            }
        });
        result += chalk_1.default.blue.dim(footer);
        // 统计信息（单行）
        const totalTokens = list.reduce((sum, item) => sum + item.tokens, 0);
        const pinnedCount = list.filter((item) => item.pinned).length;
        const memoryCount = list.filter((item) => item.type === "memory").length;
        result += `\n\n${chalk_1.default.cyan("📊")} ${chalk_1.default.gray("总计:")} ${chalk_1.default.yellow(list.length)} ${chalk_1.default.gray("|")} ${chalk_1.default.gray("固定:")} ${chalk_1.default.yellow(pinnedCount)} ${chalk_1.default.gray("|")} ${chalk_1.default.gray("记忆:")} ${chalk_1.default.magenta(memoryCount)} ${chalk_1.default.gray("|")} ${chalk_1.default.gray("Token:")} ${chalk_1.default.green(totalTokens.toLocaleString())}`;
        return { processed: true, result };
    }
    catch (error) {
        return {
            processed: true,
            result: `读取上下文失败: ${error}`,
        };
    }
}
async function handleCatContext(index, startLine = null, endLine = null) {
    try {
        const persisted = await (0, contextStorage_1.loadContext)();
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        contextBuffer.import(persisted);
        if (contextBuffer.isEmpty()) {
            return { processed: true, result: "当前没有上下文" };
        }
        const items = contextBuffer.export();
        if (index !== null) {
            // 查看指定索引
            if (index < 1 || index > items.length) {
                return {
                    processed: true,
                    result: `错误: 索引 ${index} 超出范围 (共有 ${items.length} 个项目)`,
                };
            }
            const item = items[index - 1];
            let content = item.content || "(无内容)";
            // 获取语言提示 (使用增强的识别逻辑)
            const lang = getLanguageByPath(item.path);
            // 行号切片
            if (startLine !== null) {
                const lines = content.split("\n");
                // 边界校验：起始行号归一化 (不允许小于 1)
                const clampedStart = Math.max(1, startLine);
                const startIdx = clampedStart - 1;
                // 边界校验：结束行号处理
                let endIdx = lines.length;
                if (endLine !== null) {
                    if (endLine < clampedStart) {
                        return {
                            processed: true,
                            result: `错误: 结束行号 ${endLine} 不能小于起始行号 ${clampedStart}`,
                        };
                    }
                    endIdx = Math.min(endLine, lines.length);
                }
                if (startIdx >= lines.length) {
                    return {
                        processed: true,
                        result: `错误: 起始行号 ${startLine} 超出范围 (该文件共有 ${lines.length} 行)`,
                    };
                }
                content = lines.slice(startIdx, endIdx).join("\n");
                const rangeLabel = endLine
                    ? `${clampedStart}-${endIdx}`
                    : `${clampedStart}-末尾`;
                // 渲染高亮内容
                const highlighted = (0, renderer_1.renderMarkdown)(`\`\`\`${lang}\n${content}\n\`\`\``);
                return {
                    processed: true,
                    result: `${chalk_1.default.blue.bold(`--- [${index}] ${item.type}: ${item.path} (第 ${rangeLabel} 行) ---`)}\n${highlighted}\n${chalk_1.default.blue.bold("--- End ---")}`,
                };
            }
            // 渲染完整内容的高亮
            const highlighted = (0, renderer_1.renderMarkdown)(`\`\`\`${lang}\n${content}\n\`\`\``);
            return {
                processed: true,
                result: `${chalk_1.default.blue.bold(`--- [${index}] ${item.type}: ${item.path} ---`)}\n${highlighted}\n${chalk_1.default.blue.bold("--- End ---")}`,
            };
        }
        else {
            // 查看全部 (也要高亮每一个)
            let result = chalk_1.default.cyan.bold("=== 当前完整上下文内容 ===\n\n");
            items.forEach((item, i) => {
                const lang = getLanguageByPath(item.path);
                const highlighted = (0, renderer_1.renderMarkdown)(`\`\`\`${lang}\n${item.content || "(空)"}\n\`\`\``);
                result += `${chalk_1.default.blue.bold(`--- [${i + 1}] ${item.type}: ${item.path} ---`)}\n${highlighted}\n\n`;
            });
            result += chalk_1.default.cyan.bold("==========================");
            return { processed: true, result };
        }
    }
    catch (error) {
        return {
            processed: true,
            result: `读取上下文失败: ${error}`,
        };
    }
}
async function handleClearContext() {
    try {
        // 清除持久化存储
        await (0, contextStorage_1.saveContext)([]);
        return { processed: true, result: "上下文已清空（含持久化）" };
    }
    catch (error) {
        return {
            processed: true,
            result: `清除上下文失败: ${error}`,
        };
    }
}
async function handleFileAndCommand(filePath, command) {
    try {
        const fullPath = path_1.default.resolve(filePath);
        if (!fs_1.default.existsSync(fullPath)) {
            return {
                processed: true,
                result: `错误: 文件 "${filePath}" 不存在`,
                isPureReference: true,
                type: "file",
            };
        }
        const content = await fs_1.default.promises.readFile(fullPath, "utf-8");
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        const persisted = await (0, contextStorage_1.loadContext)();
        contextBuffer.import(persisted);
        contextBuffer.add({
            type: "file",
            path: filePath,
            content: content,
        });
        await (0, contextStorage_1.saveContext)(contextBuffer.export());
        console.log(chalk_1.default.green(`✓ 已将文件 "${filePath}" 加入上下文`));
        console.log(chalk_1.default.cyan(`⚡️ 正在执行: ${command}\n`));
        const { stdout, stderr } = await execAsync(command, {
            cwd: path_1.default.dirname(fullPath),
        });
        if (stdout)
            console.log(stdout);
        if (stderr)
            console.error(chalk_1.default.red(stderr));
        return {
            processed: true,
            result: `命令执行完成`,
            isPureReference: true,
            type: "command",
        };
    }
    catch (error) {
        return {
            processed: true,
            result: `错误: 执行失败: ${error}`,
            isPureReference: true,
            type: "command",
        };
    }
}
/**
 * 根据文件路径智能识别编程语言
 */
function getLanguageByPath(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase().slice(1);
    if (!ext)
        return "text";
    const langMap = {
        ts: "typescript",
        js: "javascript",
        tsx: "typescript",
        jsx: "javascript",
        py: "python",
        rb: "ruby",
        sh: "bash",
        zsh: "bash",
        yml: "yaml",
        yaml: "yaml",
        md: "markdown",
        json: "json",
        rs: "rust",
        go: "go",
        c: "c",
        cpp: "cpp",
        h: "cpp",
        java: "java",
        kt: "kotlin",
        css: "css",
        scss: "scss",
        html: "html",
        sql: "sql",
        vue: "html",
        makefile: "makefile",
        dockerfile: "dockerfile",
    };
    return langMap[ext] || ext;
}
//# sourceMappingURL=syntaxHandler.js.map