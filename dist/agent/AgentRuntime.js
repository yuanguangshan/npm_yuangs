"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const crypto_1 = require("crypto");
const llmAdapter_1 = require("./llmAdapter");
const governance_1 = require("./governance");
const executor_1 = require("./executor");
const contextManager_1 = require("./contextManager");
const renderer_1 = require("../utils/renderer");
const skills_1 = require("./skills");
const capabilitySystem_1 = require("../core/capabilitySystem");
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
        const rejectionHistory = new Set(); // 记录被拒提案，防止死循环
        while (turnCount < maxTurns) {
            console.log(chalk_1.default.blue(`\n--- Turn ${++turnCount} ---`));
            // 1. 理性建议 (Think) & 模型自动匹配
            // 调用你原有的 capabilitySystem 选模型，确保“不降级”
            const requirement = { required: [mode === 'command' ? 'code' : 'reasoning'], preferred: [] };
            const match = capabilitySystem_1.capabilitySystem.matchCapability(requirement);
            const model = match.selected?.name || 'Assistant';
            // 设置流式渲染器 (保留你的流式输出体验)
            const spinner = (0, ora_1.default)(chalk_1.default.cyan('AI Thinking...')).start();
            const renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bold.blue('🤖 AI: '), spinner);
            const thought = await this.think(this.context.getMessages(), model, (chunk) => renderer.onChunk(chunk) // 实时输出到终端
            );
            renderer.finish();
            if (thought.isDone) {
                console.log(chalk_1.default.green('\n任务完成。'));
                break;
            }
            // 2. 治理评审 (Adjudicate)
            const action = {
                id: (0, crypto_1.randomUUID)(),
                type: thought.type,
                payload: thought.payload,
                riskLevel: governance_1.GovernanceService.evaluateRisk(thought),
                reasoning: thought.reasoning || ''
            };
            // === [Patch 3] 预检 (Pre-flight Check) ===
            const actionFingerprint = JSON.stringify(action.payload);
            if (rejectionHistory.has(actionFingerprint)) {
                console.log(chalk_1.default.red(`[ANTI-LOOP] 拦截重复提案`));
                this.context.addMessage('system', `ERROR: You are repeating a previously denied action. DO NOT try this again. Find a NEW way.`);
                continue;
            }
            const preCheck = (0, core_1.evaluateProposal)(action, governance_1.GovernanceService.getRules(), governance_1.GovernanceService.getLedgerSnapshot());
            if (preCheck.effect === 'deny') {
                console.log(chalk_1.default.red(`[PRE-FLIGHT] 拦截违规提案: ${preCheck.reason}`));
                rejectionHistory.add(actionFingerprint);
                this.context.addMessage('system', `POLICY DENIED: ${preCheck.reason}. Please try a different approach.`);
                continue; // 直接让 AI 重新思考，不惊动用户
            }
            const decision = await governance_1.GovernanceService.adjudicate(action);
            if (decision.status === 'rejected') {
                this.context.addMessage('system', `User rejected action: ${decision.reason}`);
                continue;
            }
            // 3. 能力执行 (Execute)
            const finalAction = decision.status === 'modified' ? decision.modifiedAction : action;
            const result = await executor_1.ToolExecutor.execute(finalAction);
            // 4. 技能学习 (Learn) - 成功则自动入库
            if (result.success) {
                // 构造 Record 传给原有的技能系统
                (0, skills_1.learnSkillFromRecord)({
                    id: this.executionId,
                    llmResult: { plan: { goal: action.reasoning } },
                    input: { rawInput: userInput },
                    mode: 'command+exec'
                }, true);
            }
            // 5. 观察反馈 (Observe)
            const output = result.success ? (result.output || '').substring(0, 2000) : result.error;
            this.context.addToolResult(finalAction.type, output || '');
        }
    }
    async think(messages, model, onChunk) {
        const laws = governance_1.GovernanceService.getPolicyManual();
        const systemPrompt = `You are a Governed AI. 
CURRENT LAWS:
${laws}

Always check if your plan violates these laws before proposing. 
If a law requires human approval, explain to the user why it's necessary.
Output JSON format: { "action_type": "...", "payload": {...}, "reasoning": "...", "is_done": false }`;
        return await llmAdapter_1.LLMAdapter.think(messages, model, onChunk, systemPrompt);
    }
}
exports.AgentRuntime = AgentRuntime;
//# sourceMappingURL=AgentRuntime.js.map