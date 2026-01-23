"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
const marked_1 = require("marked");
const marked_terminal_1 = __importDefault(require("marked-terminal"));
// Configure marked
marked_1.marked.setOptions({
    renderer: new marked_terminal_1.default()
});
const llmAdapter_1 = require("./llmAdapter");
const governance_1 = require("./governance");
const executor_1 = require("./executor");
const contextManager_1 = require("./contextManager");
const core_1 = require("./governance/core");
const dynamicPrompt_1 = require("./dynamicPrompt");
class AgentRuntime {
    context;
    executionId;
    constructor(initialContext) {
        this.context = new contextManager_1.ContextManager(initialContext);
        this.executionId = (0, crypto_1.randomUUID)();
    }
    async run(userInput, mode = "chat", onChunk, model) {
        let turnCount = 0;
        const maxTurns = 10;
        let lastError;
        // 构建初始动态上下文
        const initialDynamicContext = await (0, dynamicPrompt_1.buildDynamicContext)();
        if (userInput) {
            this.context.addMessage("user", userInput);
        }
        while (turnCount < maxTurns) {
            const currentTurn = ++turnCount;
            if (currentTurn > 1) {
                console.log(chalk_1.default.blue(`\n--- Turn ${currentTurn} ---`));
            }
            // 构建动态上下文（如果上一步有错误）
            const dynamicContext = await (0, dynamicPrompt_1.buildDynamicContext)(lastError);
            const messages = this.context.getMessages().map((msg) => ({
                role: (msg.role === "tool" ? "system" : msg.role),
                content: msg.content,
            }));
            // 构建基础prompt（包括治理策略）
            const basePrompt = governance_1.GovernanceService.getPolicyManual();
            // 注入动态上下文
            const enhancedPrompt = (0, dynamicPrompt_1.injectDynamicContext)(basePrompt, dynamicContext);
            const thought = await llmAdapter_1.LLMAdapter.think(messages, mode, onChunk, model, enhancedPrompt);
            const action = {
                id: (0, crypto_1.randomUUID)(),
                type: thought.type || "answer",
                payload: thought.payload || { text: thought.raw },
                riskLevel: "low",
                reasoning: thought.reasoning || "",
            };
            if (action.reasoning && !onChunk) {
                console.log(chalk_1.default.gray(`\n🤔 Reasoning: ${action.reasoning}`));
            }
            // 如果 LLM 认为已经完成或者当前的动作就是回答
            if (thought.isDone || action.type === "answer") {
                const result = await executor_1.ToolExecutor.execute(action);
                if (!onChunk) {
                    const rendered = (0, marked_1.marked)(result.output);
                    console.log(chalk_1.default.green(`\n🤖 AI：\n`) + rendered);
                }
                this.context.addMessage("assistant", result.output);
                break;
            }
            // === 预检 (Pre-flight) ===
            const preCheck = (0, core_1.evaluateProposal)(action, governance_1.GovernanceService.getRules(), governance_1.GovernanceService.getLedgerSnapshot());
            if (preCheck.effect === "deny") {
                console.log(chalk_1.default.red(`[PRE-FLIGHT] 🛡️ Policy Blocked: ${preCheck.reason}`));
                this.context.addMessage("system", `POLICY DENIED: ${preCheck.reason}. Find a different way.`);
                continue;
            }
            // === 正式治理 (WASM + 人工/自动) ===
            const decision = await governance_1.GovernanceService.adjudicate(action);
            if (decision.status === "rejected") {
                console.log(chalk_1.default.red(`[GOVERNANCE] ❌ Rejected: ${decision.reason}`));
                this.context.addMessage("system", `Rejected by Governance: ${decision.reason}`);
                continue;
            }
            // === 执行 ===
            console.log(chalk_1.default.yellow(`[EXECUTING] ⚙️ ${action.type}...`));
            const result = await executor_1.ToolExecutor.execute(action);
            if (result.success) {
                // 成功时清除错误状态
                lastError = undefined;
                this.context.addToolResult(action.type, result.output);
                const preview = result.output.length > 300
                    ? result.output.substring(0, 300) + '...'
                    : result.output;
                console.log(chalk_1.default.green(`[SUCCESS] Result:\n${preview}`));
            }
            else {
                // 失败时记录错误，下次循环会注入错误恢复指导
                lastError = result.error;
                this.context.addToolResult(action.type, `Error: ${result.error}`);
                console.log(chalk_1.default.red(`[ERROR] ${result.error}`));
            }
        }
        if (turnCount >= maxTurns) {
            console.log(chalk_1.default.red(`\n⚠️ Max turns (${maxTurns}) reached.`));
        }
    }
}
exports.AgentRuntime = AgentRuntime;
//# sourceMappingURL=AgentRuntime.js.map