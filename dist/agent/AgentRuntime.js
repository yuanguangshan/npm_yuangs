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
const llm_1 = require("./llm");
const governance_1 = require("./governance");
const executor_1 = require("./executor");
const smartContextManager_1 = require("./smartContextManager");
const core_1 = require("./governance/core");
const errorTracker_1 = require("./errorTracker");
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
        let shouldComplete = false; // 标记是否应该完成
        let lastToolCall = null; // 跟踪上次工具调用及重复次数
        // 构建初始动态上下文
        const initialDynamicContext = await (0, dynamicPrompt_1.buildDynamicContext)();
        if (userInput) {
            this.context.addMessage("user", userInput);
        }
        while (turnCount < maxTurns) {
            // 检查是否应该完成（上一轮只读工具成功）
            if (shouldComplete) {
                console.log(chalk_1.default.gray('[Task Complete] 任务已完成'));
                break;
            }
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
            let thought;
            try {
                thought = await llmAdapter_1.LLMAdapter.think(messages, mode, agentOnChunk, model, enhancedPrompt, this.context);
                if (!thought.raw || thought.raw.trim() === '') {
                    console.log(chalk_1.default.red('\n⚠️ AI 返回了空响应，请检查网络连接或模型配置。'));
                    break;
                }
            }
            catch (error) {
                let errorMessage = '未知内部错误';
                let statusCode = 0;
                if (error instanceof llm_1.AIError) {
                    errorMessage = error.message;
                    statusCode = error.statusCode;
                }
                else if (error instanceof Error) {
                    errorMessage = error.message;
                    statusCode = error.statusCode || 0;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                const statusInfo = statusCode ? ` (状态码: ${statusCode})` : '';
                console.log(chalk_1.default.red(`\n❌ AI 思考过程发生错误: ${errorMessage}${statusInfo}`));
                this.context.addMessage("system", `思考过程中发生错误${statusInfo}: ${errorMessage}`);
                if (statusCode === 401 || statusCode === 403 || errorMessage.includes('401') || errorMessage.includes('403')) {
                    console.log(chalk_1.default.yellow('💡 检测到权限或授权错误，请检查 API 配置。'));
                    break;
                }
                if (statusCode === 429) {
                    console.log(chalk_1.default.yellow('💡 API 调用频率过高，请稍后再试。'));
                }
                break;
            }
            try {
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
                    // ... rest of the logic
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
                // === 执行前错误检查 ===
                // 检查是否应该阻止执行（防止重复错误）
                if (action.type === 'tool_call') {
                    const toolName = action.payload.tool_name;
                    const blockCheck = errorTracker_1.ErrorTracker.shouldBlockExecution(toolName, action.payload.parameters);
                    if (blockCheck.blocked) {
                        console.log(chalk_1.default.red(`[BLOCKED] 🚫 ${blockCheck.reason}`));
                        // 显示错误历史
                        if (blockCheck.existingError) {
                            console.log(chalk_1.default.yellow(`[Error History] 此错误已发生 ${blockCheck.existingError.attemptCount} 次`));
                            console.log(chalk_1.default.gray(`上次错误: ${blockCheck.existingError.errorMessage}`));
                        }
                        this.context.addMessage("system", `BLOCKED: ${blockCheck.reason}. 建议尝试不同的方法。`);
                        continue;
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
                    // 通用重复检测：所有工具
                    const currentToolCall = { tool: action.payload.tool_name || action.type, params: action.payload.parameters || action.payload };
                    // 检查是否重复，并允许一定次数的重复（给 AI 时间完成多步骤任务）
                    let duplicateCount = 0;
                    const isDuplicate = lastToolCall &&
                        lastToolCall.tool === currentToolCall.tool &&
                        JSON.stringify(lastToolCall.params) === JSON.stringify(currentToolCall.params);
                    if (isDuplicate) {
                        duplicateCount = lastToolCall.count || 0;
                        // 允许最多 2 次重复调用（给 AI 时间完成任务）
                        if (duplicateCount >= 2) {
                            console.log(chalk_1.default.yellow('[Duplicate Detection] 达到重复限制，强制完成'));
                            console.log(chalk_1.default.cyan(`\n✓ ${action.payload.tool_name || action.type} 已完成\n`));
                            if (agentRenderer) {
                                agentRenderer.buffer = '';
                                agentRenderer.quietMode = true;
                                agentRenderer.finish();
                            }
                            break;
                        }
                        else {
                            console.log(chalk_1.default.gray(`[Repeat Detection] 重复调用 (${duplicateCount + 1}/2)，继续...`));
                        }
                    }
                    // 更新上次工具调用记录（包含计数）
                    if (isDuplicate && lastToolCall) {
                        lastToolCall.count = duplicateCount + 1;
                    }
                    else {
                        lastToolCall = { ...currentToolCall, count: 0 };
                    }
                    // 智能完成：根据工具类型和用户意图决定是否自动完成
                    if (action.type === 'tool_call') {
                        const toolName = action.payload.tool_name;
                        // 写入文件成功后自动完成
                        if (toolName === 'write_file') {
                            console.log(chalk_1.default.gray('[Auto-Complete] 文件写入成功，自动完成任务'));
                            console.log(chalk_1.default.green(`✓ 已创建文件: ${action.payload.parameters.path}\n`));
                            this.context.addMessage("assistant", `已成功创建文件 ${action.payload.parameters.path}`);
                            if (agentRenderer) {
                                agentRenderer.buffer = '';
                                agentRenderer.quietMode = true;
                                agentRenderer.finish();
                            }
                            break;
                        }
                        // 只读工具处理
                        const readOnlyTools = ['read_file', 'list_files', 'read_file_lines', 'read_file_lines_from_end', 'file_info', 'git_status', 'git_log', 'git_diff', 'list_directory_tree', 'search_in_files', 'search_symbol', 'continue_reading', 'analyze_dependencies'];
                        if (readOnlyTools.includes(toolName)) {
                            // 检测用户意图：如果要求"分析"、"解释"等，则不自动完成
                            // 使用更精确的匹配，避免文件名中的关键词（如 git_reviews.md 中的 review）误触发
                            const requiresAnalysis = /^(.*?)(帮我|请)?(分析|解释|说明|总结)|\b(review|explain)\s+(this|the|it)\b/i.test(userInput);
                            if (!requiresAnalysis) {
                                // 简单读取请求，直接返回结果
                                console.log(chalk_1.default.gray('[Auto-Complete] 只读工具执行成功，自动完成任务'));
                                console.log(chalk_1.default.cyan(`\n📄 ${toolName} 结果：\n`));
                                console.log(result.output);
                                this.context.addMessage("assistant", `已成功执行 ${toolName}，结果：\n${result.output}`);
                                if (agentRenderer) {
                                    agentRenderer.buffer = '';
                                    agentRenderer.quietMode = true;
                                    agentRenderer.finish();
                                }
                                break;
                            }
                            else {
                                // 分析请求，继续循环让 AI 分析内容
                                console.log(chalk_1.default.gray('[Analysis Mode] 文件已读取，继续分析...'));
                            }
                        }
                    }
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
                    // 失败时记录错误，尝试自动修复
                    lastError = result.error;
                    this.context.addToolResult(action.type, `Error: ${result.error}`);
                    console.log(chalk_1.default.red(`[ERROR] ${result.error}`));
                    // 记录到错误追踪器
                    if (action.type === 'tool_call') {
                        errorTracker_1.ErrorTracker.recordError(action.payload.tool_name, action.payload.parameters, result.error || 'Unknown error', { mode, model: thought.modelName, userInput });
                    }
                    else if (action.type === 'shell_cmd') {
                        errorTracker_1.ErrorTracker.recordError('shell_cmd', { command: action.payload.command }, result.error || 'Unknown error', { mode, model: thought.modelName, userInput });
                    }
                    // 尝试自动修复（仅针对 shell_cmd 失败）
                    if (action.type === 'shell_cmd' && result.error) {
                        console.log(chalk_1.default.yellow('[AutoFix] 尝试自动修复命令...'));
                        try {
                            const { autoFixCommand } = await Promise.resolve().then(() => __importStar(require('../core/autofix')));
                            const { getOSProfile } = await Promise.resolve().then(() => __importStar(require('../core/os')));
                            const os = getOSProfile();
                            const fixPlan = await autoFixCommand(action.payload.command, result.error || result.output || '', os, thought.modelName);
                            if (fixPlan && fixPlan.command) {
                                console.log(chalk_1.default.cyan(`[AutoFix] 建议修复命令: ${fixPlan.command}`));
                                console.log(chalk_1.default.gray(`[AutoFix] 说明: ${fixPlan.plan || '无'}`));
                                // 将修复建议添加到上下文
                                this.context.addMessage('system', `自动修复建议：${fixPlan.command}\n原因：${fixPlan.plan || '无'}`);
                                // 如果修复方案风险低，直接执行
                                if (fixPlan.risk === 'low') {
                                    console.log(chalk_1.default.yellow('[AutoFix] 修复方案风险低，自动执行...'));
                                    const fixedAction = {
                                        id: (0, crypto_1.randomUUID)(),
                                        type: 'shell_cmd',
                                        payload: { command: fixPlan.command },
                                        riskLevel: 'low',
                                        reasoning: `AutoFix from failed command: ${action.payload.command}`
                                    };
                                    const fixedResult = await executor_1.ToolExecutor.execute(fixedAction);
                                    if (fixedResult.success) {
                                        console.log(chalk_1.default.green('[AutoFix] 修复成功！'));
                                        lastError = undefined;
                                        this.context.addToolResult('shell_cmd', fixedResult.output);
                                        continue;
                                    }
                                    else {
                                        console.log(chalk_1.default.red('[AutoFix] 修复失败，继续原始错误处理'));
                                    }
                                }
                            }
                            else {
                                console.log(chalk_1.default.gray('[AutoFix] 无法生成修复建议'));
                            }
                        }
                        catch (fixError) {
                            console.warn(chalk_1.default.yellow(`[AutoFix] 修复过程出错: ${fixError.message}`));
                        }
                    }
                }
            }
            catch (error) {
                let errorMessage = '未知执行错误';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                console.log(chalk_1.default.red(`\n❌ 任务执行失败 [Action: ${thought?.type}]: ${errorMessage}`));
                this.context.addMessage("system", `执行引擎错误 [Action: ${thought?.type}]: ${errorMessage}`);
                break;
            }
        }
        if (turnCount >= maxTurns) {
            console.log(chalk_1.default.red(`\n⚠️ Max turns (${maxTurns}) reached.`));
        }
    }
}
exports.AgentRuntime = AgentRuntime;
//# sourceMappingURL=AgentRuntime.js.map