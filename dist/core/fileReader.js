"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilePathsFromLsOutput = parseFilePathsFromLsOutput;
exports.readFilesContent = readFilesContent;
exports.buildPromptWithFileContent = buildPromptWithFileContent;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
function readFilesContent(filePaths) {
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