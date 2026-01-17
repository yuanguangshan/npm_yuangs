import { AgentIntent, AgentMode, LLMResult } from './types';
import { AgentPlan } from './plan';

export function interpretResultToPlan(
    result: LLMResult,
    intent: AgentIntent,
    mode: AgentMode
): AgentPlan {
    if (mode === 'chat') {
        return {
            goal: '回答用户咨询',
            tasks: [{
                id: 'chat-response',
                description: '输出 AI 回答',
                type: 'custom',
                status: 'pending',
                payload: { kind: 'print', text: result.rawText }
            }]
        };
    }

    const aiPlan = result.parsed;
    if (!aiPlan || (!aiPlan.command && !aiPlan.macro)) {
        throw new Error('AI 未能生成有效的执行计划');
    }

    const command = aiPlan.command || aiPlan.macro; // 暂时简化处理

    return {
        goal: aiPlan.plan || '执行 Shell 命令',
        tasks: [
            {
                id: 'exec-shell',
                description: `执行命令: ${command}`,
                type: 'shell',
                status: 'pending',
                payload: {
                    command: command,
                    risk: aiPlan.risk ?? 'medium'
                }
            }
        ]
    };
}
