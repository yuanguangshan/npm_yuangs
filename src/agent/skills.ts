import { AgentPlan } from './plan';
import { ExecutionRecord } from './record';

export interface Skill {
    id: string;
    name: string;
    description: string;
    whenToUse: string; // 触发场景描述
    planTemplate: AgentPlan;
    successCount: number;
    lastUsed: number;
}

const skillLibrary: Skill[] = [];

/**
 * 从成功的执行记录中学习技能
 */
export function learnSkillFromRecord(record: ExecutionRecord) {
    // 只有成功的 shell 命令才值得学习
    if (record.mode === 'chat') return;
    if (!record.llmResult.plan) return;

    // 检查是否已经存在类似的技能 (简单基于名称匹配)
    const existingSkill = skillLibrary.find(s => s.name === record.llmResult.plan?.goal);

    if (existingSkill) {
        existingSkill.successCount++;
        existingSkill.lastUsed = Date.now();
        return;
    }

    // 限制技能库大小
    if (skillLibrary.length > 50) {
        skillLibrary.shift(); // 移除最老的一个
    }

    skillLibrary.push({
        id: record.id,
        name: record.llmResult.plan.goal,
        description: `自动学习的技能: ${record.llmResult.plan.goal}`,
        whenToUse: record.input.rawInput,
        planTemplate: record.llmResult.plan,
        successCount: 1,
        lastUsed: Date.now()
    });
}

/**
 * 获取相关技能以注入 Prompt
 */
export function getRelevantSkills(input: string): Skill[] {
    // 简单返回最近使用的 3 个，未来可以用向量检索 (Vector Search)
    return skillLibrary
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, 3);
}

export function getAllSkills(): Skill[] {
    return [...skillLibrary];
}
