"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const client_1 = require("../ai/client");
class LLMAdapter {
    static async think(messages, mode, outputSchema) {
        const prompt = {
            system: `You are yuangs AI Assistant. You are operating in Governance-First ReAct Loop mode.
      
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
            outputSchema
        };
        // Use configured model from user settings
        const config = (0, client_1.getUserConfig)();
        const model = config.defaultModel || 'gemini-2.5-flash-lite';
        const result = await (0, llm_1.runLLM)({
            prompt,
            model,
            stream: false
        });
        return this.parseThought(result.rawText);
    }
    static parseThought(raw) {
        try {
            const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/) || raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                if (parsed.is_done) {
                    return {
                        raw,
                        parsedPlan: parsed,
                        isDone: true,
                        type: 'answer'
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
                        content: parsed.content
                    },
                    reasoning: parsed.reasoning || ''
                };
            }
        }
        catch (e) {
            console.warn('[LLMAdapter] Failed to parse JSON output, using raw text');
        }
        return {
            raw,
            parsedPlan: {},
            isDone: false,
            type: 'answer',
            reasoning: raw
        };
    }
}
exports.LLMAdapter = LLMAdapter;
//# sourceMappingURL=llmAdapter.js.map