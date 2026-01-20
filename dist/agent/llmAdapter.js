"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const validation_1 = require("../core/validation");
const chalk_1 = __importDefault(require("chalk"));
class LLMAdapter {
    static async think(messages, model, onChunk, customSystemPrompt) {
        const systemPrompt = customSystemPrompt || `You are a Governed AI. Output JSON format: 
        { "action_type": "...", "payload": {...}, "reasoning": "...", "is_done": false }`;
        const result = await (0, llm_1.runLLM)({
            prompt: { messages: [{ role: 'system', content: systemPrompt }, ...messages] },
            model: model,
            stream: !!onChunk,
            onChunk: onChunk
        });
        return this.parseThought(result.rawText);
    }
    static parseThought(raw) {
        try {
            const jsonStr = (0, validation_1.extractJSON)(raw);
            const parsed = JSON.parse(jsonStr);
            return {
                raw,
                isDone: parsed.is_done || false,
                type: parsed.action_type || 'answer',
                payload: parsed.payload || {},
                reasoning: parsed.reasoning || '',
                parsedPlan: parsed
            };
        }
        catch (e) {
            console.warn(chalk_1.default.yellow(`[Adapter] JSON 解析失败，正在反馈给 AI 修正...`));
            // 返回一个带有错误的“伪思想”，让 Runtime 引导 AI 修正
            return {
                raw, isDone: false, type: 'answer',
                reasoning: `My last output was not valid JSON: ${e.message}. I will fix the format.`,
                payload: {}, parsedPlan: null
            };
        }
    }
}
exports.LLMAdapter = LLMAdapter;
//# sourceMappingURL=llmAdapter.js.map