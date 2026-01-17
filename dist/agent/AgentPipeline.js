"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPipeline = void 0;
const intent_1 = require("./intent");
const context_1 = require("./context");
const prompt_1 = require("./prompt");
const selectModel_1 = require("./selectModel");
const llm_1 = require("./llm");
const interpret_1 = require("./interpret");
const actions_1 = require("./actions");
const record_1 = require("./record");
const crypto_1 = require("crypto");
class AgentPipeline {
    async run(input, mode) {
        const id = (0, crypto_1.randomUUID)();
        // 1. Intent Analysis
        const intent = (0, intent_1.inferIntent)(input, mode);
        // 2. Context Assembly
        const context = (0, context_1.buildContext)(input);
        // 3. Prompt Construction
        const prompt = (0, prompt_1.buildPrompt)(intent, context, mode, input.rawInput);
        // 4. Model Selection
        const model = (0, selectModel_1.selectModel)(intent, input.options?.model);
        // 5. LLM Execution
        const result = await (0, llm_1.runLLM)({
            prompt,
            model,
            stream: mode === 'chat',
            onChunk: mode === 'chat'
                ? (s) => process.stdout.write(s)
                : undefined,
        });
        // 6. Result Interpretation
        const action = (0, interpret_1.interpretResult)(result, intent, mode);
        // 7. Save Execution Record (before execution for safety)
        (0, record_1.saveRecord)({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action,
        });
        // 8. Action Execution
        await (0, actions_1.executeAction)(action, input.options);
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
exports.AgentPipeline = AgentPipeline;
//# sourceMappingURL=AgentPipeline.js.map