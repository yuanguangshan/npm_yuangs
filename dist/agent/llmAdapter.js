"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const client_1 = require("../ai/client");
class LLMAdapter {
    static async think(messages, mode = 'chat', onChunk, customSystemPrompt) {
        const prompt = {
            system: customSystemPrompt || `You are yuangs AI Assistant, an autonomous agent operating in a ReAct loop.
      
CRITICAL: NO TALK BEFORE JSON. 
Your response MUST start with the character '{' and end with '}'. 

If you need to perform an action (read, list, count files), use 'shell_cmd' or 'tool_call'.
Only use 'answer' when you have the results.

Action JSON Format:
{
  "action_type": "tool_call" | "shell_cmd" | "answer",
  "reasoning": "Explain WHY you take this action",
  "tool_name": "...",
  "parameters": {},
  "command": "...",
  "content": "..."
}

Remember: Action over words. Just do it.`,
            messages,
        };
        const config = (0, client_1.getUserConfig)();
        const model = config.defaultModel || 'Assistant';
        const result = await (0, llm_1.runLLM)({
            prompt,
            model,
            stream: !!onChunk,
            onChunk
        });
        return this.parseThought(result.rawText);
    }
    static parseThought(raw) {
        try {
            // 提取 JSON：支持 Markdown 块或纯 JSON 字符串
            const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/) || raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                // 如果明确标记为 done，或者动作为 answer，则视为任务结束
                if (parsed.is_done === true || parsed.action_type === 'answer') {
                    return {
                        raw,
                        parsedPlan: parsed,
                        isDone: true,
                        type: 'answer',
                        payload: {
                            content: parsed.final_answer || parsed.content || parsed.text || raw
                        }
                    };
                }
                // 智能推断动作类型：如果 AI 没给 action_type，我们根据字段猜测
                let inferredType = parsed.action_type;
                if (!inferredType) {
                    if (parsed.tool_name || parsed.tool)
                        inferredType = 'tool_call';
                    else if (parsed.command || parsed.cmd)
                        inferredType = 'shell_cmd';
                    else if (parsed.diff || parsed.patch)
                        inferredType = 'code_diff';
                    else
                        inferredType = 'answer';
                }
                return {
                    raw,
                    parsedPlan: parsed,
                    isDone: inferredType === 'answer' || parsed.is_done === true,
                    type: inferredType,
                    payload: {
                        tool_name: parsed.tool_name || parsed.tool || '',
                        parameters: parsed.parameters || parsed.params || {},
                        command: parsed.command || parsed.cmd || '',
                        diff: parsed.diff || parsed.patch || '',
                        content: parsed.content || parsed.text || ''
                    },
                    reasoning: parsed.reasoning || ''
                };
            }
        }
        catch (e) {
            // 解析失败时，回退到将原始内容作为回答
        }
        return {
            raw,
            parsedPlan: {},
            isDone: true,
            type: 'answer',
            payload: { content: raw },
            reasoning: ''
        };
    }
}
exports.LLMAdapter = LLMAdapter;
//# sourceMappingURL=llmAdapter.js.map