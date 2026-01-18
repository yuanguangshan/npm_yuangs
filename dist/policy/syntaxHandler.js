"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxHandler = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * SyntaxHandler - 语法解析器和延迟加载生成器
 *
 * 职责：
 * - 解析 @file 和 #dir 语法
 * - 返回 PendingContextItem[]（不读取内容）
 * - 提供 estimate() 和 resolve() 方法
 */
class SyntaxHandler {
    static parse(tokens) {
        const items = [];
        for (const token of tokens) {
            if (token.startsWith('@')) {
                const item = this.parseFileToken(token);
                if (item)
                    items.push(item);
            }
            else if (token.startsWith('#')) {
                const item = this.parseDirToken(token);
                if (item)
                    items.push(item);
            }
        }
        return items;
    }
    /**
     * 解析文件引用 @file:path:start-end
     */
    static parseFileToken(token) {
        const raw = token.slice(1);
        const { filePath, range } = this.parsePathAndRange(raw);
        if (!filePath)
            return null;
        const absPath = path_1.default.resolve(filePath);
        return {
            id: absPath,
            type: 'file',
            originalToken: token,
            samplingStrategy: 'head_tail',
            estimate: async () => {
                try {
                    const stat = await promises_1.default.stat(absPath);
                    return { byteSize: stat.size };
                }
                catch (error) {
                    throw error;
                }
            },
            resolve: async () => {
                let content = await promises_1.default.readFile(absPath, 'utf-8');
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
    static parseDirToken(token) {
        const dir = token.slice(1);
        const absPath = path_1.default.resolve(dir);
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
                        const stat = await promises_1.default.stat(f);
                        total += stat.size;
                    }
                    return { byteSize: total };
                }
                catch (error) {
                    throw error;
                }
            },
            resolve: async () => {
                const files = await this.scanDir(absPath);
                let content = '';
                for (const f of files) {
                    content += `\n// ===== ${f} =====\n`;
                    content += await promises_1.default.readFile(f, 'utf-8');
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
    static parsePathAndRange(raw) {
        const match = raw.match(/^(.*?)(?::(\d+)-(\d+))?$/);
        if (!match)
            return { filePath: raw };
        const [, filePath, start, end] = match;
        if (!start || !end)
            return { filePath };
        return {
            filePath,
            range: { start: Number(start), end: Number(end) }
        };
    }
    /**
     * 应用行号范围
     */
    static applyRange(content, range) {
        if (!range)
            return content;
        const lines = content.split('\n');
        return lines.slice(range.start - 1, range.end).join('\n');
    }
    /**
     * 扫描目录（递归）
     */
    static async scanDir(dirPath) {
        const files = [];
        async function scan(dirPath) {
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                }
                else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        }
        await scan(dirPath);
        return files;
    }
}
exports.SyntaxHandler = SyntaxHandler;
//# sourceMappingURL=syntaxHandler.js.map