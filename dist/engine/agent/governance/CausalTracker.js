"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CausalTracker = void 0;
const knowledgeGraph_1 = require("../knowledgeGraph");
const errors_1 = require("./errors");
class CausalTracker {
    static recordCausalLink(obsId, executionId, ackText) {
        const obsNode = (0, knowledgeGraph_1.getNode)(obsId);
        if (!obsNode) {
            throw new errors_1.GovernanceError(`Observation ${obsId} not found`);
        }
        if (!this.verifyAck(obsNode.payload.rawContent, ackText)) {
            throw new errors_1.GovernanceError('Causal Break: ACK does not match physical Observation');
        }
        (0, knowledgeGraph_1.recordEdge)({
            from: obsId,
            to: executionId,
            type: 'ACKNOWLEDGED_BY',
            metadata: {
                verified: true,
                contentHash: obsNode.payload.contentHash
            }
        });
    }
    static verifyAck(actual, acked) {
        return actual.trim() === acked.trim();
    }
}
exports.CausalTracker = CausalTracker;
//# sourceMappingURL=CausalTracker.js.map