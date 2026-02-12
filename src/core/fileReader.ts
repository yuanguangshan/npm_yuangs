import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import ora from 'ora';

export interface ReadFilesContentOptions {
    showProgress?: boolean;
    concurrency?: number;
}

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
    const { showProgress = true, concurrency = 5 } = options;
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
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        const content = await fs.promises.readFile(fullPath, 'utf-8');
                        return { filePath, content };
                    }
                    return null;
                } catch (error) {
                    console.error(`无法读取文件: ${filePath}`);
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

export function readFilesContentSync(filePaths: string[]): Map<string, string> {
    const contentMap = new Map<string, string>();

    for (const filePath of filePaths) {
        try {
            const fullPath = path.resolve(filePath);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                contentMap.set(filePath, content);
            }
        } catch (error) {
            console.error(`无法读取文件: ${filePath}`);
        }
    }

    return contentMap;
}

export function buildPromptWithFileContent(
    originalOutput: string,
    filePaths: string[],
    contentMap: Map<string, string>,
    question?: string
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
    } else {
        prompt += '\n## 我的问题\n请分析以上文件列表和文件内容';
    }

    return prompt;
}
