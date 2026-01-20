"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
const llmAdapter_1 = require("./llmAdapter");
const governance_1 = require("./governance");
const executor_1 = require("./executor");
const contextManager_1 = require("./contextManager");
const core_1 = require("./governance/core");
class AgentRuntime {
    context;
    executionId;
    constructor(initialContext) {
        this.context = new contextManager_1.ContextManager(initialContext);
        this.executionId = (0, crypto_1.randomUUID)();
    }
    async run(userInput, mode = 'chat') {
        let turnCount = 0;
        const maxTurns = 10;
        console.log(chalk_1.default.cyan(`\n🚀 Agent Runtime v2.0 Starting (Execution ID: ${this.executionId})`));
        this.context.addMessage('user', userInput);
        while (turnCount < maxTurns) {
            console.log(chalk_1.default.blue(`\n--- Turn ${++turnCount} ---`));
            const model = 'Assistant';
            // 处理类型不兼容：将 tool role 映射为 system
            const messages = this.context.getMessages().map(msg => ({
                role: (msg.role === 'tool' ? 'system' : msg.role),
                content: msg.content
            }));
            const thought = await llmAdapter_1.LLMAdapter.think(messages, mode, undefined, governance_1.GovernanceService.getPolicyManual());
            if (thought.isDone) {
                console.log(chalk_1.default.green('\n✅ Goal satisfied.'));
                break;
            }
            const action = {
                id: (0, crypto_1.randomUUID)(),
                type: thought.type || 'answer',
                payload: thought.payload || { text: thought.raw },
                riskLevel: 'low',
                reasoning: thought.reasoning || ''
            };
            // === 预检 (Pre-flight) ===
            const preCheck = (0, core_1.evaluateProposal)(action, governance_1.GovernanceService.getRules(), governance_1.GovernanceService.getLedgerSnapshot());
            if (preCheck.effect === 'deny') {
                console.log(chalk_1.default.red(`[PRE-FLIGHT] 🛡️ Policy Blocked: ${preCheck.reason}`));
                this.context.addMessage('system', `POLICY DENIED: ${preCheck.reason}. Find a different way.`);
                continue;
            }
            // === 正式治理 (WASM + 人工/自动) ===
            const decision = await governance_1.GovernanceService.adjudicate(action);
            if (decision.status === 'rejected') {
                console.log(chalk_1.default.red(`[GOVERNANCE] ❌ Rejected: ${decision.reason}`));
                this.context.addMessage('system', `Rejected by Governance: ${decision.reason}`);
                continue;
            }
            // === 执行 ===
            console.log(chalk_1.default.yellow(`[EXECUTING] ⚙️ ${action.type}...`));
            const result = await executor_1.ToolExecutor.execute(action);
            if (result.success) {
                this.context.addToolResult(action.type, result.output);
                console.log(chalk_1.default.green(`[SUCCESS] Result: ${result.output.substring(0, 50)}...`));
            }
            else {
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