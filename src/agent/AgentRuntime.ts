import chalk from "chalk";
import { randomUUID } from "crypto";
import * as marked from "marked";
import TerminalRenderer from "marked-terminal";

// Configure marked with TerminalRenderer
const terminalRenderer = new TerminalRenderer();
marked.setOptions({ renderer: terminalRenderer });

import { LLMAdapter } from "./llmAdapter";
import { AIError } from "./llm";
import { GovernanceService } from "./governance";
import { ToolExecutor } from "./executor";
import { SmartContextManager } from "./smartContextManager";
import { evaluateProposal } from "./governance/core";
import { ProposedAction, AgentThought } from "./state";
import { ErrorTracker } from "./errorTracker";
import {
  buildDynamicContext,
  injectDynamicContext,
} from "./dynamicPrompt";
import { StreamMarkdownRenderer } from '../utils/renderer';

interface ToolCallRecord {
  tool: string;
  params: any;
  count: number;
  lastOutput?: string;
  outputHistory: string[];
}

interface WriteModeState {
  filePath: string;
  content: string;
}

export class AgentRuntime {
  private context: SmartContextManager;
  private executionId: string;
  private readonly maxTurns = 10;

  private readonly readOnlyTools = [
    'read_file', 'list_files', 'read_file_lines', 'read_file_lines_from_end',
    'file_info', 'git_status', 'git_log', 'git_diff', 'list_directory_tree',
    'search_in_files', 'search_symbol', 'continue_reading', 'analyze_dependencies'
  ];

  constructor(initialContext: any) {
    this.context = new SmartContextManager(initialContext);
    this.executionId = randomUUID();
  }

  async run(
    userInput: string,
    mode: "chat" | "command" = "chat",
    onChunk?: (chunk: string) => void,
    model?: string,
    renderer?: StreamMarkdownRenderer
  ) {
    let turnCount = 0;
    let lastError: string | undefined;
    let lastToolCall: ToolCallRecord | null = null;
    let writeModeState: WriteModeState | null = null;

    if (userInput) {
      this.context.addMessage("user", userInput);
    }

    while (turnCount < this.maxTurns) {
      const currentTurn = ++turnCount;
      if (currentTurn > 1) {
        console.log(chalk.blue(`\n--- Turn ${currentTurn} ---`));
      }

      const { agentRenderer, agentOnChunk } = this.prepareRenderer(renderer, onChunk);
      const { prompt: enhancedPrompt, userInput: query } = await this.buildPrompt(userInput, lastError);

      // === Step 1: LLM Thinking ===
      const thought = await this.callLLM(
        enhancedPrompt, query, mode, agentOnChunk, model, agentRenderer
      );
      if (!thought) break; // error or empty

      // === Step 2: Build Action ===
      const action = this.buildAction(thought);

      if (action.reasoning && !onChunk) {
        console.log(chalk.gray(`\n🤔 Reasoning: ${action.reasoning}`));
      }
      if (thought.usedRouter) {
        console.log(chalk.gray(`[Router] 🤖 Model: ${thought.modelName}`));
      }

      // === Step 3: Handle answer type ===
      if (thought.isDone || action.type === "answer") {
        // Command 模式下 AI 返回 answer：引导其使用工具
        if (mode === "command") {
          const content = action.payload.content || action.payload.text || '';
          this.context.addMessage('system', `在命令执行模式下，请直接使用工具执行命令，不要回复对话。请使用 list_directory_tree 查看文件列表，然后用 shell_cmd 执行命令来查找最大文件。任务: "${userInput}"`);
          continue; // 不 break，让 AI 重试使用工具
        }
        await this.handleAnswer(action, thought, userInput, mode, renderer, agentRenderer);
        break;
      }

      // === Step 4: Causal ACK Check ===
      if (!this.verifyAckCausality(thought)) continue;

      // === Step 5: Governance ===
      if (!await this.passGovernance(action)) continue;

      // === Step 6: Record KG Edge ===
      await this.recordKnowledgeGraphEdge(thought, action);

      // === Step 7: Pre-execution Checks ===
      const cachedResult = await this.checkExecutionBlock(action, writeModeState);
      if (cachedResult === 'blocked') continue;

      // === Step 8: Execute ===
      const result = cachedResult && typeof cachedResult === 'object'
        ? cachedResult
        : await this.executeAction(action, writeModeState);

      if (result.success) {
        lastError = undefined;
        lastToolCall = this.handleSuccessfulExecution(
          result, action, lastToolCall, userInput, writeModeState,
          mode, thought, agentRenderer
        );
        if (lastToolCall === null) break; // null signals break (stabilization or duplicate)
      } else {
        lastError = await this.handleFailedExecution(
          result, action, mode, thought, userInput
        );
      }
    }

    if (turnCount >= this.maxTurns) {
      console.log(chalk.red(`\n⚠️ Max turns (${this.maxTurns}) reached.`));
    }
  }

  // === Private Helper Methods ===

  private prepareRenderer(
    renderer: StreamMarkdownRenderer | undefined,
    onChunk: ((chunk: string) => void) | undefined
  ): { agentRenderer: StreamMarkdownRenderer | undefined; agentOnChunk: ((chunk: string) => void) | undefined } {
    let agentRenderer = renderer;
    let agentOnChunk = onChunk;
    if (!agentRenderer && agentOnChunk) {
      agentRenderer = new StreamMarkdownRenderer(
        chalk.bgHex('#3b82f6').white.bold(' 🤖 Agent ') + ' ',
        undefined,
        { autoFinish: false }
      );
      agentOnChunk = agentRenderer.startChunking();
    }
    return { agentRenderer, agentOnChunk };
  }

  private async buildPrompt(userInput: string, lastError: string | undefined): Promise<{ prompt: string; userInput: string }> {
    const dynamicContext = await buildDynamicContext(lastError);
    const basePrompt = GovernanceService.getPolicyManual();
    let prompt = injectDynamicContext(basePrompt, dynamicContext);

    // 尝试匹配技能，注入技能 prompt
    const { matchSkill, generateSkillPrompt } = await import('./promptSkills');
    const skill = matchSkill(userInput);
    if (skill) {
      prompt += `\n\n[SKILL ACTIVE: ${skill.name}]\n${generateSkillPrompt(skill, userInput)}`;
    }

    return { prompt, userInput };
  }

  private async callLLM(
    enhancedPrompt: string,
    userInput: string,
    mode: string,
    onChunk: ((chunk: string) => void) | undefined,
    model: string | undefined,
    renderer: StreamMarkdownRenderer | undefined
  ): Promise<AgentThought | null> {
    const messages: any[] = [];
    const enhancedContext = await this.context.getEnhancedContext({
      query: userInput || enhancedPrompt,
      minRelevance: 0.3,
      maxTokens: 8000,
      enableSmartSummary: true
    });

    if (enhancedContext.summary) {
      messages.push({ role: 'system', content: enhancedContext.summary });
    }
    for (const item of enhancedContext.rankedItems) {
      messages.push({
        role: 'user',
        content: `@${item.path} (相关度: ${(item.relevance * 100).toFixed(0)}%)\n${item.summary || item.content || ''}`
      });
    }
    // 关键：确保用户输入被包含为最后一条消息
    if (userInput) {
      messages.push({ role: 'user', content: userInput });
    } else {
      messages.push({ role: 'user', content: enhancedPrompt });
    }

    try {
      const thought = await LLMAdapter.think(messages, mode as any, onChunk, model, enhancedPrompt, this.context);
      if (!thought.raw || thought.raw.trim() === '') {
        console.log(chalk.red('\n⚠️ AI 返回了空响应，请检查网络连接或模型配置。'));
        return null;
      }
      return thought;
    } catch (error: unknown) {
      this.handleLLMError(error);
      return null;
    }
  }

  private handleLLMError(error: unknown): void {
    let errorMessage = '未知内部错误';
    let statusCode = 0;

    if (error instanceof AIError) {
      errorMessage = error.message;
      statusCode = error.statusCode;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      statusCode = (error as any).statusCode || 0;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    const statusInfo = statusCode ? ` (状态码: ${statusCode})` : '';
    console.log(chalk.red(`\n❌ AI 思考过程发生错误: ${errorMessage}${statusInfo}`));

    const isTransient = statusCode === 429 || statusCode >= 500
      || errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ETIMEDOUT');

    if (isTransient) {
      console.log(chalk.yellow('⚠️ 检测到瞬时错误，自动跳过此轮'));
      this.context.addMessage("system", `AI 调用失败${statusInfo}，请稍后重试`);
      return;
    }

    this.context.addMessage("system", `思考过程中发生错误${statusInfo}: ${errorMessage}`);

    if (statusCode === 401 || statusCode === 403 || errorMessage.includes('401') || errorMessage.includes('403')) {
      console.log(chalk.yellow('💡 检测到权限或授权错误，请检查 API 配置。'));
    }
  }

  private buildAction(thought: AgentThought): ProposedAction {
    return {
      id: randomUUID(),
      type: (thought.type as any) || "answer",
      payload: thought.payload || { text: thought.raw },
      riskLevel: "low",
      reasoning: thought.reasoning || "",
    };
  }

  private async handleAnswer(
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

  private verifyAckCausality(thought: AgentThought): boolean {
    const lastObs = this.context.getLastAckableObservation();
    const ackText = thought.parsedPlan?.acknowledged_observation;

    if (lastObs && ackText && ackText !== 'NONE') {
      if (lastObs.content.trim() !== ackText.trim()) {
        console.log(chalk.red(`[CAUSAL BREAK] ❌ ACK mismatch!`));
        console.log(chalk.red(`  Expected: ${lastObs.content.trim().substring(0, 100)}...`));
        console.log(chalk.red(`  Received: ${ackText.trim().substring(0, 100)}...`));
        this.context.addMessage(
          "system",
          `CAUSAL BREAK: ACK does not match physical Observation. Cannot proceed without acknowledging reality.`
        );
        return false;
      }
      console.log(chalk.green(`[CAUSAL LOCK] ✅ ACK verified`));
    }
    return true;
  }

  private async passGovernance(action: ProposedAction): Promise<boolean> {
    const preCheck = evaluateProposal(action, GovernanceService.getRules(), GovernanceService.getLedgerSnapshot());
    if (preCheck.effect === "deny") {
      console.log(chalk.red(`[PRE-FLIGHT] 🛡️ Policy Blocked: ${preCheck.reason}`));
      this.context.addMessage("system", `POLICY DENIED: ${preCheck.reason}. Find a different way.`);
      return false;
    }

    const decision = await GovernanceService.adjudicate(action);
    if (decision.status === "rejected") {
      console.log(chalk.red(`[GOVERNANCE] ❌ Rejected: ${decision.reason}`));
      this.context.addMessage("system", `Rejected by Governance: ${decision.reason}`);
      return false;
    }
    return true;
  }

  private async recordKnowledgeGraphEdge(thought: AgentThought, action: ProposedAction): Promise<void> {
    const lastObs = this.context.getLastAckableObservation();
    const ackText = thought.parsedPlan?.acknowledged_observation;

    if (lastObs && lastObs.metadata?.obsId && ackText && ackText !== 'NONE') {
      try {
        const { recordEdge } = await import('../engine/agent/knowledgeGraph');
        recordEdge({
          from: lastObs.metadata.obsId,
          to: action.id,
          type: 'ACKNOWLEDGED_BY' as any,
          metadata: { verified: true, timestamp: Date.now() }
        });
        console.log(chalk.gray(`[KG] ⚓ Causal edge recorded`));
      } catch (error: any) {
        console.warn(chalk.yellow(`[KG] Warning: Failed to record causal edge: ${error.message}`));
      }
    }
  }

  private async checkExecutionBlock(
    action: ProposedAction,
    writeModeState: WriteModeState | null
  ): Promise<'blocked' | { success: true; output: string; artifacts: string[] } | null> {
    if (action.type !== 'tool_call') return null;

    const toolName = action.payload.tool_name;

    // Write Mode cache
    if (writeModeState && toolName === 'read_file') {
      const filePath = action.payload.parameters.path;
      if (filePath === writeModeState.filePath && writeModeState.content) {
        console.log(chalk.yellow(`[CACHED] 📋 文件 ${filePath} 内容已缓存，直接返回`));
        return { success: true, output: writeModeState.content, artifacts: [filePath] };
      }
    }

    const blockCheck = ErrorTracker.shouldBlockExecution(toolName, action.payload.parameters);
    if (blockCheck.blocked) {
      console.log(chalk.red(`[BLOCKED] 🚫 ${blockCheck.reason}`));
      if (blockCheck.existingError) {
        console.log(chalk.yellow(`[Error History] 此错误已发生 ${blockCheck.existingError.attemptCount} 次`));
        console.log(chalk.gray(`上次错误: ${blockCheck.existingError.errorMessage}`));
      }
      this.context.addMessage("system", `BLOCKED: ${blockCheck.reason}. 建议尝试不同的方法。`);
      return 'blocked';
    }

    return null;
  }

  private async executeAction(action: ProposedAction, _writeModeState: WriteModeState | null): Promise<any> {
    console.log(chalk.yellow(`[EXECUTING] ⚙️ ${action.type}...`));
    return await ToolExecutor.execute(action as any);
  }

  private handleSuccessfulExecution(
    result: any,
    action: ProposedAction,
    lastToolCall: ToolCallRecord | null,
    userInput: string,
    writeModeState: WriteModeState | null,
    mode: string,
    thought: AgentThought,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): ToolCallRecord | null {
    const actualToolName = action.payload?.tool_name || action.type;
    this.context.addToolResult(actualToolName, result.output);

    const preview = result.output.length > 300 ? result.output.substring(0, 300) + '...' : result.output;
    console.log(chalk.green(`[SUCCESS] Result:\n${preview}`));

    // Stabilization detection: 检查输出是否稳定（排除错误输出）
    const normalizedOutput = result.output?.trim()?.split('\n').filter(Boolean)[0] || '';
    const isErrorMessage = /invalid option|unknown|error|failed|no such|cannot|usage:|not found/i.test(normalizedOutput);

    if (!isErrorMessage) {
      // 方案3: 语义完成检测 — 输出已经是直接答案（适用于首轮查询，必须在 prevOutput 检测之前）
      // 只有当完整输出都很短时才触发，避免在截断的多行输出上误触发
      if (result.output.length < 100 && this.isSemanticComplete(normalizedOutput, userInput)) {
        console.log(chalk.yellow('[Semantic Complete] 输出已经是直接答案，自动完成'));
        console.log(chalk.cyan(`\n✓ 结果: ${normalizedOutput}\n`));
        this.context.addMessage("assistant", result.output);
        agentRenderer && (() => { (agentRenderer as any).buffer = ''; (agentRenderer as any).quietMode = true; agentRenderer.finish(); })();
        return null; // signal break
      }

      // 方案4: 截断输出检测 — 结果被截断但已包含数据，引导 AI 完成
      if (result.output.includes('[⚠️ OUTPUT TRUNCATED]') && normalizedOutput.length > 0) {
        this.context.addMessage('system', `输出已截断，但已包含足够的数据。请直接使用 answer 类型向用户呈现你看到的结果，不要再运行更多命令。`);
      }

      // 方案1: 连续两次输出完全相同
      const prevOutput = lastToolCall?.lastOutput;
      const isOutputStable = prevOutput && normalizedOutput && prevOutput === normalizedOutput;

      // 方案2: 最近2次输出包含相同的文件/路径名（即使命令不同）
      const extractPath = (line: string) => {
        const parts = line.trim().split(/\s+/);
        return parts.length > 1 ? parts[parts.length - 1] : '';
      };
      const currentPath = extractPath(normalizedOutput);
      const prevPath = prevOutput ? extractPath(prevOutput) : '';
      const isOutputStableByName = currentPath && prevPath && currentPath === prevPath;

      if (isOutputStable || isOutputStableByName) {
        console.log(chalk.yellow('[Stabilization] 输出结果已稳定，自动完成'));
        console.log(chalk.cyan(`\n✓ 结果: ${normalizedOutput}\n`));
        this.context.addMessage("assistant", result.output);
        agentRenderer && (() => { (agentRenderer as any).buffer = ''; (agentRenderer as any).quietMode = true; agentRenderer.finish(); })();
        return null; // signal break
      }
    }

    // Duplicate detection: 区分 tool_call 和 shell_cmd
    const actualTool = action.payload?.tool_name || action.type;
    const params = action.payload?.tool_name === 'shell_cmd' || action.type === 'shell_cmd'
      ? { command: (action.payload?.command || action.payload?.parameters?.command || '') }
      : (action.payload?.parameters || action.payload);

    const currentToolCall = { tool: actualTool, params };
    const isDuplicate = lastToolCall &&
      lastToolCall.tool === currentToolCall.tool &&
      JSON.stringify(lastToolCall.params) === JSON.stringify(currentToolCall.params);

    // Build output history for stabilization detection
    const outputHistory = [...((lastToolCall as any)?.outputHistory || []), normalizedOutput].slice(-3);

    if (isDuplicate && lastToolCall) {
      const count = lastToolCall.count + 1;

      // 如果是错误输出，提示 AI 换方案
      if (isErrorMessage) {
        if (count >= 2) {
          const failedCmd = actualTool === 'shell_cmd'
            ? (lastToolCall.params?.command || '')
            : '';
          console.log(chalk.yellow('[Duplicate Error] 相同命令重复失败 2 次，自动终止该路径'));
          let errorMsg = `命令执行失败，且已重复尝试 2 次。请换一种完全不同的方法来完成用户任务: "${userInput}"。`;
          if (failedCmd) {
            errorMsg += `\n⚠️ 命令 "${failedCmd}" 在当前系统不可用，已被列入本次对话黑名单，不要再使用此命令。`;
          }
          errorMsg += `\n注意：当前系统可能是 macOS（BSD 工具链），不支持 Linux 特定的命令选项。请使用 macOS 兼容的命令。`;
          this.context.addMessage('system', errorMsg);
          // 重置重复计数让新命令不被当作重复
          lastToolCall = { tool: 'reset', params: {}, count: 0, lastOutput: '', outputHistory: [] };
          return lastToolCall;
        }
        console.log(chalk.gray(`[Repeat Error] 重复失败 (${count + 1}/2)，请换方案...`));
      } else if (count >= 2) {
        console.log(chalk.yellow('[Duplicate Detection] 达到重复限制，强制完成'));
        console.log(chalk.cyan(`\n✓ ${action.payload?.tool_name || action.type} 已完成\n`));
        agentRenderer && (() => { (agentRenderer as any).buffer = ''; (agentRenderer as any).quietMode = true; agentRenderer.finish(); })();
        return null; // signal break
      } else {
        console.log(chalk.gray(`[Repeat Detection] 重复调用 (${count + 1}/2)，继续...`));
      }
      lastToolCall.count = count;
      lastToolCall.lastOutput = normalizedOutput;
      (lastToolCall as any).outputHistory = outputHistory;

      if (!isErrorMessage) {
        // 告诉 AI 结果已重复，应该返回答案而不是继续调用工具
        this.context.addMessage('system', `同样的操作已经重复执行了 ${count} 次，结果没有变化。请停止继续调用工具，使用 answer 类型返回最终结果给用户。输出: "${result.output.slice(0, 200)}"`);
      }
    } else {
      lastToolCall = { ...currentToolCall, count: 0, lastOutput: normalizedOutput, outputHistory };
    }

    // Auto-complete logic for specific tool types
    if (action.type === 'tool_call') {
      const toolName = action.payload.tool_name;

      if (toolName === 'write_file') {
        console.log(chalk.gray('[Auto-Complete] 文件写入成功，自动完成任务'));
        console.log(chalk.green(`✓ 已创建文件: ${action.payload.parameters.path}\n`));
        this.context.addMessage("assistant", `已成功创建文件 ${action.payload.parameters.path}`);
        agentRenderer && (() => { (agentRenderer as any).buffer = ''; (agentRenderer as any).quietMode = true; agentRenderer.finish(); })();
        (result as any).shouldBreak = true;
        return lastToolCall;
      }

      if (this.readOnlyTools.includes(toolName)) {
        const requiresAnalysis = /^(.*?)(帮我|请)?(分析|解释|说明|总结)|\b(review|explain)\s+(this|the|it)\b/i.test(userInput);
        const requiresWrite = /替换|replace|修改|modify|添加|append|插入|insert|删除|delete|移除|remove|更新|update|改成|改成|改为/i.test(userInput);

        // Command 模式下不自动完成，让 AI 自行决定后续操作
        if (mode === 'command') {
          console.log(chalk.gray('[Command Mode] 只读工具执行成功，等待 AI 决定下一步'));
          return lastToolCall;
        }

        // REPL/Chat 模式下不自动完成，让 AI 基于工具结果正常回答
        if (mode === 'chat') {
          // 对于简单的只读查询，直接格式化结果返回，避免额外 LLM 调用
          const formatted = this.tryFormatToolResult(result.output, userInput);
          if (formatted) {
            console.log(chalk.green(`\n${formatted}\n`));
            this.context.addMessage("assistant", formatted);
            agentRenderer && (() => { (agentRenderer as any).buffer = ''; (agentRenderer as any).quietMode = true; agentRenderer.finish(); })();
            return null; // 直接 break
          }
          this.context.addMessage('system', `请根据以上工具结果，简洁回答用户的问题。`);
          return lastToolCall;
        }

        if (!requiresAnalysis && !requiresWrite) {
          console.log(chalk.gray('[Auto-Complete] 只读工具执行成功，自动完成任务'));
          console.log(chalk.cyan(`\n📄 ${toolName} 结果：\n`));
          console.log(result.output);
          this.context.addMessage("assistant", `已成功执行 ${toolName}，结果：\n${result.output}`);
          agentRenderer && (() => { (agentRenderer as any).buffer = ''; (agentRenderer as any).quietMode = true; agentRenderer.finish(); })();
          (result as any).shouldBreak = true;
          return lastToolCall;
        } else if (requiresWrite) {
          console.log(chalk.gray('[Write Mode] 文件已读取，继续执行写入操作...'));
          if (writeModeState) {
            writeModeState.filePath = action.payload.parameters.path;
            writeModeState.content = result.output;
          }
          this.context.addMessage('system', `文件 ${action.payload.parameters.path} 已成功读取。请根据用户要求修改内容后，调用 write_file 工具写入文件。不要重复调用 read_file！`);
        } else {
          console.log(chalk.gray('[Analysis Mode] 文件已读取，继续分析...'));
        }
      }
    }

    // Learn from this execution
    this.learnFromExecution(userInput, mode, thought).catch(() => {});

    return lastToolCall;
  }

  private async handleFailedExecution(
    result: any,
    action: ProposedAction,
    mode: string,
    thought: AgentThought,
    userInput: string
  ): Promise<string> {
    const actualToolName = action.payload?.tool_name || action.type;
    this.context.addToolResult(actualToolName, `Error: ${result.error}`);
    console.log(chalk.red(`[ERROR] ${result.error}`));

    // Record to error tracker
    if (action.type === 'tool_call') {
      ErrorTracker.recordError(action.payload.tool_name, action.payload.parameters, result.error || 'Unknown error', { mode, model: thought.modelName, userInput });
    } else if (action.type === 'shell_cmd') {
      ErrorTracker.recordError('shell_cmd', { command: action.payload.command }, result.error || 'Unknown error', { mode, model: thought.modelName, userInput });
    }

    // Auto-fix for shell_cmd failures
    if (action.type === 'shell_cmd' && result.error) {
      console.log(chalk.yellow('[AutoFix] 尝试自动修复命令...'));
      try {
        const { autoFixCommand } = await import('../core/autofix');
        const { getOSProfile } = await import('../core/os');
        const os = getOSProfile();

        const fixPlan = await autoFixCommand(action.payload.command, result.error || result.output || '', os, thought.modelName);
        if (fixPlan && fixPlan.command) {
          console.log(chalk.cyan(`[AutoFix] 建议修复命令: ${fixPlan.command}`));
          console.log(chalk.gray(`[AutoFix] 说明: ${fixPlan.plan || '无'}`));
          this.context.addMessage('system', `自动修复建议：${fixPlan.command}\n原因：${fixPlan.plan || '无'}`);

          if (fixPlan.risk === 'low') {
            console.log(chalk.yellow('[AutoFix] 修复方案风险低，自动执行...'));
            const fixedAction: ProposedAction = {
              id: randomUUID(),
              type: 'shell_cmd',
              payload: { command: fixPlan.command },
              riskLevel: 'low',
              reasoning: `AutoFix from failed command: ${action.payload.command}`
            };
            const fixedResult = await ToolExecutor.execute(fixedAction as any);
            if (fixedResult.success) {
              console.log(chalk.green('[AutoFix] 修复成功！'));
              this.context.addToolResult('shell_cmd', fixedResult.output);
              return ''; // clear error
            } else {
              console.log(chalk.red('[AutoFix] 修复失败，继续原始错误处理'));
            }
          }
        } else {
          console.log(chalk.gray('[AutoFix] 无法生成修复建议'));
        }
      } catch (fixError: any) {
        console.warn(chalk.yellow(`[AutoFix] 修复过程出错: ${fixError.message}`));
      }
    }

    return result.error;
  }

  /**
   * 语义完成检测：输出是否已经是直接答案
   * 用于防止 AI 在已经获取答案后继续无意义地查询
   */
  private isSemanticComplete(output: string, userInput: string): boolean {
    const trimmed = output.trim();

    // 输出必须是短的（直接答案通常很短）
    if (trimmed.length > 100 || trimmed.length === 0) return false;

    // 输出不能包含多行
    if (trimmed.includes('\n')) return false;

    const q = userInput.toLowerCase();

    // 1. 问"大小/多少字节" → 输出是纯数字 或 带单位的短文本（如 "4.0K"、"288K"、"1.5MB"）
    if (/(大小|多少字节|多大|size|bytes?)/.test(q)) {
      if (/^\d+(\.\d+)?$/.test(trimmed)) return true;
      // 人类可读格式：数字+单位，可能带前后空格和路径
      if (/^[\d.]+\s*[KMGT]?B?$/i.test(trimmed)) return true;
      // 带路径的格式：如 "4.0K    ./package.json"
      if (/^[\d.]+\s*[KMGT]?B?\s+\S+/i.test(trimmed)) return true;
    }

    // 2. 问"几个/多少个/数量/count" → 输出是纯数字
    if (/(几个|多少个|数量|count|how many)/.test(q) && /^\d+$/.test(trimmed)) return true;

    // 3. 问"最大/最小的文件" → 输出是 "数字 路径" 格式（如 "0 ./foo.txt"）
    if (/(最大|最小|largest|smallest).*文件/.test(q) && /^\d+\s+\.\//.test(trimmed)) return true;

    // 4. 问"最新/最早"的文件 → 输出是单个文件名或带信息的短行
    if (/(最新|最旧|最近|最早|newest|latest|oldest)/.test(q) && trimmed.split(/\s+/).length <= 5 && trimmed.length < 80) return true;

    // 5. 问"行数" → 输出是纯数字
    if (/(行数|多少行|line.?count|多少 line)/.test(q) && /^\d+$/.test(trimmed)) return true;

    // 6. 通用：输出是短小的、看起来像答案的内容（单行，< 50 字符，不是命令输出）
    // 排除：以 - 开头（ls -l 风格）、包含多个空格的长行
    if (trimmed.length < 50 && !trimmed.startsWith('-') && trimmed.split(/\s+/).length <= 4) {
      // 包含数字或路径，看起来像答案
      if (/\d+|\.\//.test(trimmed)) return true;
    }

    return false;
  }

  /**
   * 尝试直接格式化工具结果，避免额外的 LLM 调用
   * 适用于简单的只读查询（如 list_files 的结果配合简单问题）
   */
  private tryFormatToolResult(output: string, userInput: string): string | null {
    // 只对较短的输出直接格式化
    if (output.length > 5000) return null;

    // 如果问题需要进一步处理（如找最大/最小文件），不直接格式化
    if (/(最大|最小|哪个.*最大|哪个.*最小|largest|smallest|biggest)/.test(userInput)) {
      return null;
    }

    // 尝试解析 JSON 数组（如 list_files 的结果）
    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].path) {
        // 如果用户只问"有几个文件"或"列出文件"，直接格式化
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

    // 输出较短且为单行，可能是直接答案
    if (output.length < 200 && !output.includes('\n')) {
      return output;
    }

    return null;
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
      console.warn(chalk.yellow(`[Skill Learning] Failed: ${error}`));
    }
  }
}
