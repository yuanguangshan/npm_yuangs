/**
 * X-Resolver: Cross-File Symbol Dependency Resolver
 *
 * 跨文件符号依赖解析器 - yuangs 的全域感知核心
 *
 * 核心功能：
 * 1. 探测目标文件的所有导出符号（函数、类、接口、类型）
 * 2. 搜索项目中所有引用这些符号的文件
 * 3. 提取相关的代码片段和 JSDoc 文档
 * 4. 为 Agent 提供跨文件上下文感知
 */
import { EnhancedASTParser, SymbolMetadata } from './ASTParser';
import { FastScanner } from './FastScanner';
/**
 * 符号影响分析结果
 */
export interface SymbolImpact {
    /** 消费者文件路径 */
    filePath: string;
    /** 使用的导出符号列表 */
    symbols: string[];
    /** 相关代码片段（经过智能切片） */
    snippet: string;
    /** 符号的 JSDoc 文档 */
    jsDoc?: string;
}
/**
 * X-Resolver 解析结果
 */
export interface XResolverResult {
    /** 目标文件路径 */
    targetFile: string;
    /** 导出的符号列表 */
    exportedSymbols: SymbolMetadata[];
    /** 受影响的使用者列表 */
    impacts: SymbolImpact[];
    /** 扫描耗时（毫秒） */
    duration: number;
}
/**
 * 跨文件符号解析器
 *
 * 为 yuangs Agent 提供跨文件依赖感知能力
 */
export declare class XResolver {
    private astParser;
    private scanner;
    constructor(astParser?: EnhancedASTParser, scanner?: FastScanner);
    /**
     * 分析目标文件的跨文件影响域
     *
     * @param targetFilePath - 要分析的目标文件路径
     * @returns 跨文件影响分析结果
     */
    getImpactAnalysis(targetFilePath: string): Promise<XResolverResult>;
    /**
     * 从消费者文件中提取相关上下文
     */
    private extractImpactContext;
    /**
     * 提取相关代码片段（智能切片）
     */
    private extractRelevantSnippet;
    /**
     * 聚合符号的 JSDoc
     */
    private getAggregatedJSDoc;
    /**
     * 渲染为 AI 友好的上下文格式
     */
    renderAsAIContext(result: XResolverResult): string;
    /**
     * 快捷方法：仅获取导出符号
     */
    getExportedSymbols(filePath: string): Promise<SymbolMetadata[]>;
}
