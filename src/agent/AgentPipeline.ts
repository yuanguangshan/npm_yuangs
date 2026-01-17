import {
    AgentInput,
    AgentMode,
} from './types';

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

export class AgentPipeline {
    async run(input: AgentInput, mode: AgentMode): Promise<void> {
        const id = randomUUID();

        // 1. Intent Analysis
        const intent = inferIntent(input, mode);

        // 2. Context Assembly
        const context = buildContext(input);

        // 3. Prompt Construction
        const prompt = buildPrompt(intent, context, mode, input.rawInput);

        // 4. Model Selection
        const model = selectModel(intent, input.options?.model);

        // 5. LLM Execution
        const result = await runLLM({
            prompt,
            model,
            stream: mode === 'chat',
            onChunk: mode === 'chat'
                ? (s) => process.stdout.write(s)
                : undefined,
        });

        // 6. Result Interpretation -> Plan
        const plan = interpretResultToPlan(result, intent, mode);
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
            } : { type: 'print', content: result.rawText }, // For backward compatibility with record.action
        });

        // 8. Plan Execution
        await executePlan(plan, input.options);

        // 9. Post-execution: Learn Skill if successful
        // Note: In an MVP, we assume it's successful if executePlan finishes without error
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
        });

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
