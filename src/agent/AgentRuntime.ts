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

    if (userInput) {
      this.context.addMessage("user", userInput);
    }

    while (turnCount < maxTurns) {
      const currentTurn = ++turnCount;
      if (currentTurn > 1) {
        console.log(chalk.blue(`\n--- Turn ${currentTurn} ---`));
      }

      const messages = this.context.getMessages().map((msg) => ({
        role: (msg.role === "tool" ? "system" : msg.role) as
          | "system"
          | "user"
          | "assistant",
        content: msg.content,
      }));

      const thought = await LLMAdapter.think(
        messages,
        mode as any,
        onChunk,
        model,
        GovernanceService.getPolicyManual(),
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

      // === 执行 ===
      console.log(chalk.yellow(`[EXECUTING] ⚙️ ${action.type}...`));
      const result = await ToolExecutor.execute(action as any);

      if (result.success) {
        this.context.addToolResult(action.type, result.output);
        const preview = result.output.length > 300
          ? result.output.substring(0, 300) + '...'
          : result.output;
        console.log(chalk.green(`[SUCCESS] Result:\n${preview}`));
      } else {
        this.context.addToolResult(action.type, `Error: ${result.error}`);
        console.log(chalk.red(`[ERROR] ${result.error}`));
      }
    }

    if (turnCount >= maxTurns) {
      console.log(chalk.red(`\n⚠️ Max turns (${maxTurns}) reached.`));
    }
  }
}
