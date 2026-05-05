import chalk from "chalk";
import * as marked from "marked";
import TerminalRenderer from "marked-terminal";
import { ProposedAction, AgentThought, ToolCallPayload, ShellCmdPayload, ToolExecutionResult } from "./state";
import { ToolExecutor } from "./executor";
import { SmartContextManager } from "./smartContextManager";
import { StreamMarkdownRenderer } from '../utils/renderer';
import { BackupManager, BackupRef } from '../core/git/BackupManager';
import { logger } from '../utils/Logger';
import { StabilizationDetector } from './ExecutionStabilizer';
import { ExecutionCompleter } from './ExecutionCompleter';
import { ExecutionRecovery } from './ExecutionRecovery';
import { ExecutionLearning } from './ExecutionLearning';
import { ToolCallRecord, WriteModeState } from './ExecutionTypes';

const log = logger.child('ExecutionHandler');

const terminalRenderer = new TerminalRenderer();
marked.setOptions({ renderer: terminalRenderer });

export type { ToolCallRecord, WriteModeState };
export { READ_ONLY_TOOLS } from './ExecutionTypes';

/**
 * Coordinates execution, stabilization, auto-completion, failure recovery, and learning.
 * Thin delegation layer — all logic is in dedicated classes.
 */
export class ExecutionHandler {
  private stabilizer: StabilizationDetector;
  private completer: ExecutionCompleter;
  private recovery: ExecutionRecovery;
  private learning: ExecutionLearning;
  private currentBackup: BackupRef | null = null;

  private static WRITE_TOOLS = new Set(['write_file', 'append_file', 'code_diff']);

  constructor(private context: SmartContextManager) {
    this.stabilizer = new StabilizationDetector();
    this.completer = new ExecutionCompleter(context, this.stabilizer);
    this.recovery = new ExecutionRecovery();
    this.learning = new ExecutionLearning();
  }

  /** Execute an action with automatic backup for write operations. */
  async execute(action: ProposedAction): Promise<ToolExecutionResult> {
    const toolName = this.getToolName(action);
    const params = this.getParams(action);
    const filePath = (params.path || params.file_path) as string | undefined;

    if (toolName && ExecutionHandler.WRITE_TOOLS.has(toolName) && filePath) {
      try {
        this.currentBackup = await BackupManager.beforeWrite(filePath);
        if (this.currentBackup) {
          log.debug('Backup created', { filePath });
        }
      } catch (err) {
        log.warn('Backup failed, continuing', { error: String(err) });
      }
    }

    log.debug('Executing', { action: action.type });
    return await ToolExecutor.execute(action as any);
  }

  /**
   * Handle a successful execution.
   * Returns updated ToolCallRecord, or null to signal loop break.
   */
  handleSuccess(
    result: ToolExecutionResult,
    action: ProposedAction,
    lastToolCall: ToolCallRecord | null,
    userInput: string,
    writeModeState: WriteModeState | null,
    mode: string,
    thought: AgentThought,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): ToolCallRecord | null {
    const actualToolName = (action.payload as Record<string, unknown>)?.tool_name as string || action.type;
    this.context.addToolResult(actualToolName, result.output);

    // Clear backup on success
    if (this.currentBackup) {
      this.currentBackup = null;
    }

    log.debug('Execution success', { tool: actualToolName, preview: result.output.length > 100 ? result.output.substring(0, 100) + '...' : result.output });

    // Stabilization & completion checks
    const normalizedOutput = result.output?.trim() || '';
    const isErrorMessage = /invalid option|unknown|error|failed|no such|cannot|usage:|not found/i.test(normalizedOutput);

    if (!isErrorMessage) {
      if (result.output.length < 100 && this.stabilizer.isSemanticComplete(normalizedOutput, userInput)) {
        log.debug('Semantic complete');
        console.log(chalk.cyan(`\n✓ 结果: ${normalizedOutput}\n`));
        this.stabilizer.renderAndFinish(this.context, result.output, agentRenderer);
        return null;
      }

      if (result.output.includes('[⚠️ OUTPUT TRUNCATED]') && normalizedOutput.length > 0) {
        this.context.addMessage('system', `输出已截断，但已包含足够的数据。请直接使用 answer 类型向用户呈现你看到的结果，不要再运行更多命令。`);
      }

      if (this.stabilizer.isOutputStable(lastToolCall, normalizedOutput)) {
        log.debug('Output stabilized', { preview: normalizedOutput.slice(0, 200) });
        console.log(chalk.cyan(`\n✓ 结果: ${normalizedOutput.slice(0, 200)}\n`));
        this.stabilizer.renderAndFinish(this.context, result.output, agentRenderer);
        return null;
      }
    }

    // Duplicate tracking
    const trackResult = this.trackDuplicate(result, action, lastToolCall, userInput, normalizedOutput, agentRenderer);
    if (trackResult.breakEarly) return trackResult.newRecord;
    lastToolCall = trackResult.updatedRecord;

    // Auto-completion for specific tool types
    const autoComplete = this.completer.check(action, result, userInput, mode, writeModeState, agentRenderer);
    if (autoComplete.shouldBreak) {
      (result as ToolExecutionResult & { shouldBreak?: boolean }).shouldBreak = true;
      return lastToolCall;
    }
    if (autoComplete.shouldReturnNull) {
      return null;
    }

    // Learn from execution
    this.learning.learn(userInput, mode, thought);

    return lastToolCall;
  }

  /** Handle a failed execution. Returns the error message string. */
  async handleFailure(
    result: ToolExecutionResult,
    action: ProposedAction,
    mode: string,
    thought: AgentThought,
    userInput: string
  ): Promise<string> {
    return this.recovery.handle(result, action, mode, thought, userInput, this.context);
  }

  /** Handle an "answer" action: display the response to the user. */
  async handleAnswer(
    action: ProposedAction,
    thought: AgentThought,
    userInput: string,
    mode: string,
    externalRenderer: StreamMarkdownRenderer | undefined,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): Promise<void> {
    const result = await ToolExecutor.execute(action as any);

    if (!externalRenderer && agentRenderer) {
      for (let i = 0; i < result.output.length; i += 10) {
        agentRenderer.onChunk(result.output.slice(i, i + 10));
      }
      agentRenderer.finish();
    } else if (!externalRenderer) {
      const rendered = marked.parse(result.output);
      console.log(chalk.green(`\n🤖 AI：\n`) + rendered);
    }

    this.context.addMessage("assistant", result.output);
    this.learning.learn(userInput, mode, thought);
  }

  // --- Private helpers ---

  private getToolName(action: ProposedAction): string | undefined {
    if (action.type === 'tool_call') return (action.payload as unknown as ToolCallPayload).tool_name;
    if (action.type === 'shell_cmd') return 'shell_cmd';
    return undefined;
  }

  private getParams(action: ProposedAction): Record<string, unknown> {
    if (action.type === 'tool_call') return (action.payload as unknown as ToolCallPayload).parameters || {};
    if (action.type === 'shell_cmd') return { command: (action.payload as unknown as ShellCmdPayload).command || '' };
    return {};
  }

  private trackDuplicate(
    result: ToolExecutionResult,
    action: ProposedAction,
    lastToolCall: ToolCallRecord | null,
    userInput: string,
    normalizedOutput: string,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): { breakEarly: boolean; newRecord: ToolCallRecord | null; updatedRecord: ToolCallRecord } {
    const payloadObj = action.payload as Record<string, unknown>;
    const actualTool = payloadObj?.tool_name as string || action.type;
    const params: Record<string, unknown> = payloadObj?.tool_name === 'shell_cmd' || action.type === 'shell_cmd'
      ? { command: (payloadObj?.command || (payloadObj?.parameters as Record<string, unknown>)?.command || '') as unknown }
      : ((payloadObj?.parameters || payloadObj) as Record<string, unknown>);

    const currentToolCall = { tool: actualTool, params };
    const isDuplicate = lastToolCall &&
      lastToolCall.tool === currentToolCall.tool &&
      JSON.stringify(lastToolCall.params) === JSON.stringify(currentToolCall.params);

    const outputHistory = [...((lastToolCall as any)?.outputHistory || []), normalizedOutput].slice(-3);
    const isErrorMessage = /invalid option|unknown|error|failed|no such|cannot|usage:|not found/i.test(normalizedOutput);

    if (isDuplicate && lastToolCall) {
      const count = lastToolCall.count + 1;

      if (isErrorMessage) {
        if (count >= 2) {
          const failedCmd = actualTool === 'shell_cmd' ? (lastToolCall.params?.command as string || '') : '';
          log.warn('Duplicate error, blocking path', { count, cmd: failedCmd });
          let errorMsg = `命令执行失败，且已重复尝试 2 次。请换一种完全不同的方法来完成用户任务: "${userInput}"。`;
          if (failedCmd) {
            errorMsg += `\n⚠️ 命令 "${failedCmd}" 在当前系统不可用，已被列入本次对话黑名单，不要再使用此命令。`;
          }
          errorMsg += `\n注意：当前系统可能是 macOS（BSD 工具链），不支持 Linux 特定的命令选项。请使用 macOS 兼容的命令。`;
          this.context.addMessage('system', errorMsg);
          return { breakEarly: true, newRecord: { tool: 'reset', params: {} as Record<string, unknown>, count: 0, lastOutput: '', outputHistory: [], blockCount: 0 }, updatedRecord: lastToolCall };
        }
        log.debug('Repeat error', { count: count + 1 });
      } else if (count >= 2) {
        log.warn('Duplicate detection, forcing complete', { tool: actualTool });
        this.stabilizer.finishQuiet(agentRenderer);
        return { breakEarly: true, newRecord: null, updatedRecord: lastToolCall };
      } else {
        log.debug('Repeat detection', { count: count + 1 });
      }
      lastToolCall.count = count;
      lastToolCall.lastOutput = normalizedOutput;
      (lastToolCall as any).outputHistory = outputHistory;

      if (!isErrorMessage) {
        this.context.addMessage('system', `同样的操作已经重复执行了 ${count} 次，结果没有变化。请停止继续调用工具，使用 answer 类型返回最终结果给用户。输出: "${result.output.slice(0, 200)}"`);
      }
      return { breakEarly: false, newRecord: null, updatedRecord: lastToolCall };
    }

    const newRecord = { ...currentToolCall, count: 0, lastOutput: normalizedOutput, outputHistory, blockCount: 0 };
    return { breakEarly: false, newRecord: null, updatedRecord: newRecord };
  }
}
