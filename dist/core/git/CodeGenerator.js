"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGeneratedCode = parseGeneratedCode;
exports.writeGeneratedCode = writeGeneratedCode;
exports.saveRawOutput = saveRawOutput;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * 从 LLM 输出中解析文件路径和代码
 */
function parseGeneratedCode(llmOutput) {
    const files = [];
    // 尝试多种格式解析
    // 格式 1: ```filepath\n路径\n```\n```code\n代码\n```
    const pattern1 = /```filepath\s*\n(.*?)\n```\s*\n```(?:typescript|javascript|ts|js|code)?\s*\n([\s\S]*?)\n```/gi;
    let match;
    while ((match = pattern1.exec(llmOutput)) !== null) {
        files.push({
            path: match[1].trim(),
            content: match[2].trim(),
            action: 'create'
        });
    }
    // 格式 2: ### 文件: path/to/file.ts\n```typescript\n代码\n```
    const pattern2 = /###?\s*(?:文件|File)[：:]\s*([^\n]+)\s*\n```(?:typescript|javascript|ts|js|code)?\s*\n([\s\S]*?)\n```/gi;
    while ((match = pattern2.exec(llmOutput)) !== null) {
        const filePath = match[1].trim().replace(/`/g, '');
        if (!files.some(f => f.path === filePath)) {
            files.push({
                path: filePath,
                content: match[2].trim(),
                action: 'create'
            });
        }
    }
    // 格式 3: **path/to/file.ts**\n```typescript\n代码\n```
    const pattern3 = /\*\*([^*]+\.(?:ts|js|tsx|jsx|json|md))\*\*\s*\n```(?:typescript|javascript|ts|js|json|markdown|code)?\s*\n([\s\S]*?)\n```/gi;
    while ((match = pattern3.exec(llmOutput)) !== null) {
        const filePath = match[1].trim();
        if (!files.some(f => f.path === filePath)) {
            files.push({
                path: filePath,
                content: match[2].trim(),
                action: 'create'
            });
        }
    }
    return {
        files,
        rawOutput: llmOutput
    };
}
/**
 * 将生成的代码写入文件系统
 */
async function writeGeneratedCode(generated, baseDir = process.cwd()) {
    const written = [];
    const skipped = [];
    for (const file of generated.files) {
        try {
            const fullPath = path_1.default.isAbsolute(file.path)
                ? file.path
                : path_1.default.join(baseDir, file.path);
            // 确保目录存在
            const dir = path_1.default.dirname(fullPath);
            await fs_1.default.promises.mkdir(dir, { recursive: true });
            // 写入文件
            await fs_1.default.promises.writeFile(fullPath, file.content, 'utf8');
            written.push(file.path);
            console.log(chalk_1.default.green(`  ✓ ${file.action === 'create' ? '创建' : '修改'}: ${file.path}`));
        }
        catch (e) {
            const errorMsg = e instanceof Error ? e.message : '未知错误';
            console.warn(chalk_1.default.yellow(`  ⚠ 跳过 ${file.path}: ${errorMsg}`));
            skipped.push(file.path);
        }
    }
    return { written, skipped };
}
/**
 * 保存原始输出到临时文件
 */
async function saveRawOutput(content, taskIndex, baseDir = process.cwd()) {
    const outputDir = path_1.default.join(baseDir, '.yuangs', 'generated');
    await fs_1.default.promises.mkdir(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `task-${taskIndex + 1}-${timestamp}.md`;
    const filepath = path_1.default.join(outputDir, filename);
    await fs_1.default.promises.writeFile(filepath, content, 'utf8');
    return filepath;
}
//# sourceMappingURL=CodeGenerator.js.map