"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPipeline = void 0;
const contextBuffer_1 = require("../commands/contextBuffer");
const intent_1 = require("./intent");
const context_1 = require("./context");
const prompt_1 = require("./prompt");
const llm_1 = require("./llm");
const interpret_1 = require("./interpret");
const planExecutor_1 = require("./planExecutor");
const record_1 = require("./record");
const skills_1 = require("./skills");
const crypto_1 = require("crypto");
const renderer_1 = require("../utils/renderer");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const DefaultTokenPolicy_1 = require("../policy/token/DefaultTokenPolicy");
const ModelRegistry_1 = require("../policy/model/ModelRegistry");
const syntaxHandler_1 = require("../policy/syntaxHandler");
const PolicyPresenter_1 = require("../ui/PolicyPresenter");
const sampler_1 = require("../policy/sampler");
const MAX_PIPELINE_ITERATIONS = 3;
class AgentPipeline {
    contextBuffer = new contextBuffer_1.ContextBuffer();
    modelRegistry;
    policy;
    constructor(modelRegistry) {
        this.modelRegistry = modelRegistry || new ModelRegistry_1.ModelRegistry([]);
        this.policy = new DefaultTokenPolicy_1.DefaultTokenPolicy();
    }
    async run(input, mode) {
        const id = (0, crypto_1.randomUUID)();
        try {
            await this.runWithTokenPolicy(input, mode, id);
        }
        catch (error) {
            if (error.name === 'MaxIterationsExceeded') {
                console.log(chalk_1.default.yellow('\n⚠️  已达到最大迭代次数，操作终止'));
            }
            else {
                console.log(chalk_1.default.red(`\n❌ Pipeline 错误: ${error.message}`));
            }
        }
        PolicyPresenter_1.PolicyPresenter.clearSuppressCache();
    }
    /**
     * 执行带 TokenPolicy 的 pipeline
     */
    async runWithTokenPolicy(input, mode, executionId) {
        // 1. 意图解析 (Syntax Phase)
        const tokens = this.extractContextTokens(input.rawInput);
        let pendingItems = syntaxHandler_1.SyntaxHandler.parse(tokens);
        // 2. 治理审计循环 (Governance Loop)
        // 最多重试 3 次（包括初始评估）以防止无限循环
        const MAX_ITERATIONS = 3;
        let passed = false;
        let iterations = 0;
        let currentModel = this.modelRegistry.get(input.options?.model || 'gemini-2.5-flash-lite') || this.modelRegistry.getDefault();
        while (!passed && iterations < MAX_ITERATIONS) {
            iterations++;
            const result = await this.policy.evaluate({
                model: currentModel,
                contextItems: pendingItems,
                mode: this.determineMode(mode),
                userIntent: input.rawInput
            });
            passed = await this.handlePolicyResult(result, pendingItems, currentModel, iterations);
            if (passed)
                break;
        }
        if (!passed) {
            throw new Error('MaxIterationsExceeded');
        }
        // 3. 授权执行 (Execution Phase)
        const resolved = await Promise.all(pendingItems.map(item => item.resolve()));
        resolved.forEach(r => {
            this.contextBuffer.add({
                type: 'file',
                path: pendingItems.find((p) => p.id.includes(r.content.substring(0, 20)))?.id || 'unknown',
                content: r.content
            }, true // bypassTokenLimit = true (已通过 policy 审计）
            );
        });
        // 4. 正常 LLM Pipeline
        await this.executeLLMPipeline(input, mode, currentModel, executionId);
    }
    /**
     * 处理 Policy 结果
     */
    async handlePolicyResult(result, pendingItems, currentModel, iteration) {
        if (result.status === 'ok') {
            return true; // passed
        }
        if (result.status === 'block') {
            await PolicyPresenter_1.PolicyPresenter.presentBlock(result);
            return false;
        }
        if (result.status === 'warn') {
            const decision = await PolicyPresenter_1.PolicyPresenter.presentWarning(result, `${currentModel.name}:${pendingItems.map(p => p.id).join(',')}`);
            return this.applyDecision(decision, pendingItems, currentModel);
        }
        return false;
    }
    /**
     * 应用用户决策
     */
    async applyDecision(decision, pendingItems, currentModel) {
        switch (decision.type) {
            case 'continue':
                return true;
            case 'abort':
                return false;
            case 'switch_model':
                if (decision.targetModel) {
                    const newModel = this.modelRegistry.get(decision.targetModel);
                    if (newModel) {
                        console.log(chalk_1.default.green(`\n🔄 切换至模型: ${decision.targetModel}`));
                        currentModel = newModel;
                        return false; // 需要重新评估
                    }
                }
                console.log(chalk_1.default.yellow(`⚠️  模型 ${decision.targetModel} 未找到`));
                return false;
            case 'sample':
                if (decision.strategy === 'head_tail') {
                    console.log(chalk_1.default.cyan('\n✂ 应用 head_tail 采样...'));
                    pendingItems = await Promise.all(pendingItems.map(item => sampler_1.ContextSampler.applySampling(item, 'head_tail')));
                    return false; // 需要重新评估
                }
                return true;
            default:
                return true;
        }
    }
    /**
     * 执行 LLM Pipeline（原有的流程）
     */
    async executeLLMPipeline(input, mode, model, executionId) {
        const intent = (0, intent_1.inferIntent)(input, mode);
        const context = (0, context_1.buildContext)(input, this.contextBuffer);
        const prompt = (0, prompt_1.buildPrompt)(intent, context, mode, input.rawInput);
        let renderer;
        let spinner;
        if (mode === 'chat') {
            spinner = (0, ora_1.default)(chalk_1.default.cyan('Thinking...')).start();
            renderer = new renderer_1.StreamMarkdownRenderer(chalk_1.default.bold.blue('🤖 AI: '), spinner);
        }
        const result = await (0, llm_1.runLLM)({
            prompt,
            model: model.name,
            stream: mode === 'chat',
            onChunk: mode === 'chat' && renderer
                ? (s) => renderer.onChunk(s)
                : undefined,
        });
        if (mode === 'chat' && renderer) {
            renderer.finish();
        }
        const isStreaming = mode === 'chat';
        const plan = (0, interpret_1.interpretResultToPlan)(result, intent, mode, isStreaming);
        result.plan = plan;
        (0, record_1.saveRecord)({
            id: executionId,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model: model.name,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText },
        });
        const summary = await (0, planExecutor_1.executePlan)(plan, input.options);
        (0, skills_1.learnSkillFromRecord)({
            id: executionId,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model: model.name,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText },
        }, summary.success);
        if (input.options?.verbose) {
            console.log(`\n${'-'.repeat(50)}`);
            console.log(`Execution ID: ${executionId}`);
            console.log(`Model: ${model.name}`);
            console.log(`Latency: ${result.latencyMs}ms`);
            if (result.tokens) {
                console.log(`Tokens: ${result.tokens.total}`);
            }
            console.log(`${'-'.repeat(50)}\n`);
        }
    }
    /**
     * 从输入中提取上下文 tokens (@file, #dir)
     */
    extractContextTokens(rawInput) {
        return rawInput
            .split(' ')
            .filter(token => token.startsWith('@') || token.startsWith('#'));
    }
    /**
     * 确定 mode
     */
    determineMode(mode) {
        // 将 Agent mode 映射到 Policy mode
        // chat → agent, command → command, command+exec → command
        if (mode === 'chat') {
            return 'agent';
        }
        if (mode === 'command+exec') {
            return 'command';
        }
        return mode; // command 默认为 command
    }
}
exports.AgentPipeline = AgentPipeline;
//# sourceMappingURL=AgentPipelineEnhanced.js.map