/**
 * Enhanced AST Parser for Auditable Execution Kernel
 *
 * 增强版 AST 解析器，作为内核的 "事实提取器"，支持：
 * 1. 提取导出符号（函数、类、接口、类型别名、变量等）
 * 2. 提取 JSDoc 注释和标签
 * 3. 提供符号的完整元数据（名称、类型、JSDoc、行号、符号哈希等）
 * 4. 支持嵌套结构（类中的方法、函数中的函数等）
 * 5. 处理匿名函数和箭头函数
 * 6. 生成符号哈希用于审计验证
 * 7. 集成 TypeChecker 以支持跨文件类型解析
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
    /** 结束行号（从1开始） */
    endLine: number;
    /** 是否已导出 */
    isExported: boolean;
    /** 符号内容的哈希值（用于审计验证） */
    hash: string;
    /** 符号的完整源码内容 */
    content: string;
    /** 访问修饰符（public, private, protected） */
    accessibility?: 'public' | 'private' | 'protected';
    /** 参数列表（如果是函数/方法） */
    parameters?: ParameterInfo[];
    /** 返回类型（如果是函数） */
    returnType?: string;
    /** 泛型参数（如果有） */
    typeParameters?: string[];
    /** 父级符号名称（用于嵌套结构） */
    parentName?: string;
    /** 是否是匿名函数 */
    isAnonymous?: boolean;
    /** 符号的完整路径（如：ClassName.methodName） */
    fullPath?: string;
}
/**
 * 参数信息接口
 */
export interface ParameterInfo {
    name: string;
    type: string;
    optional: boolean;
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
 * 作为可审计执行内核的 "事实提取器"，提供精确的符号提取能力
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
     * @param parentStack - 父级符号栈（用于嵌套结构）
     * @param typeChecker - TypeScript 类型检查器
     */
    private visitAndExtractSymbols;
    /**
     * Extract modifier information (export, access modifiers) from a node
     */
    private extractModifiers;
    /**
     * Extract symbol information from a node
     */
    private extractSymbolInfo;
    /**
     * 判断是否应将符号推入父级栈
     */
    private shouldPushToParentStack;
    /**
     * 生成匿名函数的唯一名称
     */
    private generateAnonymousName;
    /**
     * 提取函数参数信息
     */
    private extractParameters;
    /**
     * 提取类型信息
     */
    private extractType;
    /**
     * 从节点提取 JSDoc 注释
     *
     * @param node - AST 节点
     * @returns 提取的 JSDoc 文档字符串
     */
    private extractJSDoc;
    /**
     * 计算内容的哈希值（用于审计验证）
     */
    private calculateHash;
    /**
     * 规范化代码（移除空格和注释） using AST-based approach to avoid issues with string literals
     */
    private normalizeCode;
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
    /**
     * 比较两个解析结果，找出差异（用于审计目的）
     */
    compareResults(oldResult: ASTParseResult, newResult: ASTParseResult): {
        added: SymbolMetadata[];
        removed: SymbolMetadata[];
        modified: SymbolMetadata[];
    };
    /**
     * 将庞大的文件内容压缩为"语义摘要"
     * 仅保留 Export 声明和 JSDoc，剔除函数体实现
     */
    generateSummary(filePath: string, content: string): string;
}
