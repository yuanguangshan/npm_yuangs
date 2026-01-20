"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const client_1 = require("../ai/client");
class LLMAdapter {
    static async think(messages, mode = 'chat', onChunk, customSystemPrompt) {
        const prompt = {
            system: customSystemPrompt || `You are yuangs AI Assistant. You are operating in Governance-First ReAct Loop mode.
      
Available action types:
- tool_call: Call a tool (read_file, write_file, web_search, shell)
- code_diff: Apply a code diff using unified diff format
- shell_cmd: Execute a shell command
- answer: Provide a final answer without any tool calls

When you need to perform an action, output your plan in this JSON format:
{
  "action_type": "tool_call" | "code_diff" | "shell_cmd" | "answer",
  "tool_name": string,  // for tool_call
  "parameters": object,
  "command": string,    // for shell_cmd
  "diff": string,       // for code_diff
  "content": string,     // for answer
  "reasoning": string    // Explain why you're taking this action
}

If the task is complete and no more actions are needed, output:
{
  "is_done": true,
  "final_answer": string
}`,
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
                return {
                    raw,
                    parsedPlan: parsed,
                    isDone: false,
                    type: parsed.action_type || 'tool_call',
                    payload: {
                        tool_name: parsed.tool_name,
                        parameters: parsed.parameters,
                        command: parsed.command,
                        diff: parsed.diff,
                        content: parsed.content || parsed.text
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
            reasoning: 'Fallback to raw text due to parsing failure'
        };
    }
}
exports.LLMAdapter = LLMAdapter;
//# sourceMappingURL=llmAdapter.js.map