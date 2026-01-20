export interface DiffFile {
    file: string;
    additions: number;
    deletions: number;
    hunks: string[];
}
export declare function parseUnifiedDiff(diff: string): DiffFile[];
export declare function extractFilesFromDiff(diff: string): string[];
export declare function assessRisk(files: DiffFile[]): {
    level: "low" | "medium" | "high";
    warnings: string[];
};
