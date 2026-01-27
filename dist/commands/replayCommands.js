"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReplayCommands = registerReplayCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const capabilitySystem_1 = require("../core/capabilitySystem");
const replayDiff_1 = require("../core/replayDiff");
const executionStore_1 = require("../core/executionStore");
const Replayer_1 = require("../audit/Replayer");
function registerReplayCommands(program) {
    program
        .command('replay <id_or_file>')
        .description('Replay an execution (ID, or "last") or SSH session (.cast file)')
        .option('-s, --strict', 'Strict replay (use exact model)')
        .option('-c, --compatible', 'Compatible replay (allow fallback)')
        .option('-r, --re-evaluate', 'Re-evaluate with current config')
        .option('-v, --verbose', 'Verbose output')
        .option('--dry', 'Dry run - show what would happen without executing')
        .option('--explain', 'Show explanation before replay')
        .option('--diff', 'Show diff between original and current config')
        .option('--speed <n>', 'Playback speed multiplier (default: 1.0)', parseFloat, 1.0)
        .action(async (idOrFile, options) => {
        // 检查是否是 .cast 文件
        if (idOrFile.endsWith('.cast') || fs.existsSync(idOrFile)) {
            try {
                const replayer = new Replayer_1.Replayer(idOrFile);
                await replayer.load();
                await replayer.play(options.speed || 1.0);
                return;
            }
            catch (error) {
                // 如果文件读取失败，或者不是正常的 cast 文件，且看起来像 ID，则继续原逻辑
                if (!idOrFile.endsWith('.cast')) {
                    // fallthrough
                }
                else {
                    console.error(chalk_1.default.red(`❌ playback failed: ${error.message}`));
                    return;
                }
            }
        }
        // === Original Logic ===
        let id = idOrFile;
        if (id === 'last') {
            const records = (0, executionStore_1.listExecutionRecords)(1);
            if (records.length === 0) {
                console.log(chalk_1.default.red('❌ No execution records found\n'));
                return;
            }
            id = records[0].id;
            console.log(chalk_1.default.gray(`Replaying most recent execution: ${id}\n`));
        }
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