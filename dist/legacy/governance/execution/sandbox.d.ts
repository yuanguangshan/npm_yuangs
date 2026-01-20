export interface ExecutionSnapshot {
    id: string;
    commitHash: string;
    timestamp: number;
    isClean: boolean;
}
export declare function createSnapshot(): ExecutionSnapshot;
export declare function verifySnapshot(snapshotId: string): boolean;
export declare function rollbackToSnapshot(snapshotId: string): void;
export declare function commitChanges(message: string, snapshotId: string): void;
export declare function getChangedFiles(): string[];
export declare function assertNoExtraChanges(approvedFiles: string[], actualFiles: string[]): void;
