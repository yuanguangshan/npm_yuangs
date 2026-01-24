export type KGNodeType = 'context' | 'execution' | 'skill' | 'observation';
export type KGEdgeType = 'USED_IN' | 'VALIDATED_BY' | 'PROMOTED_TO' | 'CAUSED_BY' | 'ACKNOWLEDGED_BY';
export interface KGNode<T = any> {
    id: string;
    type: KGNodeType;
    payload: T;
    timestamp: number;
}
export interface KGEdge {
    from: string;
    to: string;
    type: KGEdgeType;
    metadata?: any;
    timestamp: number;
}
export interface ObservationNode {
    id: string;
    timestamp: number;
    kind: 'tool_result' | 'system_note' | 'manual_input';
    contentHash: string;
    rawContent: string;
    originatingActionId?: string;
}
