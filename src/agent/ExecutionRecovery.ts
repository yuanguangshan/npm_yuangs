import { randomUUID } from 'crypto';
import { ProposedAction, ToolCallPayload, ShellCmdPayload, ToolExecutionResult } from './state';
import { ToolExecutor } from './executor';
import { ErrorTracker } from './errorTracker';
import { BackupManager, BackupRef } from '../core/git/BackupManager';
import { autoFixCommand } from '../core/autofix';
import { getOSProfile } from '../core/os';
import { logger } from '../utils/Logger';

const log = logger.child('ExecutionRecovery');

/**
 * Handles execution failure: backup rollback, error tracking, and auto-fix.
 */
export class ExecutionRecovery {
  /** Clear backup reference after successful write */
  clearBackup(): void {
    this.currentBackup = null;
  }

  /**
   * Handle a failed execution.
   * Attempts rollback, records error, and tries auto-fix for shell commands.
   * Returns the error message (empty string if auto-fix succeeded).
   */
  async handle(
    result: ToolExecutionResult,
    action: ProposedAction,
    mode: string,
    thought: { modelName?: string },
    userInput: string,
    context: { addToolResult: (tool: string, output: string) => void; addMessage: (role: string, content: string) => void }
  ): Promise<string> {
    // Rollback on write failure
    if (this.currentBackup) {
      log.warn('Rollback: write failed, attempting restore');
      const rolledBack = await BackupManager.rollback(this.currentBackup);
      if (rolledBack) {
        log.info('Rollback succeeded');
        this.currentBackup = null;
      } else {
        log.error('Rollback failed, file may need manual recovery');
      }
    }

    const actualToolName = (action.payload as Record<string, unknown>)?.tool_name as string || action.type;
    context.addToolResult(actualToolName, `Error: ${result.error}`);
    log.error('Execution failed', { tool: actualToolName, error: result.error });

    if (action.type === 'tool_call') {
      const toolParams = action.payload as unknown as ToolCallPayload;
      ErrorTracker.recordError(toolParams.tool_name, toolParams.parameters, result.error || 'Unknown error', { mode, model: thought.modelName, userInput });
    } else if (action.type === 'shell_cmd') {
      const shellParams = action.payload as unknown as ShellCmdPayload;
      ErrorTracker.recordError('shell_cmd', { command: shellParams.command }, result.error || 'Unknown error', { mode, model: thought.modelName, userInput });
    }

    // Auto-fix for shell_cmd failures
    if (action.type === 'shell_cmd' && result.error) {
      const fixed = await this.tryAutoFix(action, result, thought, context);
      if (fixed) return '';
    }

    return result.error || '';
  }

  private async tryAutoFix(
    action: ProposedAction,
    result: { success: boolean; output: string; error?: string },
    thought: { modelName?: string },
    context: { addToolResult: (tool: string, output: string) => void; addMessage: (role: string, content: string) => void }
  ): Promise<boolean> {
    log.debug('AutoFix: attempting command repair');
    try {
      const os = getOSProfile();
      const shellParams = action.payload as unknown as ShellCmdPayload;
      const fixPlan = await autoFixCommand(shellParams.command, result.error || result.output || '', os, thought.modelName);

      if (fixPlan && fixPlan.command) {
        log.debug('AutoFix: fix plan generated', { command: fixPlan.command, plan: fixPlan.plan || 'none' });
        context.addMessage('system', `自动修复建议：${fixPlan.command}\n原因：${fixPlan.plan || '无'}`);

        if (fixPlan.risk === 'low') {
          log.debug('AutoFix: executing low-risk fix');
          const fixedAction: ProposedAction = {
            id: randomUUID(),
            type: 'shell_cmd',
            payload: { command: fixPlan.command },
            riskLevel: 'low',
            reasoning: `AutoFix from failed command: ${shellParams.command}`
          };
          const fixedResult = await ToolExecutor.execute(fixedAction as any);
          if (fixedResult.success) {
            log.info('AutoFix: fix succeeded');
            context.addToolResult('shell_cmd', fixedResult.output);
            return true;
          } else {
            log.warn('AutoFix: fix failed, continuing with original error');
          }
        }
      } else {
        log.debug('AutoFix: unable to generate fix plan');
      }
    } catch (fixError: any) {
      log.warn('AutoFix: error during fix attempt', { error: fixError.message });
    }
    return false;
  }

  /** Current backup reference (set by caller before execute) */
  private currentBackup: BackupRef | null = null;
}
