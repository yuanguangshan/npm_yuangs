import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { ContextBuffer } from '../commands/contextBuffer';
import { loadContext, saveContext } from '../commands/contextStorage';

const execAsync = promisify(exec);

/**
 * 解析并处理特殊语法（@、#、:ls 等）
 */
export async function handleSpecialSyntax(input: string, stdinData?: string): Promise<{ 
    processed: boolean; 
    result?: string; 
    isPureReference?: boolean;
    error?: boolean;
    itemCount?: number;
    type?: 'file' | 'directory' | 'command' | 'management';
}> {
    const trimmed = input.trim();

    // 处理 @ 文件引用语法
    if (trimmed.startsWith('@')) {
        // 检查是否是 @! 立即执行语法
        const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);
        if (immediateExecMatch) {
            const filePath = immediateExecMatch[1].trim();
            return await handleImmediateExec(filePath);
        }

        // 检查是否是 @filename:command 语法 (添加文件并执行命令)
        const fileExecMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^0-9\s].*)$/);
        if (fileExecMatch) {
            const filePath = fileExecMatch[1].trim();
            const command = fileExecMatch[2].trim();
            return await handleFileAndCommand(filePath, command);
        }

        // 检查是否是带行号的语法 @file:start-end as alias
        const lineRangeMatch = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+([^\s\n]+))?\s*(?:\n(.*))?$/s);
        if (lineRangeMatch) {
            const filePath = lineRangeMatch[1];
            const startLine = lineRangeMatch[2] ? parseInt(lineRangeMatch[2]) : null;
            const endLine = lineRangeMatch[3] ? parseInt(lineRangeMatch[3]) : null;
            const alias = lineRangeMatch[4];
            const hasQuestion = !!lineRangeMatch[5] || !!stdinData;
            const question = lineRangeMatch[5] || (stdinData ? `分析以下文件内容：\n\n${stdinData}` : '请分析这个文件');

            const res = await handleFileReference(filePath.trim(), startLine, endLine, question, alias, !hasQuestion);
            return {
                ...res,
                isPureReference: !hasQuestion,
                type: 'file'
            };
        }
    }

    // 处理 # 目录引用语法
    if (trimmed.startsWith('#')) {
        const dirMatch = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
        if (dirMatch) {
            const dirPath = dirMatch[1].trim();
            const hasQuestion = !!dirMatch[2] || !!stdinData;
            const question = dirMatch[2] || (stdinData ? `分析以下目录内容：\n\n${stdinData}` : '请分析这个目录');
            const res = await handleDirectoryReference(dirPath, question);
            return {
                ...res,
                isPureReference: !hasQuestion,
                type: 'directory'
            };
        }
    }

    // 处理 :ls 命令
    if (trimmed === ':ls') {
        const res = await handleListContext();
        return { ...res, type: 'management' };
    }

    // 场景 5.1: :exec 原子执行
    if (trimmed.startsWith(':exec ')) {
        const command = trimmed.slice(6).trim();
        const res = await handleAtomicExec(command);
        return { ...res, type: 'command' };
    }

    // 处理 :cat [index] 命令
    if (trimmed === ':cat' || trimmed.startsWith(':cat ')) {
        const parts = trimmed.split(' ');
        const index = parts.length > 1 ? parseInt(parts[1]) : null;
        const res = await handleCatContext(index);
        return { ...res, type: 'management' };
    }

    // 处理 :clear 命令
    if (trimmed === ':clear') {
        const res = await handleClearContext();
        return { ...res, type: 'management' };
    }

    // 如果不是特殊语法，返回未处理
    return { processed: false };
}

async function handleFileReference(
    filePath: string, 
    startLine: number | null = null, 
    endLine: number | null = null, 
    question?: string, 
    alias?: string,
    isPureReference: boolean = false
): Promise<{ 
    processed: boolean; 
    result: string;
    error?: boolean;
}> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        return { 
            processed: true, 
            result: `错误: 文件 "${filePath}" 不存在或不是一个文件` 
        };
    }

    try {
        let content = fs.readFileSync(fullPath, 'utf-8');
        
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

        const contentMap = new Map<string, string>();
        contentMap.set(filePath, content);

        // 持久化到上下文
        const contextBuffer = new ContextBuffer();
        const persisted = await loadContext();
        contextBuffer.import(persisted);

        contextBuffer.add({
            type: 'file',
            path: filePath + (startLine !== null ? `:${startLine}${endLine ? `-${endLine}` : ''}` : ''),
            content: content,
            alias: alias
        });

        await saveContext(contextBuffer.export());

        const prompt = buildPromptWithFileContent(
            `文件: ${filePath}${startLine !== null ? `:${startLine}${endLine ? `-${endLine}` : ''}` : ''}`,
            [filePath],
            contentMap,
            question || `请分析文件: ${filePath}`
        );

        if (prompt.startsWith('错误:')) {
            return { processed: true, result: prompt, error: true };
        }

        if (isPureReference) {
            return { processed: true, result: `已将文件 ${filePath} 加入上下文` };
        }

        return { processed: true, result: prompt };
    } catch (error) {
        return { 
            processed: true, 
            result: `错误: 读取文件失败: ${error}` ,
            error: true
        };
    }
}

async function handleDirectoryReference(dirPath: string, question?: string): Promise<{ 
    processed: boolean; 
    result: string;
    error?: boolean;
    itemCount?: number;
}> {
    const fullPath = path.resolve(dirPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
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

        const contentMap = readFilesContent(filePaths);

        // 持久化到上下文
        const contextBuffer = new ContextBuffer();
        const persisted = await loadContext();
        contextBuffer.import(persisted);

        let addedCount = 0;
        let totalOriginalTokens = 0;

        for (const [filePath, content] of contentMap) {
            const tokens = Math.ceil(content.length / 4);
            totalOriginalTokens += tokens;
            
            // 如果单个文件太大，跳过它以免撑爆上下文
            if (tokens > 10000) {
                continue;
            }

            contextBuffer.add({
                type: 'file',
                path: filePath,
                content: content
            });
            addedCount++;
        }

        if (addedCount === 0 && filePaths.length > 0) {
            return {
                processed: true,
                result: `错误: 目录 "${dirPath}" 中的文件都太大，无法加入上下文`,
                error: true
            };
        }

        await saveContext(contextBuffer.export());

        return { 
            processed: true, 
            result: `已成功加入 ${addedCount} 个文件到上下文 (共找到 ${filePaths.length} 个文件)`,
            itemCount: addedCount
        };
    } catch (error) {
        return { 
            processed: true, 
            result: `错误: 读取目录失败: ${error}`,
            error: true
        };
    }
}

async function handleImmediateExec(filePath: string): Promise<{ processed: boolean; result: string }> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
        return { 
            processed: true, 
            result: `错误: 文件 "${filePath}" 不存在` 
        };
    }

    try {
        // 1. 读取脚本内容
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        console.log(chalk.gray(`正在执行 ${filePath} 并捕获输出...`));
        
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
        const contextBuffer = new ContextBuffer();
        const persisted = await loadContext();
        contextBuffer.import(persisted);

        contextBuffer.add({
            type: 'file',
            path: `${filePath} (Runtime Log)`,
            content: combinedContext,
            summary: '包含脚本源码和执行后的输出日志'
        });

        await saveContext(contextBuffer.export());

        // 返回给 AI 的 Prompt
        const result = `我执行了脚本 ${filePath}。\n以下是脚本源码和执行输出：\n${combinedContext}\n\n请分析为何会出现上述输出（特别是错误信息）？`;
        return { processed: true, result };
    } catch (error: any) {
        const errorMsg = error.message || String(error);
        const result = `执行脚本 ${filePath} 时发生错误：\n${errorMsg}\n\n请分析原因。`;
        return { processed: true, result };
    }
}

async function handleAtomicExec(command: string): Promise<{ processed: boolean; result: string }> {
    console.log(chalk.cyan(`\n⚡️ [Atomic Exec] 执行命令: ${command}\n`));
    
    try {
        // 对于原子执行，我们希望用户能实时看到输出，所以用 inherit
        const { spawn } = require('child_process');
        const child = spawn(command, { 
            shell: true, 
            stdio: 'inherit' 
        });

        await new Promise<void>((resolve, reject) => {
            child.on('close', (code: number) => {
                if (code === 0) resolve();
                else reject(new Error(`Exit code ${code}`));
            });
            child.on('error', reject);
        });
        
        // 原子执行不将结果传给 AI，直接返回空结果表示处理完成
        return { processed: true, result: '' }; 
    } catch (error) {
        console.error(chalk.red(`执行失败: ${error}`));
        return { processed: true, result: '' };
    }
}

async function handleListContext(): Promise<{ processed: boolean; result: string }> {
    try {
        const persisted = await loadContext();
        const contextBuffer = new ContextBuffer();
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
    } catch (error) {
        return { 
            processed: true, 
            result: `读取上下文失败: ${error}` 
        };
    }
}

async function handleCatContext(index: number | null): Promise<{ processed: boolean; result: string }> {
    try {
        const persisted = await loadContext();
        const contextBuffer = new ContextBuffer();
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
        } else {
            // 查看全部
            let result = '=== 当前完整上下文内容 ===\n\n';
            items.forEach((item, i) => {
                result += `--- [${i + 1}] ${item.type}: ${item.path} ---\n${item.content}\n\n`;
            });
            result += '==========================';
            return { processed: true, result };
        }
    } catch (error) {
        return { 
            processed: true, 
            result: `读取上下文失败: ${error}` 
        };
    }
}

async function handleClearContext(): Promise<{ processed: boolean; result: string }> {
    try {
        // 清除持久化存储
        await saveContext([]);
        
        return { processed: true, result: '上下文已清空（含持久化）' };
    } catch (error) {
        return { 
            processed: true, 
            result: `清除上下文失败: ${error}` 
        };
    }
}

async function handleFileAndCommand(filePath: string, command: string): Promise<{ processed: boolean; result: string; isPureReference?: boolean; type?: any }> {
    try {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) {
            return { processed: true, result: `错误: 文件 "${filePath}" 不存在`, isPureReference: true, type: 'file' };
        }

        const content = await fs.promises.readFile(fullPath, 'utf-8');
        const contextBuffer = new ContextBuffer();
        const persisted = await loadContext();
        contextBuffer.import(persisted);

        contextBuffer.add({
            type: 'file',
            path: filePath,
            content: content
        });

        await saveContext(contextBuffer.export());
        console.log(chalk.green(`✓ 已将文件 "${filePath}" 加入上下文`));
        console.log(chalk.cyan(`⚡️ 正在执行: ${command}\n`));

        const { stdout, stderr } = await execAsync(command, { cwd: path.dirname(fullPath) });
        if (stdout) console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));

        return { 
            processed: true, 
            result: `命令执行完成`,
            isPureReference: true,
            type: 'command'
        };
    } catch (error) {
        return { 
            processed: true, 
            result: `错误: 执行失败: ${error}`,
            isPureReference: true,
            type: 'command'
        };
    }
}
