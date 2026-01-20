export interface SerializedAction {
    id: string;
    kind: string;
    state: string;
    payload: any;
    rationale: string;
    provenance: any;
    updatedAt: number;
    executedAt?: number;
}
export declare function ensureDataDir(): void;
export declare function atomicWrite(filePath: string, data: string): void;
export declare function loadActions(): Record<string, SerializedAction>;
export declare function saveActions(actions: Record<string, SerializedAction>): void;
export declare function deserializeActions(data: Record<string, any>): Record<string, SerializedAction>;
export declare function auditActions(actions: Record<string, SerializedAction>): void;
