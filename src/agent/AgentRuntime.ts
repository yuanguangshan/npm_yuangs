import chalk from "chalk";
import { randomUUID } from "crypto";
import { ProposedAction, AgentThought } from "./state";
import { SmartContextManager } from "./smartContextManager";
import { StreamMarkdownRenderer } from '../utils/renderer';
import { LLMCaller } from "./LLMCaller";
import { PreFlightChecker } from "./PreFlightChecker";
import { ExecutionHandler } from "./ExecutionHandler";
import { logger } from '../utils/Logger';

const log = logger.child('AgentRuntime');

interface ToolCallRecord {
  tool: string;
  params: any;
  count: number;
  lastOutput?: string;
  outputHistory: string[];
  blockCount: number;
}

interface WriteModeState {
  filePath: string;
  content: string;
}

/**
 * Agent orchestration runtime — coordinates LLM calls, governance,
 * pre-flight checks, and execution via delegated components.
 */
export class AgentRuntime {
  private context: SmartContextManager;
  private executionId: string;
  private readonly maxTurns = 10;
  private llmCaller: LLMCaller;
  private preFlight: PreFlightChecker;
  private execHandler: ExecutionHandler;

  constructor(initialContext: any) {
    this.context = new SmartContextManager(initialContext);
    this.executionId = randomUUID();
    this.llmCaller = new LLMCaller(this.context);
    this.preFlight = new PreFlightChecker(this.context);
    this.execHandler = new ExecutionHandler(this.context);
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
      const enhancedPrompt = await this.llmCaller.buildPrompt(userInput, lastError);

      // === Step 1: LLM Thinking ===
      const thought = await this.llmCaller.call(
        enhancedPrompt, userInput, mode, agentOnChunk, model, agentRenderer
      );
      if (!thought) break;

      // === Step 2: Build Action ===
      const action = this.buildAction(thought);

      if (action.reasoning && !onChunk) {
        log.debug('LLM reasoning', { reasoning: action.reasoning });
      }
      if (thought.usedRouter) {
        log.debug('Router model selected', { model: thought.modelName });
      }

      // === Step 3: Handle answer type ===
      if (thought.isDone || action.type === "answer") {
        if (mode === "command") {
          const content = (action.payload as Record<string, unknown>).content as string || (action.payload as Record<string, unknown>).text as string || '';
          this.context.addMessage('system', `在命令执行模式下，请直接使用工具执行命令，不要回复对话。请使用 list_directory_tree 查看文件列表，然后用 shell_cmd 执行命令来查找最大文件。任务: "${userInput}"`);
          continue;
        }
        await this.execHandler.handleAnswer(action, thought, userInput, mode, renderer, agentRenderer);
        break;
      }

      // === Step 4: Causal ACK Check ===
      if (!this.preFlight.verifyAckCausality(thought)) continue;

      // === Step 5: Governance ===
      if (!await this.preFlight.passGovernance(action)) continue;

      // === Step 6: Record KG Edge ===
      await this.preFlight.recordKnowledgeGraphEdge(thought, action);

      // === Step 7: Pre-execution Checks ===
      const cachedResult = await this.preFlight.check(action, writeModeState, lastToolCall);
      if (cachedResult === 'blocked' || cachedResult === 'force_break') {
        if (cachedResult === 'force_break') break;
        continue;
      }

      // === Step 8: Execute ===
      const result = cachedResult && typeof cachedResult === 'object'
        ? cachedResult
        : await this.execHandler.execute(action);

      if (result.success) {
        lastError = undefined;
        lastToolCall = this.execHandler.handleSuccess(
          result, action, lastToolCall, userInput, writeModeState,
          mode, thought, agentRenderer
        );
        if (lastToolCall === null) break;
      } else {
        lastError = await this.execHandler.handleFailure(
          result, action, mode, thought, userInput
        );
      }
    }

    if (turnCount >= this.maxTurns) {
      console.log(chalk.red(`\n⚠️ Max turns (${this.maxTurns}) reached.`));
    }
  }

  // --- Private helpers ---

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

  private buildAction(thought: AgentThought): ProposedAction {
    return {
      id: randomUUID(),
      type: (thought.type as any) || "answer",
      payload: thought.payload || { text: thought.raw },
      riskLevel: "low",
      reasoning: thought.reasoning || "",
    };
  }
}
