"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replay = replay;
const llm_1 = require("./llm");
const interpret_1 = require("./interpret");
async function replay(record) {
    console.log(`\nReplaying execution: ${record.id}`);
    console.log(`Original timestamp: ${new Date(record.timestamp).toISOString()}`);
    console.log(`Mode: ${record.mode}\n`);
    const result = await (0, llm_1.runLLM)({
        prompt: record.prompt,
        model: record.model,
        stream: record.mode === 'chat',
        onChunk: record.mode === 'chat'
            ? (s) => process.stdout.write(s)
            : undefined,
    });
    // Create a minimal intent for interpretation
    const intent = {
        type: record.mode === 'chat' ? 'chat' : 'shell',
        capabilities: {},
    };
    return (0, interpret_1.interpretResultToPlan)(result, intent, record.mode);
}
//# sourceMappingURL=replay.js.map