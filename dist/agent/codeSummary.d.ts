/**
 * 代码摘要生成器
 * 通过AST/Symbol级分析生成代码结构摘要，减少Token使用
 */
export interface FileSummary {
    path: string;
    summary: string;
    symbols: Symbol[];
}
export interface Symbol {
    name: string;
    type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'interface' | 'type' | 'enum';
    line?: number;
    signature?: string;
}
/**
 * 从代码中提取符号（优先AST，回退到正则）
 */
export declare function extractSymbols(code: string, filename: string): Symbol[];
/**
 * 生成文件摘要
 */
export declare function generateFileSummary(filePath: string, content: string): FileSummary;
/**
 * 生成多文件摘要
 */
export declare function generateMultipleFileSummaries(files: Array<{
    path: string;
    content: string;
}>): Promise<FileSummary[]>;
/**
 * 生成摘要报告（用于注入到Prompt）
 */
export declare function generateSummaryReport(summaries: FileSummary[], maxLength?: number): string;
