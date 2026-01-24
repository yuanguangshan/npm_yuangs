"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutionId = createExecutionId;
exports.createExecutionRecord = createExecutionRecord;
exports.serializeExecutionRecord = serializeExecutionRecord;
exports.deserializeExecutionRecord = deserializeExecutionRecord;
function createExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function createExecutionRecord(commandName, requirement, config, matchResult, outcome = {}, command, rawInput, mode) {
    const version = require('../../package.json').version;
    return {
        id: createExecutionId(),
        meta: {
            commandName,
            timestamp: new Date().toISOString(),
            toolVersion: version,
            projectPath: process.cwd(),
            rawInput,
            mode,
            version,
            replayable: true,
        },
        intent: {
            required: requirement.required.map(String),
            preferred: requirement.preferred.map(String),
            capabilityVersion: require('./capabilities').CAPABILITY_VERSION,
        },
        configSnapshot: config,
        decision: {
            candidateModels: matchResult.candidates || [],
            selectedModel: matchResult.selected,
            usedFallback: matchResult.fallbackOccurred,
        },
        outcome: {
            success: outcome.success ?? false,
            ...outcome,
        },
        command,
    };
}
function serializeExecutionRecord(record) {
    return JSON.stringify(record, null, 2);
}
function deserializeExecutionRecord(json) {
    return JSON.parse(json);
}
//# sourceMappingURL=executionRecord.js.map