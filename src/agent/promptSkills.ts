/**
 * Skills 系统 - Prompt 模板模式
 *
 * 可配置的技能模板，动态生成 prompt，支持 allowedTools、model 等配置。
 * 参考：cc/src/skills/bundledSkills.ts
 *
 * 与现有 skills.ts 的区别：
 * - skills.ts: 基于学习历史自动积累技能
 * - skills.ts (本文件): 预定义的技能模板，即时匹配
 */

export interface SkillConfig {
  name: string;
  description: string;
  /** 触发关键词（匹配用户输入） */
  triggers: RegExp[];
  /** 允许使用的工具列表（为空表示不限制） */
  allowedTools?: string[];
  /** 推荐模型（为空使用默认） */
  model?: string;
  /** 系统 prompt 模板 */
  systemPrompt: string;
  /** 最大轮数 */
  maxTurns?: number;
  /** 是否在命令模式下启用 */
  enabledInCommandMode?: boolean;
}

// 内置技能注册表
const skills: Map<string, SkillConfig> = new Map();

// ============================================================================
// 内置技能定义
// ============================================================================

/**
 * Git 操作技能
 */
const gitSkill: SkillConfig = {
  name: 'git_ops',
  description: 'Git 版本控制操作',
  triggers: [
    /git\s+(commit|push|pull|merge|rebase|branch|checkout|reset|stash|cherry)/i,
    /(提交|推送|拉取|合并|变基|切换分支|重置|储藏|拣选)/i,
  ],
  allowedTools: ['shell_cmd', 'git_status', 'git_diff', 'git_log', 'read_file', 'list_files'],
  systemPrompt: `你是一个 Git 操作专家。
- 执行操作前先检查 git status
- 使用专用工具（git_status, git_diff, git_log）而非 shell_cmd
- 提交信息必须简洁明了
- 不强制推送`,
  maxTurns: 5,
  enabledInCommandMode: true,
};

/**
 * 代码分析技能
 */
const codeAnalysisSkill: SkillConfig = {
  name: 'code_analysis',
  description: '代码分析与审查',
  triggers: [
    /(分析|审查|解释|说明|总结)\s*(代码|文件|函数|类)/i,
    /(analyze|review|explain|summarize)\s*(code|file|function|class)/i,
  ],
  allowedTools: ['read_file', 'read_file_lines', 'search_symbol', 'search_in_files', 'list_directory_tree', 'analyze_dependencies', 'shell_cmd'],
  systemPrompt: `你是一个代码分析专家。
- 先读取相关文件内容
- 分析代码结构和依赖关系
- 给出清晰的分析结果
- 不要修改文件`,
  maxTurns: 8,
};

/**
 * 文件操作技能
 */
const fileOpsSkill: SkillConfig = {
  name: 'file_ops',
  description: '文件搜索、读取、修改',
  triggers: [
    /(搜索|查找|读取|修改|创建|删除|替换)\s*(文件|内容)/i,
    /(search|find|read|write|create|delete|replace)\s*(file|content)/i,
  ],
  allowedTools: ['read_file', 'write_file', 'search_in_files', 'list_files', 'list_directory_tree', 'shell_cmd'],
  systemPrompt: `你是一个文件操作专家。
- 修改文件前先读取确认
- 写入时保留完整内容
- 搜索使用专用工具而非 shell_cmd`,
  maxTurns: 10,
  enabledInCommandMode: true,
};

/**
 * 问题排查技能
 */
const troubleshootingSkill: SkillConfig = {
  name: 'troubleshooting',
  description: '错误排查与修复',
  triggers: [
    /(为什么|怎么解决|报错|错误|失败|修复)/i,
    /(why|how to fix|error|failed|troubleshoot)/i,
  ],
  allowedTools: ['read_file', 'search_in_files', 'shell_cmd', 'read_file_lines'],
  systemPrompt: `你是一个问题排查专家。
- 先读取错误日志或相关文件
- 逐步排查可能的原因
- 给出明确的解决方案
- 解释问题根因`,
  maxTurns: 8,
};

// ============================================================================
// 注册与匹配
// ============================================================================

function registerAllSkills(): void {
  for (const skill of [gitSkill, codeAnalysisSkill, fileOpsSkill, troubleshootingSkill]) {
    skills.set(skill.name, skill);
  }
}

/**
 * 根据用户输入匹配最合适的技能
 */
export function matchSkill(userInput: string): SkillConfig | null {
  if (skills.size === 0) registerAllSkills();

  for (const [, skill] of skills) {
    for (const trigger of skill.triggers) {
      if (trigger.test(userInput)) {
        return skill;
      }
    }
  }
  return null;
}

/**
 * 获取所有已注册的技能
 */
export function getAllSkills(): SkillConfig[] {
  if (skills.size === 0) registerAllSkills();
  return [...skills.values()];
}

/**
 * 生成技能的系统 prompt
 */
export function generateSkillPrompt(skill: SkillConfig, userInput: string): string {
  return `${skill.systemPrompt}\n\n当前任务: "${userInput}"`;
}
