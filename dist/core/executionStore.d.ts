import { ExecutionRecord } from './executionRecord';
export declare function ensureRecordDir(): void;
export declare function saveExecutionRecord(record: ExecutionRecord): string;
export declare function loadExecutionRecord(id: string): ExecutionRecord | null;
export declare function listExecutionRecords(limit?: number): ExecutionRecord[];
export declare function deleteExecutionRecord(id: string): boolean;
export declare function clearAllExecutionRecords(): void;
