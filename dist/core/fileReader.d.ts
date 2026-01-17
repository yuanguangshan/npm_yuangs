export declare function parseFilePathsFromLsOutput(output: string): string[];
export declare function readFilesContent(filePaths: string[]): Map<string, string>;
export declare function buildPromptWithFileContent(originalOutput: string, filePaths: string[], contentMap: Map<string, string>, question?: string): string;
