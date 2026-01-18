"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretResultToPlan = interpretResultToPlan;
function interpretResultToPlan(result, intent, mode, alreadyStreamed = false) {
    if (mode === 'chat') {
        const tasks = alreadyStreamed ? [] : [{
                id: 'chat-response',
                description: '输出 AI 回答',
                type: 'custom',
                status: 'pending',
                payload: { kind: 'print', text: result.rawText }
            }];
        return {
            goal: '回答用户咨询',
            tasks: tasks
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
//# sourceMappingURL=interpret.js.map