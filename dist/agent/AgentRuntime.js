"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
const smartContextManager_1 = require("./smartContextManager");
const renderer_1 = require("../utils/renderer");
const LLMCaller_1 = require("./LLMCaller");
const PreFlightChecker_1 = require("./PreFlightChecker");
const ExecutionHandler_1 = require("./ExecutionHandler");
const Logger_1 = require("../utils/Logger");
const log = Logger_1.logger.child('AgentRuntime');
/**
 * Agent orchestration runtime — coordinates LLM calls, governance,
 * pre-flight checks, and execution via delegated components.
 */
class AgentRuntime {
    context;
    executionId;
    maxTurns = 10;
    llmCaller;
    preFlight;
    execHandler;
    constructor(initialContext) {
        this.context = new smartContextManager_1.SmartContextManager(initialContext);
        this.executionId = (0, crypto_1.randomUUID)();
        this.llmCaller = new LLMCaller_1.LLMCaller(this.context);
        this.preFlight = new PreFlightChecker_1.PreFlightChecker(this.context);
        this.execHandler = new ExecutionHandler_1.ExecutionHandler(this.context);
    }
    async run(userInput, mode = "chat", onChunk, model, renderer) {
        let turnCount = 0;
        let lastError;
        let lastToolCall = null;
        let writeModeState = null;
        if (userInput) {
            this.context.addMessage("user", userInput);
        }
        while (turnCount < this.maxTurns) {
            const currentTurn = ++turnCount;
            if (currentTurn > 1) {
                console.log(chalk_1.default.blue(`\n--- Turn ${currentTurn} ---`));
            }
            const { agentRenderer, agentOnChunk } = this.prepareRenderer(renderer, onChunk);
            const enhancedPrompt = await this.llmCaller.buildPrompt(userInput, lastError);
            // === Step 1: LLM Thinking ===
            const thought = await this.llmCaller.call(enhancedPrompt, userInput, mode, agentOnChunk, model, agentRenderer);
            if (!thought)
                break;
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
                    const content = action.payload.content || action.payload.text || '';
                    this.context.addMessage('system', `在命令执行模式下，请直接使用工具执行命令，不要回复对话。请使用 list_directory_tree 查看文件列表，然后用 shell_cmd 执行命令来查找最大文件。任务: "${userInput}"`);
                    continue;
                }
                await this.execHandler.handleAnswer(action, thought, userInput, mode, renderer, agentRenderer);
                break;
            }
            // === Step 4: Causal ACK Check ===
            if (!this.preFlight.verifyAckCausality(thought))
                continue;
            // === Step 5: Governance ===
            if (!await this.preFlight.passGovernance(action))
                continue;
            // === Step 6: Record KG Edge ===
            await this.preFlight.recordKnowledgeGraphEdge(thought, action);
            // === Step 7: Pre-execution Checks ===
            const cachedResult = await this.preFlight.check(action, writeModeState, lastToolCall);
            if (cachedResult === 'blocked' || cachedResult === 'force_break') {
                if (cachedResult === 'force_break')
                    break;
                continue;
            }
            // === Step 8: Execute ===
            const result = cachedResult && typeof cachedResult === 'object'
                ? cachedResult
                : await this.execHandler.execute(action);
            if (result.success) {
                lastError = undefined;
                lastToolCall = this.execHandler.handleSuccess(result, action, lastToolCall, userInput, writeModeState, mode, thought, agentRenderer);
                if (lastToolCall === null)
                    break;
            }
            else {
                lastError = await this.execHandler.handleFailure(result, action, mode, thought, userInput);
            }
        }
        if (turnCount >= this.maxTurns) {
            console.log(chalk_1.default.red(`\n⚠️ Max turns (${this.maxTurns}) reached.`));
        }
    }
    // --- Private helpers ---
    prepareRenderer(renderer, onChunk) {
        let agentRenderer = renderer;
        let agentOnChunk = onChunk;
        if (!agentRenderer && agentOnChunk) {
            agentRenderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 Agent ') + ' ', undefined, { autoFinish: false });
            agentOnChunk = agentRenderer.startChunking();
        }
        return { agentRenderer, agentOnChunk };
    }
    buildAction(thought) {
        return {
            id: (0, crypto_1.randomUUID)(),
            type: thought.type || "answer",
            payload: thought.payload || { text: thought.raw },
            riskLevel: "low",
            reasoning: thought.reasoning || "",
        };
    }
}
exports.AgentRuntime = AgentRuntime;
//# sourceMappingURL=AgentRuntime.js.map