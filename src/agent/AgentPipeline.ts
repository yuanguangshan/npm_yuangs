import {
    AgentInput,
    AgentMode,
} from './types';

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
import { StreamMarkdownRenderer } from '../utils/renderer'; // Import renderer
import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class AgentPipeline {
    private contextBuffer: ContextBuffer = new ContextBuffer();

    async run(input: AgentInput, mode: AgentMode): Promise<void> {
        const id = randomUUID();

        // 1. Intent Analysis
        const intent = inferIntent(input, mode);

        // 2. Context Assembly
        const context = buildContext(input, this.contextBuffer);

        // 3. Prompt Construction
        const prompt = buildPrompt(intent, context, mode, input.rawInput);

        // 4. Model Selection
        const model = selectModel(intent, input.options?.model);

        // Setup Renderer if in Chat Mode
        let renderer: StreamMarkdownRenderer | undefined;
        let spinner: Ora | undefined;

        if (mode === 'chat') {
            spinner = ora(chalk.cyan('Thinking...')).start();
            renderer = new StreamMarkdownRenderer(chalk.bold.blue('🤖 AI: '), spinner);
        }

        // 5. LLM Execution
        const result = await runLLM({
            prompt,
            model,
            stream: mode === 'chat',
            onChunk: mode === 'chat' && renderer
                ? (s) => renderer!.onChunk(s)
                : undefined,
        });

        // Finish rendering if chat mode
        if (mode === 'chat' && renderer) {
            renderer.finish();
        }

        // 6. Result Interpretation -> Plan
        const isStreaming = mode === 'chat';
        const plan = interpretResultToPlan(result, intent, mode, isStreaming);
        result.plan = plan; // Attach plan to result for recording

        // 7. Save Execution Record (before execution for safety)
        saveRecord({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText }, 
        });

        // 8. Plan Execution
        // Note: For chat, execution usually is just "printing", which happened via stream.
        // interpretResultToPlan handles ignoring tasks if streamed.
        const summary = await executePlan(plan, input.options);

        // 9. Post-execution: Learn Skill if successful
        learnSkillFromRecord({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText },
        }, summary.success);

        // Log execution metrics if verbose
        if (input.options?.verbose) {
            console.log(`\n${'-'.repeat(50)}`);
            console.log(`Execution ID: ${id}`);
            console.log(`Model: ${model}`);
            console.log(`Latency: ${result.latencyMs}ms`);
            if (result.tokens) {
                console.log(`Tokens: ${result.tokens.total}`);
            }
            console.log(`${'-'.repeat(50)}\n`);
        }
    }
}
