import { AgentPlan } from './plan';
import { ExecutionRecord } from './record';
export interface Skill {
    id: string;
    name: string;
    description: string;
    whenToUse: string;
    planTemplate: AgentPlan;
    successCount: number;
    failureCount: number;
    confidence: number;
    lastUsed: number;
    createdAt: number;
    enabled: boolean;
}
/**
 * 计算技能分 (0 ~ 1)
 */
export declare function computeSkillScore(skill: Skill, now?: number): number;
/**
 * 更新技能状态 (执行后调用)
 */
export declare function updateSkillStatus(skillId: string, success: boolean): void;
/**
 * 自动学习新技能
 */
export declare function learnSkillFromRecord(record: ExecutionRecord, success?: boolean): void;
/**
 * 筛选并排序技能 (用于注入 Prompt)
 */
export declare function getRelevantSkills(input: string, limit?: number): Skill[];
/**
 * 清理过期或低质技能 (Reaper)
 */
export declare function reapColdSkills(): void;
export declare function getAllSkills(): Skill[];
