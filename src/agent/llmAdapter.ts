import { AgentThought } from './state';
import { runLLM } from './llm';
import { AgentPrompt } from './types';
import type { AIRequestMessage } from '../core/validation';
import { getUserConfig } from '../ai/client';

export class LLMAdapter {
  static async think(
    messages: AIRequestMessage[],
    mode: 'chat' | 'command' | 'command+exec',
    outputSchema?: any
  ): Promise<AgentThought> {
    const prompt: AgentPrompt = {
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
    const config = getUserConfig();
    const model = config.defaultModel || 'gemini-2.5-flash-lite';

    const result = await runLLM({
      prompt,
      model,
      stream: false
    });

    return this.parseThought(result.rawText);
  }

  private static parseThought(raw: string): AgentThought {
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
    } catch (e) {
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
