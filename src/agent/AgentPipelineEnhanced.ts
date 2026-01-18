import { AgentInput, AgentMode } from './types';
import { ContextBuffer } from '../commands/contextBuffer';
import { inferIntent } from './intent';
import { buildContext } from './context';
import { buildPrompt } from './prompt';
import { selectModel } from './selectModel';
import { runLLM } from './llm';
import { interpretResultToPlan } from './interpret';
import { executePlan } from './planExecutor';
import { saveRecord } from './record';
import { learnSkillFromRecord } from './skills';
import { randomUUID } from 'crypto';
import { StreamMarkdownRenderer } from '../utils/renderer';
import ora, { Ora } from 'ora';
import chalk from 'chalk';

import { DefaultTokenPolicy } from '../policy/token/DefaultTokenPolicy';
import { ModelRegistry } from '../policy/model/ModelRegistry';
import { SyntaxHandler } from '../policy/syntaxHandler';
import { PolicyPresenter } from '../ui/PolicyPresenter';
import { UserDecision } from '../policy/token/types';
import { ContextSampler } from '../policy/sampler';

const MAX_PIPELINE_ITERATIONS = 3;

export class AgentPipeline {
    private contextBuffer: ContextBuffer = new ContextBuffer();
    private modelRegistry: ModelRegistry;
    private policy: DefaultTokenPolicy;

    constructor(modelRegistry?: ModelRegistry) {
        this.modelRegistry = modelRegistry || new ModelRegistry([]);
        this.policy = new DefaultTokenPolicy();
    }

    async run(input: AgentInput, mode: AgentMode): Promise<void> {
        const id = randomUUID();

        try {
            await this.runWithTokenPolicy(input, mode, id);
        } catch (error: any) {
            if (error.name === 'MaxIterationsExceeded') {
                console.log(chalk.yellow('\n⚠️  已达到最大迭代次数，操作终止'));
            } else {
                console.log(chalk.red(`\n❌ Pipeline 错误: ${error.message}`));
            }
        }

        PolicyPresenter.clearSuppressCache();
    }

    /**
     * 执行带 TokenPolicy 的 pipeline
     */
    private async runWithTokenPolicy(
        input: AgentInput,
        mode: AgentMode,
        executionId: string
    ): Promise<void> {
        // 1. 意图解析 (Syntax Phase)
        const tokens = this.extractContextTokens(input.rawInput);
        let pendingItems = SyntaxHandler.parse(tokens);

        // 2. 治理审计循环 (Governance Loop)
        // 最多重试 3 次（包括初始评估）以防止无限循环
        const MAX_ITERATIONS = 3;
        let passed = false;
        let iterations = 0;
        let currentModel = this.modelRegistry.get(
            input.options?.model || 'gemini-2.5-flash-lite'
        ) || this.modelRegistry.getDefault();

        while (!passed && iterations < MAX_ITERATIONS) {
            iterations++;

            const result = await this.policy.evaluate({
                model: currentModel,
                contextItems: pendingItems,
                mode: this.determineMode(mode),
                userIntent: input.rawInput
            });

            passed = await this.handlePolicyResult(
                result,
                pendingItems,
                currentModel,
                iterations
            );

            if (passed) break;
        }

        if (!passed) {
            throw new Error('MaxIterationsExceeded');
        }

        // 3. 授权执行 (Execution Phase)
        const resolved = await Promise.all(pendingItems.map(item => item.resolve()));

        resolved.forEach(r => {
            this.contextBuffer.add(
                {
                    type: 'file',
                    path: pendingItems.find((p: any) => p.id.includes(r.content.substring(0, 20)))?.id || 'unknown',
                    content: r.content
                },
                true // bypassTokenLimit = true (已通过 policy 审计）
            );
        });

        // 4. 正常 LLM Pipeline
        await this.executeLLMPipeline(input, mode, currentModel, executionId);
    }

    /**
     * 处理 Policy 结果
     */
    private async handlePolicyResult(
        result: any,
        pendingItems: any[],
        currentModel: any,
        iteration: number
    ): Promise<boolean> {
        if (result.status === 'ok') {
            return true; // passed
        }

        if (result.status === 'block') {
            await PolicyPresenter.presentBlock(result);
            return false;
        }

        if (result.status === 'warn') {
            const decision = await PolicyPresenter.presentWarning(
                result,
                `${currentModel.name}:${pendingItems.map(p => p.id).join(',')}`
            );

            return this.applyDecision(decision, pendingItems, currentModel);
        }

        return false;
    }

    /**
     * 应用用户决策
     */
    private async applyDecision(
        decision: UserDecision,
        pendingItems: any[],
        currentModel: any
    ): Promise<boolean> {
        switch (decision.type) {
            case 'continue':
                return true;

            case 'abort':
                return false;

            case 'switch_model':
                if (decision.targetModel) {
                    const newModel = this.modelRegistry.get(decision.targetModel);
                    if (newModel) {
                        console.log(chalk.green(`\n🔄 切换至模型: ${decision.targetModel}`));
                        currentModel = newModel;
                        return false; // 需要重新评估
                    }
                }
                console.log(chalk.yellow(`⚠️  模型 ${decision.targetModel} 未找到`));
                return false;

            case 'sample':
                if (decision.strategy === 'head_tail') {
                    console.log(chalk.cyan('\n✂ 应用 head_tail 采样...'));
                    pendingItems = await Promise.all(
                        pendingItems.map(item =>
                            ContextSampler.applySampling(item, 'head_tail')
                        )
                    );
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
    private async executeLLMPipeline(
        input: AgentInput,
        mode: AgentMode,
        model: any,
        executionId: string
    ): Promise<void> {
        const intent = inferIntent(input, mode);
        const context = buildContext(input, this.contextBuffer);
        const prompt = buildPrompt(intent, context, mode, input.rawInput);

        let renderer: StreamMarkdownRenderer | undefined;
        let spinner: Ora | undefined;

        if (mode === 'chat') {
            spinner = ora(chalk.cyan('Thinking...')).start();
            renderer = new StreamMarkdownRenderer(chalk.bold.blue('🤖 AI: '), spinner);
        }

        const result = await runLLM({
            prompt,
            model: model.name,
            stream: mode === 'chat',
            onChunk: mode === 'chat' && renderer
                ? (s) => renderer!.onChunk(s)
                : undefined,
        });

        if (mode === 'chat' && renderer) {
            renderer.finish();
        }

        const isStreaming = mode === 'chat';
        const plan = interpretResultToPlan(result, intent, mode, isStreaming);
        result.plan = plan;

        saveRecord({
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

        const summary = await executePlan(plan, input.options);

        learnSkillFromRecord({
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
    private extractContextTokens(rawInput: string): string[] {
        return rawInput
            .split(' ')
            .filter(token => token.startsWith('@') || token.startsWith('#'));
    }

    /**
     * 确定 mode
     */
    private determineMode(mode: AgentMode): "command" | "pipe" | "agent" {
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
