import { AgentThought } from './state';
import { runLLM } from './llm';
import { AgentPrompt } from './types';
import type { AIRequestMessage } from '../core/validation';
import { getUserConfig } from '../ai/client';

export class LLMAdapter {
  static async think(
    messages: AIRequestMessage[],
    mode: 'chat' | 'command' | 'command+exec' = 'chat',
    onChunk?: (chunk: string) => void,
    customSystemPrompt?: string
  ): Promise<AgentThought> {
    const prompt: AgentPrompt = {
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

    const config = getUserConfig();
    const model = config.defaultModel || 'Assistant';

    const result = await runLLM({
      prompt,
      model,
      stream: !!onChunk,
      onChunk
    });

    return this.parseThought(result.rawText);
  }

  private static parseThought(raw: string): AgentThought {
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
          if (parsed.tool_name || parsed.tool) inferredType = 'tool_call';
          else if (parsed.command || parsed.cmd) inferredType = 'shell_cmd';
          else if (parsed.diff || parsed.patch) inferredType = 'code_diff';
          else inferredType = 'answer';
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
    } catch (e) {
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
