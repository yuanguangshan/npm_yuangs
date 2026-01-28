import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

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
