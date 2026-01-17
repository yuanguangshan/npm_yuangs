"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = buildContext;
exports.getAgentContextBuffer = getAgentContextBuffer;
const contextBuffer_1 = require("../commands/contextBuffer");
// Create a singleton instance for the agent
const globalContextBuffer = new contextBuffer_1.ContextBuffer();
function buildContext(input) {
    const items = globalContextBuffer.export();
    return {
        files: items.map(item => ({
            path: item.path,
            content: item.content,
        })),
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}
function getAgentContextBuffer() {
    return globalContextBuffer;
}
//# sourceMappingURL=context.js.map