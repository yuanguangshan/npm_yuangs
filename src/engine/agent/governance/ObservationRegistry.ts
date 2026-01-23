import crypto from 'crypto';
import { recordNode, recordEdge } from '../knowledgeGraph';
import { ObservationNode } from '../knowledgeGraph/types';

export function recordObservationNode(input: {
  kind: ObservationNode['kind'];
  rawContent: string;
  originatingActionId?: string;
}): string {
  const id = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const contentHash = crypto
    .createHash('sha256')
    .update(input.rawContent)
    .digest('hex');

  recordNode<ObservationNode>({
    id,
    type: 'observation',
    timestamp: Date.now(),
    payload: {
      id,
      timestamp: Date.now(),
      kind: input.kind,
      contentHash,
      rawContent: input.rawContent,
      originatingActionId: input.originatingActionId
    }
  });

  if (input.originatingActionId) {
    recordEdge({
      from: input.originatingActionId,
      to: id,
      type: 'CAUSED_BY'
    });
  }

  return id;
}
