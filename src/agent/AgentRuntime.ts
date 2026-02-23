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
import { ContextManager } from "./contextManager";
import { SmartContextManager } from "./smartContextManager";
import { evaluateProposal } from "./governance/core";
import { ProposedAction } from "./state";
import {
  buildDynamicContext,
  injectDynamicContext,
  DynamicContext
} from "./dynamicPrompt";
import { StreamMarkdownRenderer } from '../utils/renderer';

export class AgentRuntime {
  private context: SmartContextManager;
  private executionId: string;

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
    const maxTurns = 10;
    let lastError: string | undefined;
    let shouldComplete = false; // 标记是否应该完成
    let lastToolCall: { tool: string; params: any; count: number } | null = null; // 跟踪上次工具调用及重复次数

    // 构建初始动态上下文
    const initialDynamicContext = await buildDynamicContext();

    if (userInput) {
      this.context.addMessage("user", userInput);
    }

    while (turnCount < maxTurns) {
      // 检查是否应该完成（上一轮只读工具成功）
      if (shouldComplete) {
        console.log(chalk.gray('[Task Complete] 任务已完成'));
        break;
      }

      const currentTurn = ++turnCount;
      if (currentTurn > 1) {
        console.log(chalk.blue(`\n--- Turn ${currentTurn} ---`));
      }

      // Use smart context manager to get relevance-ranked context
      const enhancedContext = await this.context.getEnhancedContext({
        query: userInput,
        minRelevance: 0.3,
        maxTokens: 8000,
        enableSmartSummary: true
      });

      const messages: any[] = [];

      // Add context overview as system message
      if (enhancedContext.summary) {
        messages.push({
          role: 'system',
          content: enhancedContext.summary
        });
      }

      // Add ranked context files
      for (const item of enhancedContext.rankedItems) {
        messages.push({
          role: 'user',
          content: `@${item.path} (相关度: ${(item.relevance * 100).toFixed(0)}%)\n${item.summary || item.content || ''}`
        });
      }

      // Add user input
      if (userInput) {
        messages.push({
          role: 'user',
          content: userInput
        });
      }

      // Build dynamic context (if previous step had error)
      const dynamicContext = await buildDynamicContext(lastError);

      // 构建基础prompt（包括治理策略）
      const basePrompt = GovernanceService.getPolicyManual();

      // 注入动态上下文
      const enhancedPrompt = injectDynamicContext(basePrompt, dynamicContext);

      // Create renderer if not provided but onChunk is available
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

      let thought;
      try {
        thought = await LLMAdapter.think(
          messages,
          mode as any,
          agentOnChunk,
          model,
          enhancedPrompt,
          this.context,
        );

        if (!thought.raw || thought.raw.trim() === '') {
          console.log(chalk.red('\n⚠️ AI 返回了空响应，请检查网络连接或模型配置。'));
          break;
        }
      } catch (error: unknown) {
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
        
        this.context.addMessage("system", `思考过程中发生错误${statusInfo}: ${errorMessage}`);
        
        if (statusCode === 401 || statusCode === 403 || errorMessage.includes('401') || errorMessage.includes('403')) {
          console.log(chalk.yellow('💡 检测到权限或授权错误，请检查 API 配置。'));
          break;
        }
        
        if (statusCode === 429) {
          console.log(chalk.yellow('💡 API 调用频率过高，请稍后再试。'));
        }

        break;
      }

      try {
        const action: ProposedAction = {
          id: randomUUID(),
          type: (thought.type as any) || "answer",
          payload: thought.payload || { text: thought.raw },
          riskLevel: "low",
          reasoning: thought.reasoning || "",
        };

        if (action.reasoning && !onChunk) {
          console.log(chalk.gray(`\n🤔 Reasoning: ${action.reasoning}`));
        }

        if (thought.usedRouter) {
          console.log(chalk.gray(`[Router] 🤖 Model: ${thought.modelName}`));
        }

        // 如果 LLM 认为已经完成或者当前的动作就是回答
        if (thought.isDone || action.type === "answer") {
          const result = await ToolExecutor.execute(action as any);
          // ... rest of the logic

        // 如果没有 renderer，使用内部创建的
        if (!renderer && agentRenderer) {
          // Stream final answer through internal renderer
          for (let i = 0; i < result.output.length; i += 10) {
            const chunk = result.output.slice(i, i + 10);
            agentRenderer.onChunk(chunk);
          }
          agentRenderer.finish();
        } else if (!renderer) {
          // Fallback to marked if no renderer
          const rendered = marked.parse(result.output);
          console.log(chalk.green(`\n🤖 AI：\n`) + rendered);
        }
        // 如果外部传入了 renderer，由外部调用 finish()

        this.context.addMessage("assistant", result.output);

        // Learn from successful chat
        try {
          const { createExecutionRecord } = await import('../core/executionRecord');
          const { inferCapabilityRequirement } = await import('../core/capabilityInference');
          const { saveExecutionRecord } = await import('../core/executionStore');

          const record = createExecutionRecord(
            'agent-chat',
            { required: [], preferred: [] } as any,
            {
              aiProxyUrl: { value: '', source: 'built-in' },
              defaultModel: { value: '', source: 'built-in' },
              accountType: { value: 'free', source: 'built-in' }
            } as any,
            { selected: null, candidates: [], fallbackOccurred: false },
            { success: true },
            undefined,
            userInput,
            'chat'
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

        break;
      }

      // === 强制 ACK 校验（Causal Lock） ===
      const lastObs = this.context.getLastAckableObservation();
      const ackText = thought.parsedPlan?.acknowledged_observation;

      if (lastObs && ackText && ackText !== 'NONE') {
        const actualContent = lastObs.content.trim();
        const ackedContent = ackText.trim();

        if (actualContent !== ackedContent) {
          console.log(
            chalk.red(`[CAUSAL BREAK] ❌ ACK mismatch!`),
          );
          console.log(chalk.red(`  Expected: ${actualContent.substring(0, 100)}...`));
          console.log(chalk.red(`  Received: ${ackedContent.substring(0, 100)}...`));
          this.context.addMessage(
            "system",
            `CAUSAL BREAK: ACK does not match physical Observation. Cannot proceed without acknowledging reality.`,
          );
          continue;
        }

        console.log(chalk.green(`[CAUSAL LOCK] ✅ ACK verified`));
      }

      // === 预检 (Pre-flight) ===
      const preCheck = evaluateProposal(
        action,
        GovernanceService.getRules(),
        GovernanceService.getLedgerSnapshot(),
      );
      if (preCheck.effect === "deny") {
        console.log(
          chalk.red(`[PRE-FLIGHT] 🛡️ Policy Blocked: ${preCheck.reason}`),
        );
        this.context.addMessage(
          "system",
          `POLICY DENIED: ${preCheck.reason}. Find a different way.`,
        );
        continue;
      }

      // === 正式治理 (WASM + 人工/自动) ===
      const decision = await GovernanceService.adjudicate(action);
      if (decision.status === "rejected") {
        console.log(chalk.red(`[GOVERNANCE] ❌ Rejected: ${decision.reason}`));
        this.context.addMessage(
          "system",
          `Rejected by Governance: ${decision.reason}`,
        );
        continue;
      }

      // === 记录因果边到 KG ===
      if (lastObs && lastObs.metadata?.obsId && ackText && ackText !== 'NONE') {
        try {
          const { recordEdge } = await import('../engine/agent/knowledgeGraph');
          recordEdge({
            from: lastObs.metadata.obsId,
            to: action.id,
            type: 'ACKNOWLEDGED_BY' as any,
            metadata: {
              verified: true,
              timestamp: Date.now()
            }
          });
          console.log(chalk.gray(`[KG] ⚓ Causal edge recorded`));
        } catch (error: any) {
          console.warn(chalk.yellow(`[KG] Warning: Failed to record causal edge: ${error.message}`));
        }
      }

      // === 执行 ===
      console.log(chalk.yellow(`[EXECUTING] ⚙️ ${action.type}...`));
      const result = await ToolExecutor.execute(action as any);

      if (result.success) {
        // 成功时清除错误状态
        lastError = undefined;
        this.context.addToolResult(action.type, result.output);
        const preview = result.output.length > 300
          ? result.output.substring(0, 300) + '...'
          : result.output;
        console.log(chalk.green(`[SUCCESS] Result:\n${preview}`));

        // 通用重复检测：所有工具
        const currentToolCall = { tool: action.payload.tool_name || action.type, params: action.payload.parameters || action.payload };

        // 检查是否重复，并允许一定次数的重复（给 AI 时间完成多步骤任务）
        let duplicateCount = 0;
        const isDuplicate = lastToolCall &&
          lastToolCall.tool === currentToolCall.tool &&
          JSON.stringify(lastToolCall.params) === JSON.stringify(currentToolCall.params);

        if (isDuplicate) {
          duplicateCount = (lastToolCall as any).count || 0;

          // 允许最多 2 次重复调用（给 AI 时间完成任务）
          if (duplicateCount >= 2) {
            console.log(chalk.yellow('[Duplicate Detection] 达到重复限制，强制完成'));
            console.log(chalk.cyan(`\n✓ ${action.payload.tool_name || action.type} 已完成\n`));

            if (agentRenderer) {
              (agentRenderer as any).buffer = '';
              (agentRenderer as any).quietMode = true;
              agentRenderer.finish();
            }

            break;
          } else {
            console.log(chalk.gray(`[Repeat Detection] 重复调用 (${duplicateCount + 1}/2)，继续...`));
          }
        }

        // 更新上次工具调用记录（包含计数）
        if (isDuplicate && lastToolCall) {
          (lastToolCall as any).count = duplicateCount + 1;
        } else {
          lastToolCall = { ...currentToolCall, count: 0 };
        }

        // 智能完成：根据工具类型和用户意图决定是否自动完成
        if (action.type === 'tool_call') {
          const toolName = action.payload.tool_name;

          // 写入文件成功后自动完成
          if (toolName === 'write_file') {
            console.log(chalk.gray('[Auto-Complete] 文件写入成功，自动完成任务'));
            console.log(chalk.green(`✓ 已创建文件: ${action.payload.parameters.path}\n`));

            this.context.addMessage("assistant", `已成功创建文件 ${action.payload.parameters.path}`);

            if (agentRenderer) {
              (agentRenderer as any).buffer = '';
              (agentRenderer as any).quietMode = true;
              agentRenderer.finish();
            }

            break;
          }

          // 只读工具处理
          const readOnlyTools = ['read_file', 'list_files'];
          if (readOnlyTools.includes(toolName)) {
            // 检测用户意图：如果要求"分析"、"解释"等，则不自动完成
            const requiresAnalysis = /分析|解释|说明|总结|review|explain/i.test(userInput);

            if (!requiresAnalysis) {
              // 简单读取请求，直接返回结果
              console.log(chalk.gray('[Auto-Complete] 只读工具执行成功，自动完成任务'));
              console.log(chalk.cyan(`\n📄 ${toolName} 结果：\n`));
              console.log(result.output);

              this.context.addMessage("assistant", `已成功执行 ${toolName}，结果：\n${result.output}`);

              if (agentRenderer) {
                (agentRenderer as any).buffer = '';
                (agentRenderer as any).quietMode = true;
                agentRenderer.finish();
              }

              break;
            } else {
              // 分析请求，继续循环让 AI 分析内容
              console.log(chalk.gray('[Analysis Mode] 文件已读取，继续分析...'));
            }
          }
        }

        // Learn from this successful execution
        try {
          const { createExecutionRecord } = await import('../core/executionRecord');
          const { inferCapabilityRequirement } = await import('../core/capabilityInference');
          const { saveExecutionRecord } = await import('../core/executionStore');

          const record = createExecutionRecord(
            `agent-${mode}`,
            { required: [], preferred: [] } as any,
            {
              aiProxyUrl: { value: '', source: 'built-in' },
              defaultModel: { value: '', source: 'built-in' },
              accountType: { value: 'free', source: 'built-in' }
            } as any,
            { selected: null, candidates: [], fallbackOccurred: false },
            { success: true },
            undefined,
            userInput,
            mode
          );

          // Attach thought/plan data for skill learning
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
      } else {
        // 失败时记录错误，下次循环会注入错误恢复指导
        lastError = result.error;
        this.context.addToolResult(action.type, `Error: ${result.error}`);
        console.log(chalk.red(`[ERROR] ${result.error}`));
      }
      } catch (error: unknown) {
        let errorMessage = '未知执行错误';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        console.log(chalk.red(`\n❌ 任务执行失败 [Action: ${thought?.type}]: ${errorMessage}`));
        this.context.addMessage("system", `执行引擎错误 [Action: ${thought?.type}]: ${errorMessage}`);
        break;
      }
    }

    if (turnCount >= maxTurns) {
      console.log(chalk.red(`\n⚠️ Max turns (${maxTurns}) reached.`));
    }
  }
}
