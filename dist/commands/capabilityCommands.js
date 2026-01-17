"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCapabilityCommands = registerCapabilityCommands;
const chalk_1 = __importDefault(require("chalk"));
const capabilities_1 = require("../core/capabilities");
const capabilitySystem_1 = require("../core/capabilitySystem");
const executionStore_1 = require("../core/executionStore");
function registerCapabilityCommands(program) {
    const capProgram = program.command('capabilities').description('Capability system commands (new architecture)');
    capProgram
        .command('explain')
        .description('Explain current configuration with sources')
        .action(() => {
        const system = new capabilitySystem_1.CapabilitySystem();
        console.log(chalk_1.default.bold.cyan('\n📋 Configuration Snapshot\n'));
        console.log(system.explainConfig());
    });
    capProgram
        .command('match')
        .description('Test capability matching')
        .argument('<capabilities...>', 'Required capabilities (e.g., text_generation reasoning)')
        .action((capabilities) => {
        const system = new capabilitySystem_1.CapabilitySystem();
        const { AtomicCapability } = require('../core/capabilities');
        const requirement = {
            required: capabilities,
            preferred: [],
        };
        const result = system.matchCapability(requirement);
        console.log(chalk_1.default.bold.cyan('\n🤖 Capability Match Result\n'));
        if (!result.selected) {
            console.log(chalk_1.default.red('❌ No model satisfies requirements\n'));
            result.candidates.forEach(c => {
                console.log(chalk_1.default.yellow(`${c.modelName} (${c.provider}):`));
                console.log(chalk_1.default.gray(`  ${c.reason}\n`));
            });
            return;
        }
        console.log(chalk_1.default.green(`✅ Selected: ${result.selected.name} (${result.selected.provider})\n`));
        console.log(chalk_1.default.bold('Capability coverage:'));
        result.selected.atomicCapabilities.forEach(cap => {
            console.log(chalk_1.default.green(`  ✓ ${cap}`));
        });
        if (result.fallbackOccurred) {
            console.log(chalk_1.default.yellow('\n⚠️  Fallback was used'));
        }
        console.log(chalk_1.default.bold('\nAll candidates:'));
        result.candidates.forEach(c => {
            const icon = c.hasRequired ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
            console.log(`  ${icon} ${c.modelName} (${c.provider})`);
            console.log(chalk_1.default.gray(`    ${c.reason}\n`));
        });
    });
    capProgram
        .command('list')
        .description('List all available capabilities')
        .action(() => {
        console.log(chalk_1.default.bold.cyan('\n📦 Available Capabilities\n'));
        console.log(chalk_1.default.bold('Atomic Capabilities:'));
        Object.values(capabilities_1.AtomicCapability).forEach(cap => {
            console.log(`  - ${chalk_1.default.green(cap)}`);
        });
        console.log(chalk_1.default.bold('\nComposite Capabilities:'));
        capabilities_1.COMPOSITE_CAPABILITIES.forEach(comp => {
            console.log(`  - ${chalk_1.default.cyan(comp.name)}`);
            console.log(chalk_1.default.gray(`    Composed of: ${comp.composedOf.join(', ')}`));
        });
    });
    capProgram
        .command('history')
        .description('List execution history')
        .option('-l, --limit <n>', 'Limit number of records', '10')
        .action((options) => {
        const limit = parseInt(options.limit);
        const records = (0, executionStore_1.listExecutionRecords)(limit);
        if (records.length === 0) {
            console.log(chalk_1.default.gray('📭 No execution history found\n'));
            return;
        }
        console.log(chalk_1.default.bold.cyan(`\n📋 Execution History (last ${records.length})\n`));
        records.forEach((record, idx) => {
            const status = record.outcome.success
                ? chalk_1.default.green('✓')
                : chalk_1.default.red('✗');
            const model = record.decision.selectedModel?.name || 'N/A';
            const time = new Date(record.meta.timestamp).toLocaleString();
            console.log(`${status} ${chalk_1.default.white(record.id)}`);
            console.log(chalk_1.default.gray(`  Command: ${record.meta.commandName}`));
            console.log(chalk_1.default.gray(`  Model: ${model}`));
            console.log(chalk_1.default.gray(`  Time: ${time}\n`));
        });
    });
    capProgram
        .command('replay <id>')
        .description('Replay an execution')
        .option('-s, --strict', 'Strict replay (use exact model)')
        .option('-c, --compatible', 'Compatible replay (allow fallback)')
        .option('-v, --verbose', 'Verbose output')
        .action(async (id, options) => {
        const system = new capabilitySystem_1.CapabilitySystem();
        let mode = 'strict';
        if (options.compatible)
            mode = 'compatible';
        const result = await system.replayExecution(id, {
            mode,
            skipAI: true,
            verbose: options.verbose,
        });
        if (result.success) {
            console.log(chalk_1.default.green(`\n✅ ${result.message}\n`));
            if (result.executedModel) {
                console.log(chalk_1.default.gray(`Model: ${result.executedModel}`));
            }
        }
        else {
            console.log(chalk_1.default.red(`\n❌ ${result.message}\n`));
        }
    });
}
//# sourceMappingURL=capabilityCommands.js.map