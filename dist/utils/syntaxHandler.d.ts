export declare function handleSpecialSyntax(input: string, stdinData?: string): Promise<{
    processed: boolean;
    result?: string;
    isPureReference?: boolean;
    error?: boolean;
    itemCount?: number;
    type?: 'file' | 'directory' | 'command' | 'management';
}>;
/**
 * 带引号支持的 Tokenizer (导用于测试)
 * 支持转义字符 \ 和引号包裹
 */
export declare function tokenizeWithQuotes(input: string): {
    tokens: string[];
    isQuoted: boolean[];
};
/**
 * 解析增强的路径语法 (识别路径列表与同行提问)
 *
 * 💡 识别优先级与规则 (Heuristic Rules):
 * 1. 引号包裹: 只要被 "" 或 '' 包裹，一律视为文件路径 (支持空格)。
 * 2. 范围语法: 符合 n-m 格式且为数字，视为上下文序号范围。
 * 3. 磁盘存在: 如果字符串在当前工作目录真实存在 (文件或目录)，视为路径。
 *    - 注意：如果文件名叫 "1" 且磁盘存在，它会覆盖序号 1 的语义 (文件优先)。
 * 4. 上下文索引: 如果是纯数字且在当前 ContextBuffer 范围内，视为序号引用。
 * 5. 提问边界: 遇到第一个不满足上述任何条件的单词时，该单词及其后内容均识别为提问。
 */
export declare function resolveFilePathsAndQuestion(input: string): Promise<{
    filePaths: string[];
    extraQuestion?: string;
}>;
