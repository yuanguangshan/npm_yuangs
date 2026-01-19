import { ExecutionRecord } from './executionRecord';
import { computeSkillScore } from '../agent/skills';

export interface ReplayDiffResult {
  decisionDiff: DecisionDiff;
  modelDiff: ModelDiff;
  skillsDiff: SkillsDiff;
}

interface DecisionDiff {
  changed: boolean;
  strategyChanged: boolean;
  modelChanged: boolean;
  reasonChanged: boolean;
  before?: {
    strategy: string;
    selectedModel: string;
    reason: string;
  };
  after?: {
    strategy: string;
    selectedModel: string;
    reason: string;
  };
}

interface ModelDiff {
  changed: boolean;
  nameChanged: boolean;
  providerChanged: boolean;
  before?: {
    name: string;
    provider: string;
    contextWindow: number | string;
    costProfile: string;
  };
  after?: {
    name: string;
    provider: string;
    contextWindow: number | string;
    costProfile: string;
  };
}

interface SkillsDiff {
  added: SkillChange[];
  removed: SkillChange[];
  changed: SkillChange[];
}

interface SkillChange {
  name: string;
  score?: number;
  enabled?: boolean;
  confidence?: number;
  successRate?: number;
  lastUsed?: string;
}

export function diffExecution(
  original: ExecutionRecord,
  current: ExecutionRecord
): ReplayDiffResult {
  return {
    decisionDiff: diffDecision(original, current),
    modelDiff: diffModel(original, current),
    skillsDiff: diffSkills(original, current),
  };
}

function diffDecision(original: ExecutionRecord, current: ExecutionRecord): DecisionDiff {
  const origDecision = original.decision;
  const currDecision = current.decision;

  const strategyChanged = origDecision?.strategy !== currDecision?.strategy;
  const modelChanged = origDecision?.selectedModel?.name !== currDecision?.selectedModel?.name;
  const reasonChanged = origDecision?.reason !== currDecision?.reason;

  return {
    changed: strategyChanged || modelChanged || reasonChanged,
    strategyChanged,
    modelChanged,
    reasonChanged,
    before: {
      strategy: origDecision?.strategy ?? 'N/A',
      selectedModel: origDecision?.selectedModel?.name ?? 'N/A',
      reason: origDecision?.reason ?? 'N/A',
    },
    after: {
      strategy: currDecision?.strategy ?? 'N/A',
      selectedModel: currDecision?.selectedModel?.name ?? 'N/A',
      reason: currDecision?.reason ?? 'N/A',
    },
  };
}

function diffModel(original: ExecutionRecord, current: ExecutionRecord): ModelDiff {
  const origModel = original.decision.selectedModel;
  const currModel = current.decision.selectedModel;

  if (!origModel || !currModel) {
    return {
      changed: true,
      nameChanged: true,
      providerChanged: true,
      before: origModel ? {
        name: origModel.name,
        provider: origModel.provider,
        contextWindow: origModel.contextWindow ?? 'default',
        costProfile: origModel.costProfile ?? 'default',
      } : undefined,
      after: currModel ? {
        name: currModel.name,
        provider: currModel.provider,
        contextWindow: currModel.contextWindow ?? 'default',
        costProfile: currModel.costProfile ?? 'default',
      } : undefined,
    };
  }

  const nameChanged = origModel.name !== currModel.name;
  const providerChanged = origModel.provider !== currModel.provider;

  return {
    changed: nameChanged || providerChanged,
    nameChanged,
    providerChanged,
    before: {
      name: origModel.name,
      provider: origModel.provider,
      contextWindow: origModel.contextWindow ?? 'default',
      costProfile: origModel.costProfile ?? 'default',
    },
    after: {
      name: currModel.name,
      provider: currModel.provider,
      contextWindow: currModel.contextWindow ?? 'default',
      costProfile: currModel.costProfile ?? 'default',
    },
  };
}

function diffSkills(original: ExecutionRecord, current: ExecutionRecord): SkillsDiff {
  const origSkills = original.decision.skills ?? [];
  const currSkills = current.decision.skills ?? [];

  const origSkillMap = new Map(origSkills.map(s => [s.name, s]));
  const currSkillMap = new Map(currSkills.map(s => [s.name, s]));

  const added: SkillChange[] = [];
  const removed: SkillChange[] = [];
  const changed: SkillChange[] = [];

  const now = Date.now();

  // Find added and changed skills
  for (const skill of currSkills) {
    const origSkill = origSkillMap.get(skill.name);

    if (!origSkill) {
      // Added
      const score = computeSkillScore(skill, now);
      const totalUses = skill.successCount + skill.failureCount;
      const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;

      added.push({
        name: skill.name,
        score,
        enabled: skill.enabled,
        confidence: skill.confidence,
        successRate,
        lastUsed: new Date(skill.lastUsed).toISOString(),
      });
    } else {
      // Check if changed
      const origScore = computeSkillScore(origSkill, now);
      const currScore = computeSkillScore(skill, now);
      const origTotalUses = origSkill.successCount + origSkill.failureCount;
      const currTotalUses = skill.successCount + skill.failureCount;
      const origSuccessRate = origTotalUses === 0 ? 0.5 : origSkill.successCount / origTotalUses;
      const currSuccessRate = currTotalUses === 0 ? 0.5 : skill.successCount / currTotalUses;

      if (
        Math.abs(origScore - currScore) > 0.001 ||
        origSkill.enabled !== skill.enabled ||
        Math.abs(origSuccessRate - currSuccessRate) > 0.001
      ) {
        changed.push({
          name: skill.name,
          score: currScore,
          enabled: skill.enabled,
          confidence: skill.confidence,
          successRate: currSuccessRate,
          lastUsed: new Date(skill.lastUsed).toISOString(),
        });
      }
    }
  }

  // Find removed skills
  for (const skill of origSkills) {
    if (!currSkillMap.has(skill.name)) {
      const score = computeSkillScore(skill, now);
      const totalUses = skill.successCount + skill.failureCount;
      const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;

      removed.push({
        name: skill.name,
        score,
        enabled: skill.enabled,
        confidence: skill.confidence,
        successRate,
        lastUsed: new Date(skill.lastUsed).toISOString(),
      });
    }
  }

  return {
    added,
    removed,
    changed,
  };
}

export function formatReplayDiff(diff: ReplayDiffResult): string {
  const lines: string[] = [];

  lines.push('=== Replay Diff ===');

  // [Decision]
  lines.push('[Decision]');
  if (!diff.decisionDiff.changed) {
    lines.push('- no change');
  } else {
    if (diff.decisionDiff.strategyChanged) {
      lines.push(`- strategy: ${diff.decisionDiff.before?.strategy} → ${diff.decisionDiff.after?.strategy}`);
    }
    if (diff.decisionDiff.modelChanged) {
      lines.push(`- selectedModel: ${diff.decisionDiff.before?.selectedModel} → ${diff.decisionDiff.after?.selectedModel}`);
    }
    if (diff.decisionDiff.reasonChanged) {
      lines.push(`- reason:`);
      lines.push(`    before: "${diff.decisionDiff.before?.reason}"`);
      lines.push(`    after: "${diff.decisionDiff.after?.reason}"`);
    }
  }
  lines.push('');

  // [Model]
  lines.push('[Model]');
  if (!diff.modelDiff.changed) {
    lines.push('- no change');
  } else {
    if (diff.modelDiff.nameChanged) {
      lines.push(`- name: ${diff.modelDiff.before?.name} → ${diff.modelDiff.after?.name}`);
    }
    if (diff.modelDiff.providerChanged) {
      lines.push(`- provider: ${diff.modelDiff.before?.provider} → ${diff.modelDiff.after?.provider}`);
    }
  }
  lines.push('');

  // [Skills]
  lines.push('[Skills]');
  if (diff.skillsDiff.added.length === 0 &&
      diff.skillsDiff.removed.length === 0 &&
      diff.skillsDiff.changed.length === 0) {
    lines.push('- no change');
  } else {
    for (const skill of diff.skillsDiff.added) {
      lines.push(`+ added: ${skill.name} (score=${skill.score?.toFixed(3)})`);
    }
    for (const skill of diff.skillsDiff.removed) {
      lines.push(`- removed: ${skill.name}`);
    }
    for (const skill of diff.skillsDiff.changed) {
      lines.push(`~ changed: ${skill.name} (score=${skill.score?.toFixed(3)}, enabled=${skill.enabled})`);
    }
  }

  lines.push('===================');

  return lines.join('\n');
}
