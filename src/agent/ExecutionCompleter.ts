import { ProposedAction, ToolCallPayload } from './state';
import { ToolExecutionResult } from './state';
import { StabilizationDetector } from './ExecutionStabilizer';
import { READ_ONLY_TOOLS } from './ExecutionTypes';
import { StreamMarkdownRenderer } from '../utils/renderer';
import { logger } from '../utils/Logger';

const log = logger.child('ExecutionCompleter');

interface WriteModeState {
  filePath: string;
  content: string;
}

export interface AutoCompleteResult {
  shouldBreak: boolean;   // signal caller to break loop
  shouldReturnNull: boolean; // signal caller to return null (force complete)
  updatedWriteMode?: WriteModeState | null;
}

/**
 * Handles auto-completion for specific tool types.
 * Decides whether to continue the loop or auto-complete based on tool type and mode.
 */
export class ExecutionCompleter {
  constructor(
    private context: { addMessage: (role: string, content: string) => void },
    private stabilizer: StabilizationDetector
  ) {}

  /**
   * Check if the action should auto-complete.
   * Returns result with shouldBreak/shouldReturnNull flags.
   */
  check(
    action: ProposedAction,
    result: ToolExecutionResult,
    userInput: string,
    mode: string,
    writeModeState: WriteModeState | null,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): AutoCompleteResult {
    if (action.type !== 'tool_call') {
      return { shouldBreak: false, shouldReturnNull: false };
    }

    const toolParams = action.payload as unknown as ToolCallPayload;
    const toolName = toolParams.tool_name;

    // write_file: always complete
    if (toolName === 'write_file') {
      const filePath = toolParams.parameters?.path as string;
      log.debug('Auto-complete: write_file', { path: filePath });
      this.context.addMessage('assistant', `已成功创建文件 ${filePath}`);
      this.stabilizer.finishQuiet(agentRenderer);
      return { shouldBreak: true, shouldReturnNull: false };
    }

    // Read-only tools: mode-dependent behavior
    if (READ_ONLY_TOOLS.includes(toolName)) {
      return this.handleReadOnlyTool(
        toolParams, toolName, result, userInput, mode, writeModeState, agentRenderer
      );
    }

    return { shouldBreak: false, shouldReturnNull: false };
  }

  private handleReadOnlyTool(
    toolParams: ToolCallPayload,
    toolName: string,
    result: ToolExecutionResult,
    userInput: string,
    mode: string,
    writeModeState: WriteModeState | null,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): AutoCompleteResult {
    const requiresWrite = /替换|replace|修改|modify|添加|append|插入|insert|删除|delete|移除|remove|更新|update|改成|改成|改为/i.test(userInput);

    if (mode === 'command') {
      log.debug('Command mode: readonly tool, waiting for AI decision');
      return { shouldBreak: false, shouldReturnNull: false };
    }

    if (mode === 'chat') {
      const formatted = this.stabilizer.tryFormatToolResult(result.output, userInput);
      if (formatted) {
        this.stabilizer.renderAndFinish(this.context, formatted, agentRenderer);
        return { shouldBreak: false, shouldReturnNull: true };
      }
      if (['read_file', 'read_file_lines', 'read_file_lines_from_end', 'search_in_files', 'file_info'].includes(toolName)) {
        log.debug('Chat auto-show: tool result to display', { tool: toolName });
        const displayOutput = result.output.length > 1000 ? result.output.slice(0, 1000) + '\n...(内容已截断)' : result.output;
        this.stabilizer.renderAndFinish(this.context, displayOutput, agentRenderer);
        return { shouldBreak: false, shouldReturnNull: true };
      }
      this.context.addMessage('system', `工具结果已获取。请使用 'answer' 类型将数据返回给用户，不要再调用 ${toolName}。`);
      return { shouldBreak: false, shouldReturnNull: false };
    }

    // Write mode (command+exec)
    if (!requiresWrite) {
      log.debug('Auto-complete: readonly tool success');
      this.context.addMessage('assistant', `已成功执行 ${toolName}，结果：\n${result.output}`);
      this.stabilizer.finishQuiet(agentRenderer);
      return { shouldBreak: true, shouldReturnNull: false };
    } else {
      log.debug('Write mode: file read, continuing to write operation');
      const filePath = toolParams.parameters?.path as string;
      if (writeModeState) {
        writeModeState.filePath = filePath;
        writeModeState.content = result.output;
      }
      this.context.addMessage('system', `文件 ${filePath} 已成功读取。请根据用户要求修改内容后，调用 write_file 工具写入文件。不要重复调用 read_file！`);
      return { shouldBreak: false, shouldReturnNull: false };
    }
  }
}
