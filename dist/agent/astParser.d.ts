/**
 * AST Parser for TypeScript/JavaScript
 *
 * 使用 TypeScript Compiler API 进行真正的 AST 级别符号提取
 * 替代正则表达式，提供更准确的结构化摘要
 */
import { Symbol } from './codeSummary';
export interface ASTParseResult {
    symbols: Symbol[];
    success: boolean;
    error?: string;
}
/**
 * TypeScript/JavaScript AST 解析器
 */
export declare class TypeScriptASTParser {
    /**
     * 从源代码提取符号
     */
    static parse(code: string, filePath: string): ASTParseResult;
    /**
     * 递归遍历 AST 提取符号
     */
    private static extractSymbols;
    /**
     * 检查节点是否有导出修饰符
     */
    private static hasExportModifier;
    /**
     * 添加符号到列表
     */
    private static addSymbol;
    /**
     * 获取节点签名字符串
     */
    private static getSignature;
    /**
     * 从文件路径解析并返回符号
     */
    static parseFile(filePath: string): Promise<ASTParseResult>;
    /**
     * 生成紧凑的符号摘要文本
     */
    static generateCompactSummary(symbols: Symbol[], filePath: string): string;
}
