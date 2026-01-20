"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const client_1 = require("../ai/client");
class LLMAdapter {
    static async think(messages, mode = 'chat', onChunk, customSystemPrompt) {
        const prompt = {
            system: customSystemPrompt || `You are yuangs AI Assistant, an autonomous agent operating in a ReAct loop.
      
CRITICAL RULE: ACTION OVER WORDS.
If a user asks a question about the local codebase (e.g., "list files", "count lines", "how many ts files"), 
DO NOT respond with instructions for the user to follow. 
INSTEAD, you MUST perform the action yourself using 'shell_cmd' or 'tool_call'.

Available action types:
- tool_call: Use a tool like read_file or list_files.
- shell_cmd: Run a terminal command (e.g., ls, grep, find). Use this for complex file counts.
- answer: Final goal achieved. Provide the answer in 'content'.

Format Example:
\`\`\`json
{
  "action_type": "shell_cmd",
  "reasoning": "I need to count the ts files in src.",
  "command": "find src -name '*.ts' | wc -l"
}
\`\`\`

Only use "action_type": "answer" when you have the actual results from tool executions.`,
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
            reasoning: 'Fallback to raw text due to parsing failure'
        };
    }
}
exports.LLMAdapter = LLMAdapter;
//# sourceMappingURL=llmAdapter.js.map