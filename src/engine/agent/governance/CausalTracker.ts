import { getNode, recordEdge } from '../knowledgeGraph';
import { GovernanceError } from './errors';
import { KGEdgeType } from '../knowledgeGraph/types';

export class CausalTracker {
  static recordCausalLink(
    obsId: string,
    executionId: string,
    ackText: string
  ) {
    const obsNode = getNode<any>(obsId);

    if (!obsNode) {
      throw new GovernanceError(`Observation ${obsId} not found`);
    }

    if (!this.verifyAck(obsNode.payload.rawContent, ackText)) {
      throw new GovernanceError(
        'Causal Break: ACK does not match physical Observation'
      );
    }

    recordEdge({
      from: obsId,
      to: executionId,
      type: 'ACKNOWLEDGED_BY' as KGEdgeType,
      metadata: {
        verified: true,
        contentHash: obsNode.payload.contentHash
      }
    });
  }

  private static verifyAck(actual: string, acked: string): boolean {
    return actual.trim() === acked.trim();
  }
}
