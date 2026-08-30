export interface ReadFilesContentOptions {
    showProgress?: boolean;
    concurrency?: number;
    maxFileSize?: number;
    maxContentLength?: number;
    encoding?: BufferEncoding;
}
export declare function parseFilePathsFromLsOutput(output: string): string[];
export declare function readFilesContent(filePaths: string[], options?: ReadFilesContentOptions): Promise<Map<string, string>>;
/**
 * @deprecated 优先使用异步 readFilesContent，避免同步阻塞
 * 同步版本现增加大小与数量限制，最多处理20个文件且单文件>1MB跳过
 */
export declare function readFilesContentSync(filePaths: string[]): Map<string, string>;
export declare function buildPromptWithFileContent(originalOutput: string, filePaths: string[], contentMap: Map<string, string>, question?: string, maxContentLength?: number): string;
