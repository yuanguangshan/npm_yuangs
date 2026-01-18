import fs from 'fs/promises';
import path from 'path';
import { PendingContextItem, SamplingStrategy } from '../policy/token/types';

/**
 * SyntaxHandler - 语法解析器和延迟加载生成器
 *
 * 职责：
 * - 解析 @file 和 #dir 语法
 * - 返回 PendingContextItem[]（不读取内容）
 * - 提供 estimate() 和 resolve() 方法
 */
export class SyntaxHandler {
    static parse(tokens: string[]): PendingContextItem[] {
        const items: PendingContextItem[] = [];

        for (const token of tokens) {
            if (token.startsWith('@')) {
                const item = this.parseFileToken(token);
                if (item) items.push(item);
            } else if (token.startsWith('#')) {
                const item = this.parseDirToken(token);
                if (item) items.push(item);
            }
        }

        return items;
    }

    /**
     * 解析文件引用 @file:path:start-end
     */
    private static parseFileToken(token: string): PendingContextItem | null {
        const raw = token.slice(1);
        const { filePath, range } = this.parsePathAndRange(raw);

        if (!filePath) return null;

        const absPath = path.resolve(filePath);

        return {
            id: absPath,
            type: 'file',
            originalToken: token,
            samplingStrategy: 'head_tail',

            estimate: async () => {
                try {
                    const stat = await fs.stat(absPath);
                    return { byteSize: stat.size };
                } catch (error: any) {
                    throw error;
                }
            },

            resolve: async () => {
                let content = await fs.readFile(absPath, 'utf-8');

                if (range) {
                    content = this.applyRange(content, range);
                }

                return {
                    content,
                    byteSize: Buffer.byteLength(content, 'utf-8'),
                    lineCount: content.split('\n').length
                };
            }
        };
    }

    /**
     * 解析目录引用 #dir
     */
    private static parseDirToken(token: string): PendingContextItem | null {
        const dir = token.slice(1);
        const absPath = path.resolve(dir);

        return {
            id: absPath,
            type: 'dir',
            originalToken: token,
            samplingStrategy: 'head_tail',

            estimate: async () => {
                try {
                    const files = await this.scanDir(absPath);
                    let total = 0;
                    for (const f of files) {
                        const stat = await fs.stat(f);
                        total += stat.size;
                    }
                    return { byteSize: total };
                } catch (error: any) {
                    throw error;
                }
            },

            resolve: async () => {
                const files = await this.scanDir(absPath);
                let content = '';
                for (const f of files) {
                    content += `\n// ===== ${f} =====\n`;
                    content += await fs.readFile(f, 'utf-8');
                }
                return {
                    content,
                    byteSize: Buffer.byteLength(content, 'utf-8')
                };
            }
        };
    }

    /**
     * 解析路径和行号范围
     */
    private static parsePathAndRange(raw: string): {
        filePath: string;
        range?: { start: number; end: number };
    } {
        const match = raw.match(/^(.*?)(?::(\d+)-(\d+))?$/);
        if (!match) return { filePath: raw };

        const [, filePath, start, end] = match;
        if (!start || !end) return { filePath };

        return {
            filePath,
            range: { start: Number(start), end: Number(end) }
        };
    }

    /**
     * 应用行号范围
     */
    private static applyRange(
        content: string,
        range?: { start: number; end: number }
    ): string {
        if (!range) return content;
        const lines = content.split('\n');
        return lines.slice(range.start - 1, range.end).join('\n');
    }

    /**
     * 扫描目录（递归）
     */
    private static async scanDir(dirPath: string): Promise<string[]> {
        const files: string[] = [];

        async function scan(dirPath: string) {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        }

        await scan(dirPath);
        return files;
    }
}
