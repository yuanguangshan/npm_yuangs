import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import type { Skill } from '../core/skillTypes';
import { computeSkillScore } from '../core/skillTypes';
import { FileStorage } from '../utils/storage';

// Re-export for backward compatibility
export type { Skill };
export { computeSkillScore };

const skillsStorage = FileStorage.forYuangs<Skill[]>('skills.json');

// 初始化加载
let skillLibrary: Skill[] = skillsStorage.read() || [];

/** 持久化技能到磁盘 */
function persistSkills(): void {
    skillsStorage.write(skillLibrary);
}

/**
 * 更新技能状态 (执行后调用)
 */
export function updateSkillStatus(skillId: string, success: boolean) {
    const skill = skillLibrary.find(s => s.id === skillId);
    if (!skill) return;

    skill.lastUsed = Date.now();
    if (success) {
        skill.successCount++;
        // 成功奖励: 置信度缓慢提升
        skill.confidence = Math.min(1, skill.confidence + 0.05);
    } else {
        skill.failureCount++;
        // 失败惩罚: 惩罚力度大于奖励，防止系统“自嗨”
        skill.confidence = Math.max(0, skill.confidence - 0.1);
    }

    persistSkills();
}

/**
 * 自动学习新技能
 */
export function learnSkillFromRecord(record: any, success: boolean = true) {
    // Handle both old and new record structures
    const mode = record.mode || record.meta?.mode || 'chat';
    const plan = record.llmResult?.plan || record.decision?.llmResult?.plan;
    const input = record.input?.rawInput || record.meta?.rawInput;

    // Only learn from agent/chat mode with plans
    if (mode !== 'chat' && mode !== 'agent') return;
    if (!plan) return;

    const skillName = plan.goal || plan.command || 'unnamed';
    const existingSkill = skillLibrary.find(s => s.name === skillName);

    if (existingSkill) {
        updateSkillStatus(existingSkill.id, success);
        return;
    }

    // 只有成功的记录才被学为新技能
    if (!success) return;

    const now = Date.now();
    skillLibrary.push({
        id: record.id,
        name: skillName,
        description: `Auto-learned skill: ${skillName}`,
        whenToUse: input || 'Agent execution',
        planTemplate: plan,
        successCount: 1,
        failureCount: 0,
        confidence: 0.5,
        lastUsed: now,
        createdAt: now,
        enabled: true
    });

    // 每学习一次，尝试清理一次“冷”技能
    reapColdSkills();

    persistSkills();
}

/**
 * 筛选并排序技能 (用于注入 Prompt)
 */
export function getRelevantSkills(input: string, limit: number = 3): Skill[] {
    const now = Date.now();

    return skillLibrary
        // 1. 基础筛选: 剔除评分过低的技能 (硬淘汰阈值 0.3)
        .filter(s => computeSkillScore(s, now) >= 0.3)
        // 2. 过滤已禁用的技能
        .filter(s => s.enabled !== false)
        // 3. 排序: 按综合分排序
        .sort((a, b) => computeSkillScore(b, now) - computeSkillScore(a, now))
        // 4. 取上限
        .slice(0, limit);
}

/**
 * 清理过期或低质技能 (Reaper)
 */
export function reapColdSkills() {
    const now = Date.now();
    const initialCount = skillLibrary.length;

    skillLibrary = skillLibrary.filter(skill => {
        const score = computeSkillScore(skill, now);
        const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);

        // 满足以下任一条件则淘汰:
        // 1. 得分极低且长期不用
        if (score < 0.25 && idleDays > 30) return false;
        // 2. 失败率极高且尝试过一定次数
        if (skill.failureCount > 5 && (skill.successCount / (skill.successCount + skill.failureCount)) < 0.2) return false;

        return true;
    });

    // 强制保持容量
    if (skillLibrary.length > 100) {
        // 如果还超标，移除得分最低的那个
        skillLibrary.sort((a, b) => computeSkillScore(a, now) - computeSkillScore(b, now));
        skillLibrary.shift();
    }

    if (skillLibrary.length !== initialCount) {
        persistSkills(); // Persist if changes happened
    }
}

export function getAllSkills(): Skill[] {
    return [...skillLibrary];
}

/**
 * 启用技能
 */
export function enableSkill(name: string): boolean {
    const skill = skillLibrary.find(s => s.name === name || s.id === name);
    if (!skill) return false;
    if (skill.enabled) return true;
    skill.enabled = true;
    persistSkills();
    return true;
}

/**
 * 禁用技能
 */
export function disableSkill(name: string): boolean {
    const skill = skillLibrary.find(s => s.name === name || s.id === name);
    if (!skill) return false;
    if (!skill.enabled) return true;
    skill.enabled = false;
    persistSkills();
    return true;
}
