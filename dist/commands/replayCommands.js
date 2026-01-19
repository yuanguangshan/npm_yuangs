"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReplayCommands = registerReplayCommands;
const chalk_1 = __importDefault(require("chalk"));
const capabilitySystem_1 = require("../core/capabilitySystem");
const replayDiff_1 = require("../core/replayDiff");
const executionStore_1 = require("../core/executionStore");
function registerReplayCommands(program) {
    program
        .command('replay <id>')
        .description('Replay an execution')
        .option('-s, --strict', 'Strict replay (use exact model)')
        .option('-c, --compatible', 'Compatible replay (allow fallback)')
        .option('-r, --re-evaluate', 'Re-evaluate with current config')
        .option('-v, --verbose', 'Verbose output')
        .option('--dry', 'Dry run - show what would happen without executing')
        .option('--explain', 'Show explanation before replay')
        .option('--diff', 'Show diff between original and current config')
        .action(async (id, options) => {
        const system = new capabilitySystem_1.CapabilitySystem();
        let mode = 'strict';
        if (options.compatible)
            mode = 'compatible';
        if (options.reEvaluate)
            mode = 're-evaluate';
        // Handle diff option
        if (options.diff) {
            const record = (0, executionStore_1.loadExecutionRecord)(id);
            if (!record) {
                console.log(chalk_1.default.red(`❌ Execution record "${id}" not found\n`));
                return;
            }
            // Create a "current" record with current config
            const currentConfig = system.loadMergedConfig();
            const currentRecord = {
                ...record,
                configSnapshot: currentConfig,
                decision: {
                    ...record.decision,
                    // In a real scenario, we'd re-evaluate the decision
                    // For now, use the same decision
                },
            };
            const diff = (0, replayDiff_1.diffExecution)(record, currentRecord);
            console.log((0, replayDiff_1.formatReplayDiff)(diff));
            // If --diff is combined with --dry, exit after showing diff
            if (options.dry) {
                console.log(chalk_1.default.gray('\n[Dry] Diff shown, no execution\n'));
                return;
            }
            // Otherwise, proceed with replay
            console.log('');
        }
        const result = await system.replayExecution(id, {
            mode,
            skipAI: true,
            verbose: options.verbose,
            dry: options.dry,
            explain: options.explain,
        });
        if (result.success) {
            console.log(chalk_1.default.green(`✅ ${result.message}`));
            if (result.executedModel) {
                console.log(chalk_1.default.gray(`Model: ${result.executedModel}`));
            }
        }
        else {
            console.log(chalk_1.default.red(`❌ ${result.message}`));
        }
    });
}
//# sourceMappingURL=replayCommands.js.map