import chalk from "chalk";
import { randomUUID } from "crypto";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

// Configure marked
marked.setOptions({
  renderer: new TerminalRenderer()
});
import { LLMAdapter } from "./llmAdapter";
import { GovernanceService } from "./governance";
import { ToolExecutor } from "./executor";
import { ContextManager } from "./contextManager";
import { evaluateProposal } from "./governance/core";
import { ProposedAction } from "./state";
import {
  buildDynamicContext,
  injectDynamicContext,
  DynamicContext
} from "./dynamicPrompt";

export class AgentRuntime {
  private context: ContextManager;
  private executionId: string;

  constructor(initialContext: any) {
    this.context = new ContextManager(initialContext);
    this.executionId = randomUUID();
  }

  async run(
    userInput: string,
    mode: "chat" | "command" = "chat",
    onChunk?: (chunk: string) => void,
    model?: string,
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

      // 构建动态上下文（如果上一步有错误）
      const dynamicContext = await buildDynamicContext(lastError);

      const messages = this.context.getMessages().map((msg) => ({
        role: (msg.role === "tool" ? "system" : msg.role) as
          | "system"
          | "user"
          | "assistant",
        content: msg.content,
      }));

      // 构建基础prompt（包括治理策略）
      const basePrompt = GovernanceService.getPolicyManual();

      // 注入动态上下文
      const enhancedPrompt = injectDynamicContext(basePrompt, dynamicContext);

      const thought = await LLMAdapter.think(
        messages,
        mode as any,
        onChunk,
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
          const rendered = marked(result.output);
          console.log(chalk.green(`\n🤖 AI：\n`) + rendered);
        }
        this.context.addMessage("assistant", result.output);
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
