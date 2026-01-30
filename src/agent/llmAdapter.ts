import { AgentThought } from './state';
import { runLLM } from './llm';
import { AgentPrompt } from './types';
import type { AIRequestMessage } from '../core/validation';
import { getUserConfig } from '../ai/client';
import JSON5 from 'json5';
import { ContextManager } from './contextManager';
import { buildV2_3ProtocolPrompt, buildOutputConstraints, ProtocolV2_3Config } from './protocolV2_2';

export class LLMAdapter {
  static async think(
    messages: AIRequestMessage[],
    mode: 'chat' | 'command' | 'command+exec' = 'chat',
    onChunk?: (chunk: string, type?: 'thought' | 'json') => void,
    model?: string,
    customSystemPrompt?: string,
    contextManager?: ContextManager
  ): Promise<AgentThought> {
    const v2Config: ProtocolV2_3Config = {
        mode: mode === 'chat' ? 'chat' : 'command',
        enableStrictOutput: mode !== 'chat',
        enableReasoningTrace: true
    };

    let protocol = buildV2_3ProtocolPrompt(v2Config);
    const outputConstraints = buildOutputConstraints();
    protocol += `\n${outputConstraints}`;

    if (mode === 'command' || mode === 'command+exec') {
      protocol += `\n\nCOMMAND MODE ACTIVE:
- Prioritize "shell_cmd" for any terminal-based task.
- Minimize "answer" type unless task is purely conversational.
- Direct execution is expected.`;
    }

    const prompt: AgentPrompt = {
      system: customSystemPrompt ? `${protocol}\n\nGOVERNANCE POLICY:\n${customSystemPrompt}` : protocol,
      messages,
    };

    const config = getUserConfig();
    const finalModel = model || config.defaultModel || 'Assistant';

    const result = await runLLM({
      prompt,
      model: finalModel,
      stream: !!onChunk,
      onChunk,
      bypassRouter: !!model // Explicitly requested model bypasses routing
    });

    const thought = this.parseThought(result.rawText);
    thought.modelName = result.modelName || finalModel;
    thought.usedRouter = result.usedRouter;
    return thought;
  }

  static parseThought(raw: string): AgentThought {
    try {
      // CoT V2.3: 提取 PHASE 1: THINK 块或 [THOUGHT] 块
      const thoughtMatch = raw.match(/\[PHASE 1: THINK - 深度推理\]([\s\S]*?)\[PHASE 2/) || 
                          raw.match(/\[THOUGHT\]([\s\S]*?)\[\/THOUGHT\]/);
      const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/) || raw.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON5.parse(jsonMatch[1] || jsonMatch[0]);
        
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
            content: parsed.content || parsed.text || '',
            risk_level: parsed.risk_level || 'low',
            risk_explanation: parsed.risk_explanation || ''
          },
          reasoning: thoughtContent // 从 THOUGHT 块提取
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
