"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilePathsFromLsOutput = parseFilePathsFromLsOutput;
exports.readFilesContent = readFilesContent;
exports.readFilesContentSync = readFilesContentSync;
exports.buildPromptWithFileContent = buildPromptWithFileContent;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const p_limit_1 = __importDefault(require("p-limit"));
const ora_1 = __importDefault(require("ora"));
function parseFilePathsFromLsOutput(output) {
    const lines = output.trim().split('\n');
    const filePaths = [];
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1];
        if (lastPart && !lastPart.startsWith('-') && lastPart !== '.' && lastPart !== '..') {
            filePaths.push(lastPart);
        }
    }
    return filePaths;
}
async function readFilesContent(filePaths, options = {}) {
    const { showProgress = true, concurrency = 5 } = options;
    const contentMap = new Map();
    if (filePaths.length === 0) {
        return contentMap;
    }
    const spinner = showProgress && filePaths.length > 5
        ? (0, ora_1.default)(`正在读取 ${filePaths.length} 个文件...`).start()
        : null;
    try {
        const limit = (0, p_limit_1.default)(concurrency);
        let completed = 0;
        const total = filePaths.length;
        const readTasks = filePaths.map(filePath => limit(async () => {
            try {
                const fullPath = path_1.default.resolve(filePath);
                if (fs_1.default.existsSync(fullPath) && fs_1.default.statSync(fullPath).isFile()) {
                    const content = await fs_1.default.promises.readFile(fullPath, 'utf-8');
                    return { filePath, content };
                }
                return null;
            }
            catch (error) {
                console.error(`无法读取文件: ${filePath}`);
                return null;
            }
        }));
        for await (const task of readTasks) {
            const result = await task;
            if (result) {
                contentMap.set(result.filePath, result.content);
            }
            completed++;
            if (spinner && completed % Math.max(1, Math.floor(total / 10)) === 0) {
                const progress = Math.floor((completed / total) * 100);
                spinner.text = `正在读取文件... ${completed}/${total} (${progress}%)`;
            }
        }
        if (spinner) {
            spinner.succeed(`已完成读取 ${contentMap.size} 个文件`);
        }
    }
    catch (error) {
        if (spinner) {
            spinner.fail('读取文件时出错');
        }
        throw error;
    }
    return contentMap;
}
function readFilesContentSync(filePaths) {
    const contentMap = new Map();
    for (const filePath of filePaths) {
        try {
            const fullPath = path_1.default.resolve(filePath);
            if (fs_1.default.existsSync(fullPath) && fs_1.default.statSync(fullPath).isFile()) {
                const content = fs_1.default.readFileSync(fullPath, 'utf-8');
                contentMap.set(filePath, content);
            }
        }
        catch (error) {
            console.error(`无法读取文件: ${filePath}`);
        }
    }
    return contentMap;
}
function buildPromptWithFileContent(originalOutput, filePaths, contentMap, question) {
    let prompt = '';
    prompt += '## 文件列表\n';
    prompt += '```\n';
    prompt += originalOutput;
    prompt += '```\n\n';
    if (contentMap.size > 0) {
        prompt += '## 文件内容\n\n';
        for (const [filePath, content] of contentMap) {
            prompt += `### ${filePath}\n`;
            prompt += '```\n';
            const maxChars = 5000;
            const truncated = content.length > maxChars
                ? content.substring(0, maxChars) + '\n... (内容过长已截断)'
                : content;
            prompt += truncated;
            prompt += '\n```\n\n';
        }
    }
    if (question) {
        prompt += `\n## 我的问题\n${question}`;
    }
    else {
        prompt += '\n## 我的问题\n请分析以上文件列表和文件内容';
    }
    return prompt;
}
//# sourceMappingURL=fileReader.js.map