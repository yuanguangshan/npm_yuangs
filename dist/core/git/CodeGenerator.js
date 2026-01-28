"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGeneratedCode = parseGeneratedCode;
exports.writeGeneratedCode = writeGeneratedCode;
exports.saveRawOutput = saveRawOutput;
exports.backupFiles = backupFiles;
exports.restoreFromBackup = restoreFromBackup;
exports.cleanOldBackups = cleanOldBackups;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = __importDefault(require("crypto"));
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
    const pattern3 = /\*\*([^*]+\.(?:ts|js|tsx|jsx|json|md|html))\*\*\s*\n```(?:typescript|javascript|ts|js|json|markdown|code|html)?\s*\n([\s\S]*?)\n```/gi;
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
    // 格式 4: ## 📄 文件：`filename.ext`\n```code\n代码\n```
    const pattern4 = /##\s*[^\n]*文件[：:]\s*`([^`]+)`\s*\n```(?:code|html|typescript|javascript)?\s*\n([\s\S]*?)\n```/gi;
    while ((match = pattern4.exec(llmOutput)) !== null) {
        const filePath = match[1].trim();
        if (!files.some(f => f.path === filePath)) {
            files.push({
                path: filePath,
                content: match[2].trim(),
                action: 'create'
            });
        }
    }
    // 格式 5: ### 📄 文件：`filename.ext`\n```html\n代码\n```
    const pattern5 = /###.*文件.*\`([^`]+)\`.*\n\`\`\`.*\n\`\`\`/gis;
    while ((match = pattern5.exec(llmOutput)) !== null) {
        const filePath = match[1].trim();
        if (!files.some(f => f.path === filePath)) {
            // 提取代码内容：从第一个 ``` 到第二个 ```
            const parts = match[0].split('\`\`\`\n');
            if (parts.length >= 3) {
                const contentParts = parts[2].split('\n\`\`\`');
                const content = contentParts[0].trim();
                files.push({
                    path: filePath,
                    content: content,
                    action: 'create'
                });
            }
        }
    }
    // 格式 6: ## 📄 文件：`filename.ext`\n说明\n```html\n代码\n```（支持多行说明）
    const pattern6 = /##\s*[^\n]*文件[：:]\s*\`([^`]+)\`[\s\S]*?\n\`\`\`(?:html|code|typescript|javascript|css|json)?\s*\n([\s\S]+?)\n\`\`\`/gis;
    while ((match = pattern6.exec(llmOutput)) !== null) {
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
/**
 * 备份受影响的文件（在写入前）
 */
async function backupFiles(files, baseDir = process.cwd()) {
    const backupId = crypto_1.default.randomBytes(8).toString('hex');
    const backupDir = path_1.default.join(baseDir, '.yuangs', 'backups', backupId);
    const manifest = [];
    await fs_1.default.promises.mkdir(backupDir, { recursive: true });
    for (const file of files) {
        const fullPath = path_1.default.isAbsolute(file.path)
            ? file.path
            : path_1.default.join(baseDir, file.path);
        if (fs_1.default.existsSync(fullPath)) {
            const backupFile = path_1.default.join(backupDir, path_1.default.relative(baseDir, fullPath));
            const backupDirPath = path_1.default.dirname(backupFile);
            await fs_1.default.promises.mkdir(backupDirPath, { recursive: true });
            await fs_1.default.promises.copyFile(fullPath, backupFile);
            manifest.push(file.path);
        }
    }
    const info = {
        id: backupId,
        timestamp: new Date().toISOString(),
        files: manifest
    };
    const manifestPath = path_1.default.join(backupDir, 'manifest.json');
    await fs_1.default.promises.writeFile(manifestPath, JSON.stringify(info, null, 2), 'utf8');
    return info;
}
/**
 * 从备份恢复文件
 */
async function restoreFromBackup(backupId, baseDir = process.cwd()) {
    const backupDir = path_1.default.join(baseDir, '.yuangs', 'backups', backupId);
    const manifestPath = path_1.default.join(backupDir, 'manifest.json');
    if (!fs_1.default.existsSync(manifestPath)) {
        throw new Error(`Backup ${backupId} not found`);
    }
    const manifest = JSON.parse(await fs_1.default.promises.readFile(manifestPath, 'utf8'));
    for (const filePath of manifest.files) {
        const backupFile = path_1.default.join(backupDir, filePath);
        const originalPath = path_1.default.isAbsolute(filePath)
            ? filePath
            : path_1.default.join(baseDir, filePath);
        if (fs_1.default.existsSync(backupFile)) {
            await fs_1.default.promises.copyFile(backupFile, originalPath);
        }
    }
}
/**
 * 清理旧备份
 */
async function cleanOldBackups(keepCount = 5, baseDir = process.cwd()) {
    const backupsDir = path_1.default.join(baseDir, '.yuangs', 'backups');
    if (!fs_1.default.existsSync(backupsDir)) {
        return;
    }
    const entries = await fs_1.default.promises.readdir(backupsDir, { withFileTypes: true });
    const backups = entries
        .filter(entry => entry.isDirectory())
        .map(async (entry) => {
        const manifestPath = path_1.default.join(backupsDir, entry.name, 'manifest.json');
        const manifest = JSON.parse(await fs_1.default.promises.readFile(manifestPath, 'utf8'));
        return { id: entry.name, timestamp: manifest.timestamp };
    });
    const backupInfos = await Promise.all(backups);
    backupInfos.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const toDelete = backupInfos.slice(0, -keepCount);
    for (const backup of toDelete) {
        const backupPath = path_1.default.join(backupsDir, backup.id);
        await fs_1.default.promises.rm(backupPath, { recursive: true, force: true });
    }
}
//# sourceMappingURL=CodeGenerator.js.map