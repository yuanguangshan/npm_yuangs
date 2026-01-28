/**
 * 代码生成结果
 */
export interface GeneratedCode {
    files: Array<{
        path: string;
        content: string;
        action: 'create' | 'modify';
    }>;
    rawOutput: string;
}
/**
 * 从 LLM 输出中解析文件路径和代码
 */
export declare function parseGeneratedCode(llmOutput: string): GeneratedCode;
/**
 * 将生成的代码写入文件系统
 */
export declare function writeGeneratedCode(generated: GeneratedCode, baseDir?: string): Promise<{
    written: string[];
    skipped: string[];
}>;
/**
 * 保存原始输出到临时文件
 */
export declare function saveRawOutput(content: string, taskIndex: number, baseDir?: string): Promise<string>;
