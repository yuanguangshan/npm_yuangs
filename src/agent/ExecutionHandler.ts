import chalk from "chalk";
import { randomUUID } from "crypto";
import * as marked from "marked";
import TerminalRenderer from "marked-terminal";
import { ProposedAction, AgentThought, ToolExecutionResult, ToolCallPayload, ShellCmdPayload } from "./state";
import { ToolExecutor } from "./executor";
import { SmartContextManager } from "./smartContextManager";
import { ErrorTracker } from "./errorTracker";
import { StreamMarkdownRenderer } from '../utils/renderer';
import { BackupManager, BackupRef } from '../core/git/BackupManager';
import { logger } from '../utils/Logger';

const log = logger.child('ExecutionHandler');

const terminalRenderer = new TerminalRenderer();
marked.setOptions({ renderer: terminalRenderer });

interface WriteModeState {
  filePath: string;
  content: string;
}

interface ToolCallRecord {
  tool: string;
  params: any;
  count: number;
  lastOutput?: string;
  outputHistory: string[];
  blockCount: number;
}

const READ_ONLY_TOOLS = [
  'read_file', 'list_files', 'read_file_lines', 'read_file_lines_from_end',
  'file_info', 'git_status', 'git_log', 'git_diff', 'list_directory_tree',
  'search_in_files', 'search_symbol', 'continue_reading', 'analyze_dependencies'
];

/**
 * Handles post-execution logic: stabilization detection, duplicate tracking,
 * auto-completion, auto-fix, and result formatting.
 */
export class ExecutionHandler {
  constructor(private context: SmartContextManager) {}

  /** 当前写操作的备份引用（用于失败回滚） */
  private currentBackup: BackupRef | null = null;

  /** 需要备份的写操作工具名 */
  private static WRITE_TOOLS = new Set(['write_file', 'append_file', 'code_diff']);

  /**
   * Execute an action and return the result.
   * 对写操作自动创建备份。
   */
  /** 类型守卫：提取工具名 */
  private getToolName(action: ProposedAction): string | undefined {
    if (action.type === 'tool_call') return (action.payload as unknown as ToolCallPayload).tool_name;
    if (action.type === 'shell_cmd') return 'shell_cmd';
    return undefined;
  }

  /** 类型守卫：提取参数 */
  private getParams(action: ProposedAction): Record<string, unknown> {
    if (action.type === 'tool_call') return (action.payload as unknown as ToolCallPayload).parameters || {};
    if (action.type === 'shell_cmd') return { command: (action.payload as unknown as ShellCmdPayload).command || '' };
    return {};
  }

  async execute(action: ProposedAction): Promise<any> {
    // 写操作前自动备份
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
    result: any,
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

    // 写操作成功，清除备份引用（不再需要回滚）
    if (this.currentBackup) {
      this.currentBackup = null;
    }

    log.debug('Execution success', { tool: actualToolName, preview: result.output.length > 100 ? result.output.substring(0, 100) + '...' : result.output });

    // Stabilization & completion checks (only for non-error output)
    const normalizedOutput = result.output?.trim() || '';
    const isErrorMessage = /invalid option|unknown|error|failed|no such|cannot|usage:|not found/i.test(normalizedOutput);

    if (!isErrorMessage) {
      // Semantic completion: output is already a direct answer
      if (result.output.length < 100 && this.isSemanticComplete(normalizedOutput, userInput)) {
        log.debug('Semantic complete');
        console.log(chalk.cyan(`\n✓ 结果: ${normalizedOutput}\n`));
        this.renderAndFinish(result.output, agentRenderer);
        return null;
      }

      // Truncated output: guide AI to present data
      if (result.output.includes('[⚠️ OUTPUT TRUNCATED]') && normalizedOutput.length > 0) {
        this.context.addMessage('system', `输出已截断，但已包含足够的数据。请直接使用 answer 类型向用户呈现你看到的结果，不要再运行更多命令。`);
      }

      // Stabilization detection: prefix match
      if (this.isOutputStable(lastToolCall, normalizedOutput)) {
        log.debug('Output stabilized', { preview: normalizedOutput.slice(0, 200) });
        console.log(chalk.cyan(`\n✓ 结果: ${normalizedOutput.slice(0, 200)}\n`));
        this.renderAndFinish(result.output, agentRenderer);
        return null;
      }
    }

    // Duplicate tracking
    const payloadObj = action.payload as Record<string, unknown>;
    const actualTool = payloadObj?.tool_name as string || action.type;
    const params = payloadObj?.tool_name === 'shell_cmd' || action.type === 'shell_cmd'
      ? { command: (payloadObj?.command || (payloadObj?.parameters as Record<string, unknown>)?.command || '') }
      : (payloadObj?.parameters || payloadObj);

    const currentToolCall = { tool: actualTool, params };
    const isDuplicate = lastToolCall &&
      lastToolCall.tool === currentToolCall.tool &&
      JSON.stringify(lastToolCall.params) === JSON.stringify(currentToolCall.params);

    const outputHistory = [...((lastToolCall as any)?.outputHistory || []), normalizedOutput].slice(-3);

    if (isDuplicate && lastToolCall) {
      const count = lastToolCall.count + 1;

      if (isErrorMessage) {
        if (count >= 2) {
          const failedCmd = actualTool === 'shell_cmd' ? (lastToolCall.params?.command || '') : '';
          log.warn('Duplicate error, blocking path', { count, cmd: failedCmd });
          let errorMsg = `命令执行失败，且已重复尝试 2 次。请换一种完全不同的方法来完成用户任务: "${userInput}"。`;
          if (failedCmd) {
            errorMsg += `\n⚠️ 命令 "${failedCmd}" 在当前系统不可用，已被列入本次对话黑名单，不要再使用此命令。`;
          }
          errorMsg += `\n注意：当前系统可能是 macOS（BSD 工具链），不支持 Linux 特定的命令选项。请使用 macOS 兼容的命令。`;
          this.context.addMessage('system', errorMsg);
          return { tool: 'reset', params: {}, count: 0, lastOutput: '', outputHistory: [], blockCount: 0 };
        }
        log.debug('Repeat error', { count: count + 1 });
      } else if (count >= 2) {
        log.warn('Duplicate detection, forcing complete', { tool: payloadObj?.tool_name as string || action.type });
        this.finishQuiet(agentRenderer);
        return null;
      } else {
        log.debug('Repeat detection', { count: count + 1 });
      }
      lastToolCall.count = count;
      lastToolCall.lastOutput = normalizedOutput;
      (lastToolCall as any).outputHistory = outputHistory;

      if (!isErrorMessage) {
        this.context.addMessage('system', `同样的操作已经重复执行了 ${count} 次，结果没有变化。请停止继续调用工具，使用 answer 类型返回最终结果给用户。输出: "${result.output.slice(0, 200)}"`);
      }
    } else {
      lastToolCall = { ...currentToolCall, count: 0, lastOutput: normalizedOutput, outputHistory, blockCount: 0 };
    }

    // Auto-complete for specific tool types
    if (action.type === 'tool_call') {
      const toolParams = action.payload as unknown as ToolCallPayload;
      const toolName = toolParams.tool_name;

      if (toolName === 'write_file') {
        const filePath = toolParams.parameters?.path as string;
        log.debug('Auto-complete: write_file', { path: filePath });
        this.context.addMessage("assistant", `已成功创建文件 ${filePath}`);
        this.finishQuiet(agentRenderer);
        (result as any).shouldBreak = true;
        return lastToolCall;
      }

      if (READ_ONLY_TOOLS.includes(toolName)) {
        const requiresWrite = /替换|replace|修改|modify|添加|append|插入|insert|删除|delete|移除|remove|更新|update|改成|改成|改为/i.test(userInput);

        if (mode === 'command') {
          log.debug('Command mode: readonly tool, waiting for AI decision');
          return lastToolCall;
        }

        if (mode === 'chat') {
          const formatted = this.tryFormatToolResult(result.output, userInput);
          if (formatted) {
            console.log(chalk.green(`\n${formatted}\n`));
            this.renderAndFinish(formatted, agentRenderer);
            return null;
          }
          if (['read_file', 'read_file_lines', 'read_file_lines_from_end', 'search_in_files', 'file_info'].includes(toolName)) {
            log.debug('Chat auto-show: tool result to display', { tool: toolName });
            const displayOutput = result.output.length > 1000 ? result.output.slice(0, 1000) + '\n...(内容已截断)' : result.output;
            console.log(chalk.green(`\n${displayOutput}\n`));
            this.renderAndFinish(displayOutput, agentRenderer);
            return null;
          }
          this.context.addMessage('system', `工具结果已获取。请使用 'answer' 类型将数据返回给用户，不要再调用 ${toolName}。`);
          return lastToolCall;
        }

        if (!requiresWrite) {
          log.debug('Auto-complete: readonly tool success');
          this.context.addMessage("assistant", `已成功执行 ${toolName}，结果：\n${result.output}`);
          this.finishQuiet(agentRenderer);
          (result as any).shouldBreak = true;
          return lastToolCall;
        } else {
          log.debug('Write mode: file read, continuing to write operation');
          if (writeModeState) {
            writeModeState.filePath = toolParams.parameters?.path as string;
            writeModeState.content = result.output;
          }
          this.context.addMessage('system', `文件 ${toolParams.parameters?.path} 已成功读取。请根据用户要求修改内容后，调用 write_file 工具写入文件。不要重复调用 read_file！`);
        }
      }
    }

    // Learn from execution
    this.learnFromExecution(userInput, mode, thought).catch(() => {});

    return lastToolCall;
  }

  /**
   * Handle a failed execution. Returns the error message string.
   */
  async handleFailure(
    result: any,
    action: ProposedAction,
    mode: string,
    thought: AgentThought,
    userInput: string
  ): Promise<string> {
    // 写操作失败，尝试回滚备份
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
    this.context.addToolResult(actualToolName, `Error: ${result.error}`);
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
      log.debug('AutoFix: attempting command repair');
      try {
        const { autoFixCommand } = await import('../core/autofix');
        const { getOSProfile } = await import('../core/os');
        const os = getOSProfile();

        const shellParams = action.payload as unknown as ShellCmdPayload;
        const fixPlan = await autoFixCommand(shellParams.command, result.error || result.output || '', os, thought.modelName);
        if (fixPlan && fixPlan.command) {
          log.debug('AutoFix: fix plan generated', { command: fixPlan.command, plan: fixPlan.plan || 'none' });
          this.context.addMessage('system', `自动修复建议：${fixPlan.command}\n原因：${fixPlan.plan || '无'}`);

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
              this.context.addToolResult('shell_cmd', fixedResult.output);
              return '';
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
    }

    return result.error;
  }

  /**
   * Handle an "answer" action: display the response to the user.
   */
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
    await this.learnFromExecution(userInput, mode, thought);
  }

  // --- Private helpers ---

  private isOutputStable(lastToolCall: ToolCallRecord | null, normalizedOutput: string): boolean {
    const prevOutput = lastToolCall?.lastOutput || '';
    if (!prevOutput || !normalizedOutput) return false;

    const compareLen = 500;
    const currPrefix = normalizedOutput.substring(0, compareLen);
    const prevPrefix = prevOutput.substring(0, compareLen);
    const isOutputStable = currPrefix === prevPrefix;

    const isOutputNearlyStable =
      Math.abs(prevOutput.length - normalizedOutput.length) < 20 &&
      currPrefix.slice(0, 100) === prevPrefix.slice(0, 100);

    return isOutputStable || isOutputNearlyStable;
  }

  private isSemanticComplete(output: string, userInput: string): boolean {
    const trimmed = output.trim();
    if (trimmed.length > 300 || trimmed.length === 0) return false;

    const lineCount = trimmed.split('\n').length;
    if (lineCount > 15) return false;

    const q = userInput.toLowerCase();

    if (/(大小|多少字节|多大|size|bytes?)/.test(q)) {
      if (/^\d+(\.\d+)?$/.test(trimmed)) return true;
      if (/^[\d.]+\s*[KMGT]?B?$/i.test(trimmed)) return true;
      if (/^[\d.]+\s*[KMGT]?B?\s+\S+/i.test(trimmed)) return true;
    }

    if (/(几个|多少个|数量|count|how many)/.test(q) && /^\d+$/.test(trimmed)) return true;

    if (/(最大|最小|largest|smallest).*文件/.test(q)) {
      if (/^\d+\s+\.\//m.test(trimmed)) return true;
    }

    if (/(最新|最旧|最近|最早|newest|latest|oldest)/.test(q) && trimmed.split(/\s+/).length <= 5 && trimmed.length < 80) return true;

    if (/(行数|多少行|line.?count|多少 line)/.test(q) && /^\d+$/.test(trimmed)) return true;

    if (trimmed.length < 50 && !trimmed.startsWith('-') && trimmed.split(/\s+/).length <= 4) {
      if (/\d+|\.\//.test(trimmed)) return true;
    }

    return false;
  }

  private tryFormatToolResult(output: string, userInput: string): string | null {
    if (output.length > 5000) return null;
    if (/(最大|最小|哪个.*最大|哪个.*最小|largest|smallest|biggest)/.test(userInput)) return null;

    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].path) {
        const files = parsed.filter((f: any) => f.type === 'file');
        const dirs = parsed.filter((f: any) => f.type === 'directory');
        const fileNames = files.map((f: any) => f.path.split('/').pop()).join('、');
        const dirNames = dirs.map((f: any) => f.path.split('/').pop()).join('、');
        let result = `📁 **${files.length}** 个文件`;
        if (files.length > 0 && files.length <= 30) result += `：${fileNames}`;
        result += `\n📂 **${dirs.length}** 个目录`;
        if (dirs.length > 0 && dirs.length <= 30) result += `：${dirNames}`;
        return result;
      }
    } catch { /* not JSON */ }

    if (output.length < 200 && !output.includes('\n')) return output;
    return null;
  }

  private renderAndFinish(output: string, agentRenderer: StreamMarkdownRenderer | undefined): void {
    this.context.addMessage("assistant", output);
    if (agentRenderer) {
      (agentRenderer as any).buffer = '';
      (agentRenderer as any).quietMode = true;
      agentRenderer.finish();
    }
  }

  private finishQuiet(agentRenderer: StreamMarkdownRenderer | undefined): void {
    if (agentRenderer) {
      (agentRenderer as any).buffer = '';
      (agentRenderer as any).quietMode = true;
      agentRenderer.finish();
    }
  }

  private async learnFromExecution(userInput: string, mode: string, thought: AgentThought): Promise<void> {
    try {
      const { createExecutionRecord } = await import('../core/executionRecord');
      const { saveExecutionRecord } = await import('../core/executionStore');

      const record = createExecutionRecord(
        `agent-${mode}`,
        { required: [], preferred: [] } as any,
        { aiProxyUrl: { value: '', source: 'built-in' }, defaultModel: { value: '', source: 'built-in' }, accountType: { value: 'free', source: 'built-in' } } as any,
        { selected: null, candidates: [], fallbackOccurred: false },
        { success: true },
        undefined,
        userInput,
        mode
      );

      (record as any).llmResult = { plan: thought.parsedPlan };
      (record as any).input = { rawInput: userInput };

      const savedRecordId = saveExecutionRecord(record);
      const { loadExecutionRecord } = await import('../core/executionStore');
      const savedRecord = loadExecutionRecord(savedRecordId);

      if (savedRecord) {
        const { learnSkillFromRecord } = await import('./skills');
        learnSkillFromRecord(savedRecord, true);
      }
    } catch (error) {
      log.warn('Skill learning failed', { error: String(error) });
    }
  }
}
