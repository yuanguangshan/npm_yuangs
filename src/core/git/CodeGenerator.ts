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
    baseDir: string = process.cwd()
): Promise<{ written: string[]; skipped: string[] }> {
    const written: string[] = [];
    const skipped: string[] = [];
    
    for (const file of generated.files) {
        try {
            const fullPath = path.isAbsolute(file.path) 
                ? file.path 
                : path.join(baseDir, file.path);
            
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
    baseDir: string = process.cwd()
): Promise<void> {
    const backupsDir = path.join(baseDir, '.yuangs', 'backups');
    
    if (!fs.existsSync(backupsDir)) {
        return;
    }
    
    const entries = await fs.promises.readdir(backupsDir, { withFileTypes: true });
    const backups = entries
        .filter(entry => entry.isDirectory())
        .map(async entry => {
            const manifestPath = path.join(backupsDir, entry.name, 'manifest.json');
            const manifest = JSON.parse(
                await fs.promises.readFile(manifestPath, 'utf8')
            ) as BackupInfo;
            return { id: entry.name, timestamp: manifest.timestamp };
        });
    
    const backupInfos = await Promise.all(backups);
    backupInfos.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const toDelete = backupInfos.slice(0, -keepCount);
    for (const backup of toDelete) {
        const backupPath = path.join(backupsDir, backup.id);
        await fs.promises.rm(backupPath, { recursive: true, force: true });
    }
}
