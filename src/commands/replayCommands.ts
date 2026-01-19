import chalk from 'chalk';
import { Command } from 'commander';
import { CapabilitySystem } from '../core/capabilitySystem';
import { ReplayMode } from '../core/replayEngine';
import { diffExecution, formatReplayDiff } from '../core/replayDiff';
import { loadExecutionRecord, listExecutionRecords } from '../core/executionStore';

export function registerReplayCommands(program: Command): void {
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
      const system = new CapabilitySystem();

      let mode: ReplayMode = 'strict';
      if (options.compatible) mode = 'compatible';
      if (options.reEvaluate) mode = 're-evaluate';

      // Handle diff option
      if (options.diff) {
        const record = loadExecutionRecord(id);
        if (!record) {
          console.log(chalk.red(`❌ Execution record "${id}" not found\n`));
          return;
        }

        // Create a "current" record with current config
        const currentConfig = system.loadMergedConfig();
        const currentRecord: any = {
          ...record,
          configSnapshot: currentConfig,
          decision: {
            ...record.decision,
            // In a real scenario, we'd re-evaluate the decision
            // For now, use the same decision
          },
        };

        const diff = diffExecution(record, currentRecord);
        console.log(formatReplayDiff(diff));

        // If --diff is combined with --dry, exit after showing diff
        if (options.dry) {
          console.log(chalk.gray('\n[Dry] Diff shown, no execution\n'));
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
        console.log(chalk.green(`✅ ${result.message}`));
        if (result.executedModel) {
          console.log(chalk.gray(`Model: ${result.executedModel}`));
        }
      } else {
        console.log(chalk.red(`❌ ${result.message}`));
      }
    });
}
