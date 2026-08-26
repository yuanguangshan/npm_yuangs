import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import ora from 'ora';

export interface ReadFilesContentOptions {
    showProgress?: boolean;
    concurrency?: number;
    maxFileSize?: number;      // 最大文件大小（字节），超过则跳过
    maxContentLength?: number; // 内容最大长度（字符），超过则截断
    encoding?: BufferEncoding; // 文件编码
}

// 默认配置
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_CONTENT_LENGTH = 5000; // 5000字符

export function parseFilePathsFromLsOutput(output: string): string[] {
    const lines = output.trim().split('\n');
    const filePaths: string[] = [];

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1];

        if (lastPart && !lastPart.startsWith('-') && lastPart !== '.' && lastPart !== '..') {
            filePaths.push(lastPart);
        }
    }

    return filePaths;
}

export async function readFilesContent(
    filePaths: string[],
    options: ReadFilesContentOptions = {}
): Promise<Map<string, string>> {
    const {
        showProgress = true,
        concurrency = 5,
        maxFileSize = DEFAULT_MAX_FILE_SIZE,
        maxContentLength = DEFAULT_MAX_CONTENT_LENGTH,
        encoding = 'utf-8'
    } = options;
    const contentMap = new Map<string, string>();

    if (filePaths.length === 0) {
        return contentMap;
    }

    const spinner = showProgress && filePaths.length > 5
        ? ora(`正在读取 ${filePaths.length} 个文件...`).start()
        : null;

    try {
        const limit = pLimit(concurrency);
        let completed = 0;
        const total = filePaths.length;

        const readTasks = filePaths.map(filePath =>
            limit(async () => {
                try {
                    const fullPath = path.resolve(filePath);
                    let stats: fs.Stats;
                    try {
                        stats = await fs.promises.stat(fullPath);
                    } catch {
                        return null; // 文件不存在
                    }
                    if (!stats.isFile()) {
                        return null;
                    }

                    // 文件大小检查
                    if (stats.size > maxFileSize) {
                        console.error(`文件过大，跳过: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                        return null;
                    }

                    let content = await fs.promises.readFile(fullPath, encoding);
                    if (content.length > maxContentLength) {
                        content = content.substring(0, maxContentLength) + '\n... (内容过长已截断)';
                    }
                    return { filePath, content };
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : '未知错误';
                    console.error(`无法读取文件: ${filePath} - ${errorMsg}`);
                    return null;
                }
            })
        );

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
    } catch (error) {
        if (spinner) {
            spinner.fail('读取文件时出错');
        }
        throw error;
    }

    return contentMap;
}

/**
 * @deprecated 优先使用异步 readFilesContent，避免同步阻塞
 * 同步版本现增加大小与数量限制，最多处理20个文件且单文件>1MB跳过
 */
export function readFilesContentSync(filePaths: string[]): Map<string, string> {
    const contentMap = new Map<string, string>();
    const MAX_SYNC_FILES = 20;
    const MAX_SYNC_FILE_SIZE = 1024 * 1024; // 1MB
    const slice = filePaths.slice(0, MAX_SYNC_FILES);
    if (filePaths.length > MAX_SYNC_FILES) {
        console.warn(`readFilesContentSync: 文件数 ${filePaths.length} 超限，仅处理前 ${MAX_SYNC_FILES} 个`);
    }
    for (const filePath of slice) {
        try {
            const fullPath = path.resolve(filePath);
            if (!fs.existsSync(fullPath)) continue;
            const stats = fs.statSync(fullPath);
            if (!stats.isFile()) continue;
            if (stats.size > MAX_SYNC_FILE_SIZE) {
                console.warn(`readFilesContentSync: 跳过大文件 ${filePath}`);
                continue;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            const truncated = content.length > DEFAULT_MAX_CONTENT_LENGTH
                ? content.substring(0, DEFAULT_MAX_CONTENT_LENGTH) + '\n... (内容过长已截断)'
                : content;
            contentMap.set(filePath, truncated);
        } catch {
            console.error(`无法读取文件: ${filePath}`);
        }
    }
    return contentMap;
}

export function buildPromptWithFileContent(
    originalOutput: string,
    filePaths: string[],
    contentMap: Map<string, string>,
    question?: string,
    maxContentLength: number = DEFAULT_MAX_CONTENT_LENGTH
): string {
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
            const truncated = content.length > maxContentLength
                ? content.substring(0, maxContentLength) + '\n... (内容过长已截断)'
                : content;
            prompt += truncated;
            prompt += '\n```\n\n';
        }
    }

    if (question) {
        prompt += `\n## 我的问题\n${question}`;
    } else {
        prompt += '\n## 我的问题\n请分析以上文件列表和文件内容';
    }

    return prompt;
}
