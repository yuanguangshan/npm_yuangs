"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const client_1 = require("../ai/client");
const json5_1 = __importDefault(require("json5"));
class LLMAdapter {
    static async think(messages, mode = 'chat', onChunk, model, customSystemPrompt) {
        // SYSTEM PROTOCOL V2.2 - CoT (Chain of Thought) 显式分离
        let protocol = `[SYSTEM PROTOCOL V2.2]
- ROLE: AUTOMATED EXECUTION AGENT
- MODE: REACT (THINK -> ACTION -> PERCEIVE)
- OUTPUT: CoT Block + JSON Block

# EXECUTION PROTOCOL
1. **THINK**: First, analyze the user's request, the current context, and previous history. Plan your next step.
2. **ACT**: Generate a structured JSON action.
3. **OBSERVE**: Wait for the tool output.

# OUTPUT FORMAT
You must output a "Thought Block" followed by a "JSON Action Block".

[THOUGHT]
Explain your reasoning here. 
- Why are you choosing this tool? 
- If the previous step failed, how are you fixing it?
- If using a file, mention lines you are interested in.
[/THOUGHT]

\`\`\`json
{
  "action_type": "tool_call" | "shell_cmd" | "answer",
  "tool_name": "...", 
  "parameters": { ... },
  "command": "...",
  "risk_level": "low" | "medium" | "high",
  "risk_explanation": "Required if risk is medium/high"
}
\`\`\`

# GUIDELINES
- **Silence**: Do not output conversational filler outside the [THOUGHT] block.
- **Safety**: If you must run a destructive command (rm, dd), set risk_level to "high".
- **Context**: You have access to files in context.
- **Formatting**: When answering (action_type="answer"), use standard Markdown.

Example Task: "count files in /tmp"

[THOUGHT]
User wants to count files in /tmp directory. I'll use ls to list files and pipe to wc -l to count them. This is a safe operation with low risk.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "ls /tmp | wc -l",
  "risk_level": "low"
}
\`\`\``;
        if (mode === 'command' || mode === 'command+exec') {
            protocol += `\n\nCOMMAND MODE ACTIVE:
- Prioritize "shell_cmd" for any terminal-based task.
- Minimize "answer" type unless the task is purely conversational.
- Direct execution is expected.`;
        }
        const prompt = {
            system: customSystemPrompt ? `${protocol}\n\nGOVERNANCE POLICY:\n${customSystemPrompt}` : protocol,
            messages,
        };
        const config = (0, client_1.getUserConfig)();
        const finalModel = model || config.defaultModel || 'Assistant';
        const result = await (0, llm_1.runLLM)({
            prompt,
            model: finalModel,
            stream: !!onChunk,
            onChunk
        });
        return this.parseThought(result.rawText);
    }
    static parseThought(raw) {
        try {
            // CoT V2.2: 分别提取 [THOUGHT] 块和 JSON 块
            const thoughtMatch = raw.match(/\[THOUGHT\]([\s\S]*?)\[\/THOUGHT\]/);
            const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/) || raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = json5_1.default.parse(jsonMatch[1] || jsonMatch[0]);
                // 从 THOUGHT 块提取思考内容
                const thoughtContent = thoughtMatch ? thoughtMatch[1].trim() : '';
                // 如果明确标记为 done，或者动作为 answer，则视为任务结束
                if (parsed.is_done === true || parsed.action_type === 'answer') {
                    return {
                        raw,
                        parsedPlan: parsed,
                        isDone: true,
                        type: 'answer',
                        payload: {
                            content: parsed.final_answer || parsed.content || parsed.text || raw
                        },
                        reasoning: thoughtContent
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
                        content: parsed.content || parsed.text || '',
                        risk_level: parsed.risk_level || 'low',
                        risk_explanation: parsed.risk_explanation || ''
                    },
                    reasoning: thoughtContent // 从 THOUGHT 块提取
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