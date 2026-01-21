"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectionAgent = void 0;
const executionStore_1 = require("../core/executionStore");
const contextStorage_1 = require("../commands/contextStorage");
class ReflectionAgent {
    static async run(limit = 20) {
        const records = (0, executionStore_1.listExecutionRecords)(limit);
        if (records.length === 0)
            return;
        const failures = records.filter(r => !r.outcome.success);
        const successes = records.filter(r => r.outcome.success);
        const memories = [];
        if (failures.length > 0) {
            memories.push({
                type: 'memory',
                path: 'reflection:failures',
                summary: 'Recent high-risk failures',
                content: failures.slice(0, 5)
                    .map(f => `❌ ${f.meta.commandName}`)
                    .join('\n'),
                importance: 0.8,
                lastUsedAt: Date.now(),
                id: `reflection:failures:${Date.now()}`,
                tokens: 0
            });
        }
        if (successes.length > 0) {
            memories.push({
                type: 'memory',
                path: 'reflection:success',
                summary: 'Recent stable successes',
                content: successes.slice(0, 5)
                    .map(s => `✅ ${s.meta.commandName}`)
                    .join('\n'),
                importance: 0.5,
                lastUsedAt: Date.now(),
                id: `reflection:success:${Date.now()}`,
                tokens: 0
            });
        }
        if (memories.length > 0) {
            await (0, contextStorage_1.saveContext)(memories);
        }
    }
}
exports.ReflectionAgent = ReflectionAgent;
//# sourceMappingURL=ReflectionAgent.js.map