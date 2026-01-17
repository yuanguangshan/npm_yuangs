"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayEngine = exports.ReplayEngine = void 0;
const chalk_1 = __importDefault(require("chalk"));
const executionStore_1 = require("./executionStore");
class ReplayEngine {
    async replay(recordId, options = { mode: 'strict' }) {
        const record = (0, executionStore_1.loadExecutionRecord)(recordId);
        if (!record) {
            return {
                success: false,
                message: `Execution record ${recordId} not found`,
            };
        }
        if (options.mode === 'strict') {
            return this.strictReplay(record, options);
        }
        if (options.mode === 'compatible') {
            return this.compatibleReplay(record, options);
        }
        return this.reEvaluate(record, options);
    }
    async strictReplay(record, options) {
        const selectedModel = record.decision.selectedModel;
        if (options.verbose) {
            console.log(chalk_1.default.cyan('[Strict Replay]'));
            console.log(chalk_1.default.gray(`  Original Model: ${selectedModel?.name || 'N/A'}`));
            console.log(chalk_1.default.gray(`  Original Provider: ${selectedModel?.provider || 'N/A'}`));
            console.log(chalk_1.default.gray(`  Original Timestamp: ${record.meta.timestamp}`));
            console.log(chalk_1.default.gray(`  Original Command: ${record.meta.commandName}`));
        }
        if (options.skipAI) {
            return {
                success: true,
                message: 'Strict replay prepared (AI execution skipped)',
                executedModel: selectedModel?.name ?? undefined,
            };
        }
        if (!record.command) {
            return {
                success: false,
                message: 'Strict replay: No command to execute (command not stored in record)',
                executedModel: selectedModel?.name ?? undefined,
            };
        }
        const { exec } = require('./executor');
        try {
            console.log(chalk_1.default.gray('[Strict Replay] Executing with original parameters...'));
            const result = await exec(record.command);
            return {
                success: result.code === 0 || result.code === null,
                message: result.code === 0 || result.code === null
                    ? 'Strict replay completed successfully'
                    : `Strict replay failed with code ${result.code}`,
                executedModel: selectedModel?.name ?? undefined,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                message: `Strict replay error: ${message}`,
                executedModel: selectedModel?.name ?? undefined,
            };
        }
    }
    async compatibleReplay(record, options) {
        const originalModel = record.decision.selectedModel;
        if (options.verbose) {
            console.log(chalk_1.default.cyan('[Compatible Replay]'));
            console.log(chalk_1.default.gray(`  Original Model: ${originalModel?.name || 'N/A'}`));
            console.log(chalk_1.default.gray(`  Will attempt fallback if original unavailable`));
        }
        return {
            success: false,
            message: 'Compatible replay not yet implemented in Phase 1',
            executedModel: originalModel?.name,
            deviationReason: 'Phase 1 only supports strict replay',
        };
    }
    async reEvaluate(record, options) {
        if (options.verbose) {
            console.log(chalk_1.default.cyan('[Re-evaluate]'));
            console.log(chalk_1.default.gray(`  Will re-run capability matching with current config`));
            console.log(chalk_1.default.gray(`  Original Intent: ${record.intent.required.join(', ')}`));
        }
        return {
            success: false,
            message: 'Re-evaluate not yet implemented in Phase 1',
        };
    }
}
exports.ReplayEngine = ReplayEngine;
exports.replayEngine = new ReplayEngine();
//# sourceMappingURL=replayEngine.js.map