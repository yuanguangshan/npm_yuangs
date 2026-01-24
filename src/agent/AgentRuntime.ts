import chalk from "chalk";
import { randomUUID } from "crypto";
import * as marked from "marked";
import TerminalRenderer from "marked-terminal";

// Configure marked with TerminalRenderer
const terminalRenderer = new TerminalRenderer();
marked.setOptions({ renderer: terminalRenderer });

import { LLMAdapter } from "./llmAdapter";
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

    // 构建初始动态上下文
    const initialDynamicContext = await buildDynamicContext();

    if (userInput) {
      this.context.addMessage("user", userInput);
    }

    while (turnCount < maxTurns) {
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

      const thought = await LLMAdapter.think(
        messages,
        mode as any,
        agentOnChunk,
        model,
        enhancedPrompt,
        this.context,
      );

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

      // 如果 LLM 认为已经完成或者当前的动作就是回答
      if (thought.isDone || action.type === "answer") {
        const result = await ToolExecutor.execute(action as any);

        if (!onChunk) {
          if (agentRenderer) {
            // Stream final answer through renderer
            for (let i = 0; i < result.output.length; i += 10) {
              const chunk = result.output.slice(i, i + 10);
              agentRenderer.onChunk(chunk);
            }
            agentRenderer.finish();
          } else {
            const rendered = marked.parse(result.output);
            console.log(chalk.green(`\n🤖 AI：\n`) + rendered);
          }
        }

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
    }

    if (turnCount >= maxTurns) {
      console.log(chalk.red(`\n⚠️ Max turns (${maxTurns}) reached.`));
    }
  }
}
