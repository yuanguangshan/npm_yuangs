import { ExecutionRecord } from './executionRecord';
import { computeSkillScore, Skill } from '../agent/skills';

/**
 * Explain Output Spec v1
 * - Stable, human-readable, diff-friendly
 * - No side effects
 * - Do NOT change without bumping spec version
 */
export function explainExecution(record: ExecutionRecord): string {
  const lines: string[] = [];

  lines.push('=== Execution Explanation ===');

  /* =========================
   * [1] Command
   * ========================= */
  lines.push('[1] Command');
  lines.push(`- Name: ${record.meta.commandName ?? 'N/A'}`);

  if (record.command) {
    lines.push(`- Args: ${record.command}`);
  }

  if (record.meta.rawInput) {
    lines.push(`- Raw: ${record.meta.rawInput}`);
  }
  lines.push('');

  /* =========================
   * [2] Decision
   * ========================= */
  const decision = record.decision ?? {};

  lines.push('[2] Decision');
  lines.push(`- Strategy: ${decision.strategy ?? 'capability-match'}`);
  lines.push(
    `- Selected Model: ${decision.selectedModel?.name ?? 'N/A'}`
  );
  lines.push(
    `- Reason: ${decision.reason ?? 'Capability-based selection with fallback support'}`
  );
  lines.push('');

  /* =========================
   * [3] Model
   * ========================= */
  const model = decision.selectedModel;

  lines.push('[3] Model');
  lines.push(`- Name: ${model?.name ?? 'N/A'}`);
  lines.push(`- Provider: ${model?.provider ?? 'N/A'}`);
  lines.push(`- Context Window: ${model?.contextWindow ?? 'default'}`);
  lines.push(`- Cost Profile: ${model?.costProfile ?? 'default'}`);
  lines.push('');

  /* =========================
   * [4] Skills
   * ========================= */
  lines.push('[4] Skills');

  const skills: Skill[] = decision.skills ?? [];
  const now = Date.now();

  if (skills.length === 0) {
    lines.push('- (none)');
  } else {
    const scored = skills
      .map(skill => ({
        skill,
        score: computeSkillScore(skill, now),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { skill, score } of scored) {
      const totalUses = skill.successCount + skill.failureCount;
      const successRate =
        totalUses === 0 ? 0.5 : skill.successCount / totalUses;

      lines.push(`- ${skill.name}`);
      lines.push(`    score: ${score.toFixed(3)}`);
      lines.push(`    confidence: ${skill.confidence.toFixed(3)}`);
      lines.push(`    successRate: ${successRate.toFixed(3)}`);
      lines.push(`    enabled: ${skill.enabled}`);
      lines.push(
        `    lastUsed: ${new Date(skill.lastUsed).toISOString()}`
      );
    }
  }
  lines.push('');

  /* =========================
   * [5] Meta
   * ========================= */
  lines.push('[5] Meta');
  lines.push(`- Execution ID: ${record.id}`);
  lines.push(
    `- Timestamp: ${new Date(record.meta.timestamp).toISOString()}`
  );
  lines.push(`- Replayable: ${record.meta.replayable ?? true}`);
  lines.push(`- Version: ${record.meta.version ?? 'unknown'}`);

  lines.push('=============================');

  return lines.join('\n');
}
