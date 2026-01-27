"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
const marked = __importStar(require("marked"));
const marked_terminal_1 = __importDefault(require("marked-terminal"));
// Configure marked with TerminalRenderer
const terminalRenderer = new marked_terminal_1.default();
marked.setOptions({ renderer: terminalRenderer });
const llmAdapter_1 = require("./llmAdapter");
const governance_1 = require("./governance");
const executor_1 = require("./executor");
const smartContextManager_1 = require("./smartContextManager");
const core_1 = require("./governance/core");
const dynamicPrompt_1 = require("./dynamicPrompt");
const renderer_1 = require("../utils/renderer");
class AgentRuntime {
    context;
    executionId;
    constructor(initialContext) {
        this.context = new smartContextManager_1.SmartContextManager(initialContext);
        this.executionId = (0, crypto_1.randomUUID)();
    }
    async run(userInput, mode = "chat", onChunk, model, renderer) {
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
            // Use smart context manager to get relevance-ranked context
            const enhancedContext = await this.context.getEnhancedContext({
                query: userInput,
                minRelevance: 0.3,
                maxTokens: 8000,
                enableSmartSummary: true
            });
            const messages = [];
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
            const dynamicContext = await (0, dynamicPrompt_1.buildDynamicContext)(lastError);
            // 构建基础prompt（包括治理策略）
            const basePrompt = governance_1.GovernanceService.getPolicyManual();
            // 注入动态上下文
            const enhancedPrompt = (0, dynamicPrompt_1.injectDynamicContext)(basePrompt, dynamicContext);
            // Create renderer if not provided but onChunk is available
            let agentRenderer = renderer;
            let agentOnChunk = onChunk;
            if (!agentRenderer && agentOnChunk) {
                agentRenderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bgHex('#3b82f6').white.bold(' 🤖 Agent ') + ' ', undefined, { autoFinish: false });
                agentOnChunk = agentRenderer.startChunking();
            }
            const thought = await llmAdapter_1.LLMAdapter.think(messages, mode, agentOnChunk, model, enhancedPrompt, this.context);
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
            if (thought.usedRouter) {
                console.log(chalk_1.default.gray(`[Router] 🤖 Model: ${thought.modelName}`));
            }
            // 如果 LLM 认为已经完成或者当前的动作就是回答
            if (thought.isDone || action.type === "answer") {
                const result = await executor_1.ToolExecutor.execute(action);
                // 如果没有 renderer，使用内部创建的
                if (!renderer && agentRenderer) {
                    // Stream final answer through internal renderer
                    for (let i = 0; i < result.output.length; i += 10) {
                        const chunk = result.output.slice(i, i + 10);
                        agentRenderer.onChunk(chunk);
                    }
                    agentRenderer.finish();
                }
                else if (!renderer) {
                    // Fallback to marked if no renderer
                    const rendered = marked.parse(result.output);
                    console.log(chalk_1.default.green(`\n🤖 AI：\n`) + rendered);
                }
                // 如果外部传入了 renderer，由外部调用 finish()
                this.context.addMessage("assistant", result.output);
                // Learn from successful chat
                try {
                    const { createExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionRecord')));
                    const { inferCapabilityRequirement } = await Promise.resolve().then(() => __importStar(require('../core/capabilityInference')));
                    const { saveExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionStore')));
                    const record = createExecutionRecord('agent-chat', { required: [], preferred: [] }, {
                        aiProxyUrl: { value: '', source: 'built-in' },
                        defaultModel: { value: '', source: 'built-in' },
                        accountType: { value: 'free', source: 'built-in' }
                    }, { selected: null, candidates: [], fallbackOccurred: false }, { success: true }, undefined, userInput, 'chat');
                    record.llmResult = { plan: thought.parsedPlan };
                    record.input = { rawInput: userInput };
                    const savedRecordId = saveExecutionRecord(record);
                    const { loadExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionStore')));
                    const savedRecord = loadExecutionRecord(savedRecordId);
                    if (savedRecord) {
                        const { learnSkillFromRecord } = await Promise.resolve().then(() => __importStar(require('./skills')));
                        learnSkillFromRecord(savedRecord, true);
                    }
                }
                catch (error) {
                    console.warn(chalk_1.default.yellow(`[Skill Learning] Failed: ${error}`));
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
                    console.log(chalk_1.default.red(`[CAUSAL BREAK] ❌ ACK mismatch!`));
                    console.log(chalk_1.default.red(`  Expected: ${actualContent.substring(0, 100)}...`));
                    console.log(chalk_1.default.red(`  Received: ${ackedContent.substring(0, 100)}...`));
                    this.context.addMessage("system", `CAUSAL BREAK: ACK does not match physical Observation. Cannot proceed without acknowledging reality.`);
                    continue;
                }
                console.log(chalk_1.default.green(`[CAUSAL LOCK] ✅ ACK verified`));
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
            // === 记录因果边到 KG ===
            if (lastObs && lastObs.metadata?.obsId && ackText && ackText !== 'NONE') {
                try {
                    const { recordEdge } = await Promise.resolve().then(() => __importStar(require('../engine/agent/knowledgeGraph')));
                    recordEdge({
                        from: lastObs.metadata.obsId,
                        to: action.id,
                        type: 'ACKNOWLEDGED_BY',
                        metadata: {
                            verified: true,
                            timestamp: Date.now()
                        }
                    });
                    console.log(chalk_1.default.gray(`[KG] ⚓ Causal edge recorded`));
                }
                catch (error) {
                    console.warn(chalk_1.default.yellow(`[KG] Warning: Failed to record causal edge: ${error.message}`));
                }
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
                // Learn from this successful execution
                try {
                    const { createExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionRecord')));
                    const { inferCapabilityRequirement } = await Promise.resolve().then(() => __importStar(require('../core/capabilityInference')));
                    const { saveExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionStore')));
                    const record = createExecutionRecord(`agent-${mode}`, { required: [], preferred: [] }, {
                        aiProxyUrl: { value: '', source: 'built-in' },
                        defaultModel: { value: '', source: 'built-in' },
                        accountType: { value: 'free', source: 'built-in' }
                    }, { selected: null, candidates: [], fallbackOccurred: false }, { success: true }, undefined, userInput, mode);
                    // Attach thought/plan data for skill learning
                    record.llmResult = { plan: thought.parsedPlan };
                    record.input = { rawInput: userInput };
                    const savedRecordId = saveExecutionRecord(record);
                    const { loadExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionStore')));
                    const savedRecord = loadExecutionRecord(savedRecordId);
                    if (savedRecord) {
                        const { learnSkillFromRecord } = await Promise.resolve().then(() => __importStar(require('./skills')));
                        learnSkillFromRecord(savedRecord, true);
                    }
                }
                catch (error) {
                    console.warn(chalk_1.default.yellow(`[Skill Learning] Failed: ${error}`));
                }
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