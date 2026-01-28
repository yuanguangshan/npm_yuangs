export interface ContextProvenance {
    source: string;
    ref?: string;
    timeRange?: {
        start: string;
        end: string;
    };
}
export interface ClippedInfo {
    reason: string;
    droppedItems: string[];
}
export interface ContextMeta {
    confidence: number;
    confidenceReason: string;
    provenance: ContextProvenance;
    clipped?: ClippedInfo;
    timestamp: string;
    version: string;
}
export declare class ContextMetaBuilder {
    private meta;
    setConfidence(value: number, reason: string): ContextMetaBuilder;
    setProvenance(source: string, ref?: string, timeRange?: ContextProvenance['timeRange']): ContextMetaBuilder;
    setClipped(reason: string, droppedItems: string[]): ContextMetaBuilder;
    build(): ContextMeta;
    static fromPartial(partial: Partial<ContextMeta>): ContextMeta;
}
export declare function toAuditLog(meta: ContextMeta): string;
export declare function mergeMetas(metas: ContextMeta[]): ContextMeta;
