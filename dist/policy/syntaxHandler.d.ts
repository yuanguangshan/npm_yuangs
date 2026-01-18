import { PendingContextItem } from '../policy/token/types';
/**
 * SyntaxHandler - 语法解析器和延迟加载生成器
 *
 * 职责：
 * - 解析 @file 和 #dir 语法
 * - 返回 PendingContextItem[]（不读取内容）
 * - 提供 estimate() 和 resolve() 方法
 */
export declare class SyntaxHandler {
    static parse(tokens: string[]): PendingContextItem[];
    /**
     * 解析文件引用 @file:path:start-end
     */
    private static parseFileToken;
    /**
     * 解析目录引用 #dir
     */
    private static parseDirToken;
    /**
     * 解析路径和行号范围
     */
    private static parsePathAndRange;
    /**
     * 应用行号范围
     */
    private static applyRange;
    /**
     * 扫描目录（递归）
     */
    private static scanDir;
}
