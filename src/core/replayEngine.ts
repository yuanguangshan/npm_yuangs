import chalk from 'chalk';
import { ExecutionRecord } from './executionRecord';
import { loadExecutionRecord } from './executionStore';
import { explainExecution } from './explain';

export type ReplayMode = 'strict' | 'compatible' | 're-evaluate';

export interface ReplayOptions {
  mode: ReplayMode;
  skipAI?: boolean;
  verbose?: boolean;
  dry?: boolean;
  explain?: boolean;
  diff?: boolean;
}

export interface ReplayResult {
  success: boolean;
  message: string;
  executedModel?: string;
  deviationReason?: string;
}

export class ReplayEngine {
  async replay(recordId: string, options: ReplayOptions = { mode: 'strict' }): Promise<ReplayResult> {
    const record = loadExecutionRecord(recordId);

    if (!record) {
      return {
        success: false,
        message: `Execution record ${recordId} not found`,
      };
    }

    // NOTE: --diff implicitly enables --explain
    if (options.diff) {
      options.explain = true;
    }

    if (options.explain) {
      console.log(explainExecution(record));
      console.log('');

      if (options.dry) {
        return {
          success: true,
          message: '[Explain + Dry] Explanation shown, no execution',
        };
      }
    }

    if (options.mode === 'strict') {
      return this.strictReplay(record, options);
    }

    if (options.mode === 'compatible') {
      return this.compatibleReplay(record, options);
    }

    return this.reEvaluate(record, options);
  }

  private async strictReplay(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    const selectedModel = record.decision.selectedModel;

    if (options.verbose || options.dry) {
      console.log(chalk.cyan('[Strict Replay]'));
      console.log(chalk.gray(`  Original Model: ${selectedModel?.name || 'N/A'}`));
      console.log(chalk.gray(`  Original Provider: ${selectedModel?.provider || 'N/A'}`));
      console.log(chalk.gray(`  Original Timestamp: ${record.meta.timestamp}`));
      console.log(chalk.gray(`  Original Command: ${record.meta.commandName}`));
    }

    if (options.dry) {
      return {
        success: true,
        message: '[Dry Replay] Command not executed',
        executedModel: selectedModel?.name ?? undefined,
      };
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
      console.log(chalk.gray('[Strict Replay] Executing with original parameters...'));
      const result = await exec(record.command);

      return {
        success: result.code === 0 || result.code === null,
        message: result.code === 0 || result.code === null
          ? 'Strict replay completed successfully'
          : `Strict replay failed with code ${result.code}`,
        executedModel: selectedModel?.name ?? undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Strict replay error: ${message}`,
        executedModel: selectedModel?.name ?? undefined,
      };
    }
  }

  private async compatibleReplay(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    const originalModel = record.decision.selectedModel;

    if (options.verbose) {
      console.log(chalk.cyan('[Compatible Replay]'));
      console.log(chalk.gray(`  Original Model: ${originalModel?.name || 'N/A'}`));
      console.log(chalk.gray(`  Will attempt fallback if original unavailable`));
    }

    return {
      success: false,
      message: 'Compatible replay not yet implemented in Phase 1',
      executedModel: originalModel?.name,
      deviationReason: 'Phase 1 only supports strict replay',
    };
  }

  private async reEvaluate(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    if (options.verbose) {
      console.log(chalk.cyan('[Re-evaluate]'));
      console.log(chalk.gray(`  Will re-run capability matching with current config`));
      console.log(chalk.gray(`  Original Intent: ${record.intent.required.join(', ')}`));
    }

    return {
      success: false,
      message: 'Re-evaluate not yet implemented in Phase 1',
    };
  }
}

export const replayEngine = new ReplayEngine();
