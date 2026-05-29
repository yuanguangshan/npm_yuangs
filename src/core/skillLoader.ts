/**
 * Skill Loader - 从 Markdown 文件加载用户自定义技能
 *
 * 技能文件格式：Markdown + YAML frontmatter
 * ---
 * name: skill-name
 * description: 一句话描述
 * triggers:
 *   - 触发关键词或正则
 *   - another trigger
 * allowedTools: [tool1, tool2]
 * model: deepseek-v4-pro
 * ---
 *
 * 技能内容（body）作为 systemPrompt 注入 AI 上下文。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

export interface UserSkillFile {
  name: string;
  description: string;
  triggers: string[];
  allowedTools?: string[];
  model?: string;
  maxTurns?: number;
  /** Markdown body（frontmatter 之后的内容） */
  body: string;
}

const SKILL_DIRS = [
  path.join(os.homedir(), '.yuangs', 'skills'),
  path.join(process.cwd(), '.yuangs', 'skills'),
];

/**
 * 解析单个 Markdown 技能文件
 */
export function parseSkillFile(filePath: string): UserSkillFile | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!match) return null;

    const frontmatter = yaml.load(match[1]) as Record<string, any>;
    const body = match[2].trim();

    if (!frontmatter?.name || !frontmatter?.description) return null;

    return {
      name: frontmatter.name,
      description: frontmatter.description,
      triggers: frontmatter.triggers || [],
      allowedTools: frontmatter.allowedTools,
      model: frontmatter.model,
      maxTurns: frontmatter.maxTurns,
      body,
    };
  } catch {
    return null;
  }
}

/**
 * 从指定目录加载所有技能文件
 */
export function loadSkillsFromDir(dir: string): UserSkillFile[] {
  if (!fs.existsSync(dir)) return [];

  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    const skills: UserSkillFile[] = [];

    for (const file of files) {
      const skill = parseSkillFile(path.join(dir, file));
      if (skill) skills.push(skill);
    }

    return skills;
  } catch {
    return [];
  }
}

/**
 * 从所有默认目录加载技能
 */
export function loadAllUserSkills(): UserSkillFile[] {
  const skills: UserSkillFile[] = [];
  const seen = new Set<string>();

  for (const dir of SKILL_DIRS) {
    const dirSkills = loadSkillsFromDir(dir);
    for (const s of dirSkills) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        skills.push(s);
      }
    }
  }

  return skills;
}
