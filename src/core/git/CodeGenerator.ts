import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import crypto from 'crypto';

/**
 * 代码生成结果
 */
export interface GeneratedCode {
    files: Array<{
        path: string;
        content: string;
        action: 'create' | 'modify';
    }>;
    rawOutput: string;
}

/**
 * 写入选项
 */
export interface WriteOptions {
    dryRun?: boolean;           // 只预览不实际写入
    maxFileSize?: number;       // 最大文件大小限制（字节）
    warnOnOverwrite?: boolean;  // 覆盖前警告
}

// 默认配置
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
const DEFAULT_MAX_AGE_DAYS = 30; // 备份保留30天

/**
 * 备份信息
 */
export interface BackupInfo {
    id: string;
    timestamp: string;
    files: string[];
}

/**
 * 从 LLM 输出中解析文件路径和代码
 */
export function parseGeneratedCode(llmOutput: string): GeneratedCode {
    const files: GeneratedCode['files'] = [];
    
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

    // 格式 7: ```filepath:相对路径\n代码\n```（单行 filepath 格式）
    const pattern7 = /```filepath:([^\s\n]+)\s*\n([\s\S]*?)\n```/gi;
    while ((match = pattern7.exec(llmOutput)) !== null) {
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
export async function writeGeneratedCode(
    generated: GeneratedCode,
    baseDir: string = process.cwd(),
    options: WriteOptions = {}
): Promise<{ written: string[]; skipped: string[] }> {
    const written: string[] = [];
    const skipped: string[] = [];
    const { dryRun = false, maxFileSize = DEFAULT_MAX_FILE_SIZE, warnOnOverwrite = true } = options;

    // 解析基础目录的绝对路径
    const resolvedBaseDir = path.resolve(baseDir);

    for (const file of generated.files) {
        try {
            const fullPath = path.isAbsolute(file.path)
                ? file.path
                : path.join(baseDir, file.path);

            // 路径安全检查：确保目标路径在 baseDir 内
            const resolvedPath = path.resolve(fullPath);
            if (!resolvedPath.startsWith(resolvedBaseDir)) {
                console.warn(chalk.yellow(`  ⚠ 跳过不安全路径: ${file.path} (越出项目目录)`));
                skipped.push(file.path);
                continue;
            }

            // 文件大小检查
            if (file.content.length > maxFileSize) {
                console.warn(chalk.yellow(`  ⚠ 跳过超大文件: ${file.path} (${(file.content.length / 1024).toFixed(1)}KB > ${(maxFileSize / 1024).toFixed(1)}KB)`));
                skipped.push(file.path);
                continue;
            }

            // 文件存在性警告
            const fileExists = fs.existsSync(fullPath);
            if (warnOnOverwrite && fileExists) {
                console.log(chalk.cyan(`  ℹ 文件已存在，将被覆盖: ${file.path}`));
            }

            if (dryRun) {
                console.log(chalk.blue(`  [DRY-RUN] 将${fileExists ? '修改' : '创建'}: ${file.path}`));
                written.push(file.path);
                continue;
            }

            // 确保目录存在
            const dir = path.dirname(fullPath);
            await fs.promises.mkdir(dir, { recursive: true });

            // 写入文件
            await fs.promises.writeFile(fullPath, file.content, 'utf8');
            written.push(file.path);

            console.log(chalk.green(`  ✓ ${file.action === 'create' ? '创建' : '修改'}: ${file.path}`));
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : '未知错误';
            console.warn(chalk.yellow(`  ⚠ 跳过 ${file.path}: ${errorMsg}`));
            skipped.push(file.path);
        }
    }

    return { written, skipped };
}

/**
 * 保存原始输出到临时文件
 */
export async function saveRawOutput(
    content: string,
    taskIndex: number,
    baseDir: string = process.cwd()
): Promise<string> {
    const outputDir = path.join(baseDir, '.yuangs', 'generated');
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `task-${taskIndex + 1}-${timestamp}.md`;
    const filepath = path.join(outputDir, filename);
    
    await fs.promises.writeFile(filepath, content, 'utf8');
    
    return filepath;
}

/**
 * 备份受影响的文件（在写入前）
 */
export async function backupFiles(
    files: Array<{ path: string; content: string }>,
    baseDir: string = process.cwd()
): Promise<BackupInfo> {
    const backupId = crypto.randomBytes(8).toString('hex');
    const backupDir = path.join(baseDir, '.yuangs', 'backups', backupId);
    const manifest: string[] = [];
    
    await fs.promises.mkdir(backupDir, { recursive: true });
    
    for (const file of files) {
        const fullPath = path.isAbsolute(file.path) 
            ? file.path 
            : path.join(baseDir, file.path);
        
        if (fs.existsSync(fullPath)) {
            const backupFile = path.join(backupDir, path.relative(baseDir, fullPath));
            const backupDirPath = path.dirname(backupFile);
            
            await fs.promises.mkdir(backupDirPath, { recursive: true });
            await fs.promises.copyFile(fullPath, backupFile);
            manifest.push(file.path);
        }
    }
    
    const info: BackupInfo = {
        id: backupId,
        timestamp: new Date().toISOString(),
        files: manifest
    };
    
    const manifestPath = path.join(backupDir, 'manifest.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(info, null, 2), 'utf8');
    
    return info;
}

/**
 * 从备份恢复文件
 */
export async function restoreFromBackup(
    backupId: string,
    baseDir: string = process.cwd()
): Promise<void> {
    const backupDir = path.join(baseDir, '.yuangs', 'backups', backupId);
    const manifestPath = path.join(backupDir, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Backup ${backupId} not found`);
    }
    
    const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8')) as BackupInfo;
    
    for (const filePath of manifest.files) {
        const backupFile = path.join(backupDir, filePath);
        const originalPath = path.isAbsolute(filePath) 
            ? filePath 
            : path.join(baseDir, filePath);
        
        if (fs.existsSync(backupFile)) {
            await fs.promises.copyFile(backupFile, originalPath);
        }
    }
}

/**
 * 清理旧备份
 */
export async function cleanOldBackups(
    keepCount: number = 5,
    baseDir: string = process.cwd(),
    maxAgeDays: number = DEFAULT_MAX_AGE_DAYS
): Promise<{ deleted: number; kept: number }> {
    const backupsDir = path.join(baseDir, '.yuangs', 'backups');

    if (!fs.existsSync(backupsDir)) {
        return { deleted: 0, kept: 0 };
    }

    const entries = await fs.promises.readdir(backupsDir, { withFileTypes: true });
    const backups = entries
        .filter(entry => entry.isDirectory())
        .map(async entry => {
            const manifestPath = path.join(backupsDir, entry.name, 'manifest.json');
            try {
                const manifest = JSON.parse(
                    await fs.promises.readFile(manifestPath, 'utf8')
                ) as BackupInfo;
                return { id: entry.name, timestamp: manifest.timestamp };
            } catch {
                return null;
            }
        });

    const backupInfos = (await Promise.all(backups)).filter(Boolean) as Array<{ id: string; timestamp: string }>;

    // 按时间排序
    backupInfos.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    let deleted = 0;
    let kept = 0;

    for (let i = 0; i < backupInfos.length; i++) {
        const backup = backupInfos[i];
        const backupAge = now - new Date(backup.timestamp).getTime();
        const shouldDelete = i >= keepCount || backupAge > maxAgeMs;

        if (shouldDelete) {
            const backupPath = path.join(backupsDir, backup.id);
            await fs.promises.rm(backupPath, { recursive: true, force: true });
            deleted++;
        } else {
            kept++;
        }
    }

    return { deleted, kept };
}
