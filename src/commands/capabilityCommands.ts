import chalk from 'chalk';
import { Command } from 'commander';
import { AtomicCapability, COMPOSITE_CAPABILITIES } from '../core/capabilities';
import { CapabilitySystem } from '../core/capabilitySystem';
import { CapabilityRequirement } from '../core/modelMatcher';
import { listExecutionRecords } from '../core/executionStore';
import { ReplayMode } from '../core/replayEngine';

export function registerCapabilityCommands(program: Command): void {
  const capProgram = program.command('capabilities').description('Capability system commands (new architecture)');

  capProgram
    .command('explain')
    .description('Explain current configuration with sources')
    .action(() => {
      const system = new CapabilitySystem();
      console.log(chalk.bold.cyan('\n📋 Configuration Snapshot\n'));
      console.log(system.explainConfig());
    });

  capProgram
    .command('match')
    .description('Test capability matching')
    .argument('<capabilities...>', 'Required capabilities (e.g., text_generation reasoning)')
    .action((capabilities) => {
      const system = new CapabilitySystem();

      const { AtomicCapability } = require('../core/capabilities');

      const requirement: CapabilityRequirement = {
        required: capabilities as any,
        preferred: [],
      };

      const result = system.matchCapability(requirement);

      console.log(chalk.bold.cyan('\n🤖 Capability Match Result\n'));

      if (!result.selected) {
        console.log(chalk.red('❌ No model satisfies requirements\n'));
        result.candidates.forEach(c => {
          console.log(chalk.yellow(`${c.modelName} (${c.provider}):`));
          console.log(chalk.gray(`  ${c.reason}\n`));
        });
        return;
      }

      console.log(chalk.green(`✅ Selected: ${result.selected.name} (${result.selected.provider})\n`));

      console.log(chalk.bold('Capability coverage:'));
      result.selected.atomicCapabilities.forEach(cap => {
        console.log(chalk.green(`  ✓ ${cap}`));
      });

      if (result.fallbackOccurred) {
        console.log(chalk.yellow('\n⚠️  Fallback was used'));
      }

      console.log(chalk.bold('\nAll candidates:'));
      result.candidates.forEach(c => {
        const icon = c.hasRequired ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${c.modelName} (${c.provider})`);
        console.log(chalk.gray(`    ${c.reason}\n`));
      });
    });

  capProgram
    .command('list')
    .description('List all available capabilities')
    .action(() => {
      console.log(chalk.bold.cyan('\n📦 Available Capabilities\n'));

      console.log(chalk.bold('Atomic Capabilities:'));
      Object.values(AtomicCapability).forEach(cap => {
        console.log(`  - ${chalk.green(cap)}`);
      });

      console.log(chalk.bold('\nComposite Capabilities:'));
      COMPOSITE_CAPABILITIES.forEach(comp => {
        console.log(`  - ${chalk.cyan(comp.name)}`);
        console.log(chalk.gray(`    Composed of: ${comp.composedOf.join(', ')}`));
      });
    });

  capProgram
    .command('history')
    .description('List execution history')
    .option('-l, --limit <n>', 'Limit number of records', '10')
    .action((options) => {
      const limit = parseInt(options.limit);
      const records = listExecutionRecords(limit);

      if (records.length === 0) {
        console.log(chalk.gray('📭 No execution history found\n'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📋 Execution History (last ${records.length})\n`));

      records.forEach((record, idx) => {
        const status = record.outcome.success
          ? chalk.green('✓')
          : chalk.red('✗');
        const model = record.decision.selectedModel?.name || 'N/A';
        const time = new Date(record.meta.timestamp).toLocaleString();

        console.log(`${status} ${chalk.white(record.id)}`);
        console.log(chalk.gray(`  Command: ${record.meta.commandName}`));
        console.log(chalk.gray(`  Model: ${model}`));
        console.log(chalk.gray(`  Time: ${time}\n`));
      });
    });

  capProgram
    .command('replay <id>')
    .description('Replay an execution')
    .option('-s, --strict', 'Strict replay (use exact model)')
    .option('-c, --compatible', 'Compatible replay (allow fallback)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (id, options) => {
      const system = new CapabilitySystem();

      let mode: ReplayMode = 'strict';
      if (options.compatible) mode = 'compatible';

      const result = await system.replayExecution(id, {
        mode,
        skipAI: true,
        verbose: options.verbose,
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ ${result.message}\n`));
        if (result.executedModel) {
          console.log(chalk.gray(`Model: ${result.executedModel}`));
        }
      } else {
        console.log(chalk.red(`\n❌ ${result.message}\n`));
      }
    });
}
