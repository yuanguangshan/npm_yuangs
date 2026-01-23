export type KGNodeType =
  | 'context'
  | 'execution'
  | 'skill'
  | 'observation';

export type KGEdgeType =
  | 'USED_IN'          // Context -> Execution
  | 'VALIDATED_BY'     // Execution -> Skill
  | 'PROMOTED_TO'      // Context -> Skill
  | 'CAUSED_BY'        // Action -> Observation
  | 'ACKNOWLEDGED_BY'; // Observation -> Execution ⭐核心因果锁

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
