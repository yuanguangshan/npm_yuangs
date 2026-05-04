import type { Skill } from '../core/skillTypes';
import { computeSkillScore } from '../core/skillTypes';
export type { Skill };
export { computeSkillScore };
/**
 * 更新技能状态 (执行后调用)
 */
export declare function updateSkillStatus(skillId: string, success: boolean): void;
/**
 * 自动学习新技能
 */
export declare function learnSkillFromRecord(record: any, success?: boolean): void;
/**
 * 筛选并排序技能 (用于注入 Prompt)
 */
export declare function getRelevantSkills(input: string, limit?: number): Skill[];
/**
 * 清理过期或低质技能 (Reaper)
 */
export declare function reapColdSkills(): void;
export declare function getAllSkills(): Skill[];
/**
 * 启用技能
 */
export declare function enableSkill(name: string): boolean;
/**
 * 禁用技能
 */
export declare function disableSkill(name: string): boolean;
