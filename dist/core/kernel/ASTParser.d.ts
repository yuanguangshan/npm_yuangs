/**
 * Enhanced AST Parser for X-Resolver
 *
 * 增强版 AST 解析器，支持：
 * 1. 提取导出符号（函数、类、接口、类型别名）
 * 2. 提取 JSDoc 注释和标签
 * 3. 提供符号的完整元数据（名称、类型、JSDoc、行号等）
 *
 * 使用 TypeScript Compiler API 实现精确解析
 */
/**
 * 符号元数据接口
 */
export interface SymbolMetadata {
    /** 符号名称 */
    name: string;
    /** 符号类型 */
    kind: string;
    /** JSDoc 注释内容 */
    jsDoc: string;
    /** 起始行号（从1开始） */
    startLine: number;
    /** 是否已导出 */
    isExported: boolean;
}
/**
 * AST 解析结果
 */
export interface ASTParseResult {
    /** 提取的符号列表 */
    symbols: SymbolMetadata[];
    /** 解析是否成功 */
    success: boolean;
    /** 错误信息（如果失败） */
    error?: string;
}
/**
 * 增强版 AST 解析器
 *
 * 为 X-Resolver 提供精确的符号提取能力
 */
export declare class EnhancedASTParser {
    /**
     * 从文件中提取导出符号及其 JSDoc
     *
     * @param filePath - 要解析的文件路径
     * @returns 包含符号元数据的解析结果
     */
    parseFile(filePath: string): Promise<ASTParseResult>;
    /**
     * 从代码字符串中提取导出符号及其 JSDoc
     *
     * @param code - 要解析的代码字符串
     * @param filePath - 文件路径（用于错误消息和行号计算）
     * @returns 包含符号元数据的解析结果
     */
    parse(code: string, filePath: string): ASTParseResult;
    /**
     * 递归遍历 AST 节点，提取导出符号及其 JSDoc
     *
     * @param node - AST 节点
     * @param symbols - 符号列表（输出参数）
     */
    private visitAndExtractSymbols;
    /**
     * 从节点提取 JSDoc 注释
     *
     * @param node - AST 节点
     * @returns 提取的 JSDoc 文档字符串
     */
    private extractJSDoc;
    /**
     * 将 TypeScript 节点类型映射为可读字符串
     *
     * @param kind - TypeScript 语法种类
     * @returns 可读的符号类型字符串
     */
    private mapNodeKindToString;
    /**
     * 获取文件中所有导出的符号名称（快捷方法）
     *
     * @param filePath - 文件路径
     * @returns 导出符号名称数组
     */
    getExportedSymbolNames(filePath: string): Promise<string[]>;
}
