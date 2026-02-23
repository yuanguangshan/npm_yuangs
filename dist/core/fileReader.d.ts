export interface ReadFilesContentOptions {
    showProgress?: boolean;
    concurrency?: number;
}
export declare function parseFilePathsFromLsOutput(output: string): string[];
export declare function readFilesContent(filePaths: string[], options?: ReadFilesContentOptions): Promise<Map<string, string>>;
export declare function readFilesContentSync(filePaths: string[]): Map<string, string>;
export declare function buildPromptWithFileContent(originalOutput: string, filePaths: string[], contentMap: Map<string, string>, question?: string): string;
