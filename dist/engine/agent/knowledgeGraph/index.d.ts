import { KGNode, KGEdge, KGEdgeType } from './types';
export declare function recordNode<T = any>(node: KGNode<T>): void;
export declare function recordEdge(edge: {
    from: string;
    to: string;
    type: KGEdgeType;
    metadata?: any;
}): void;
export declare function getNode<T = any>(id: string): KGNode<T> | null;
export declare function getEdges(from?: string, to?: string, type?: KGEdgeType): KGEdge[];
export declare function getObservationNode(id: string): KGNode | null;
