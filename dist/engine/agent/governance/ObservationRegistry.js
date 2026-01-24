"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordObservationNode = recordObservationNode;
const crypto_1 = __importDefault(require("crypto"));
const knowledgeGraph_1 = require("../knowledgeGraph");
function recordObservationNode(input) {
    const id = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const contentHash = crypto_1.default
        .createHash('sha256')
        .update(input.rawContent)
        .digest('hex');
    (0, knowledgeGraph_1.recordNode)({
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
        (0, knowledgeGraph_1.recordEdge)({
            from: input.originatingActionId,
            to: id,
            type: 'CAUSED_BY'
        });
    }
    return id;
}
//# sourceMappingURL=ObservationRegistry.js.map