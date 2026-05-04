/**
 * Skill interface — extracted from agent/skills to break
 * the backwards dependency from core/ to agent/.
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  planTemplate: any;
  successCount: number;
  failureCount: number;
  confidence: number;
  lastUsed: number;
  createdAt: number;
  enabled: boolean;
}

/**
 * Compute a skill's score (0-1) based on success rate, freshness, and confidence.
 * Pure function — no dependencies.
 */
export function computeSkillScore(skill: Skill, now: number = Date.now()): number {
  const totalUses = skill.successCount + skill.failureCount;
  const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;

  // 时间衰减 (Freshness): 半衰期约 14 天
  const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);
  const freshness = Math.exp(-idleDays / 14);

  // 综合得分: 45% 成功率 + 35% 新鲜度 + 20% 置信度
  return (0.45 * successRate) + (0.35 * freshness) + (0.20 * skill.confidence);
}
