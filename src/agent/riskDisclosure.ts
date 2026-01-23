/**
 * 风险告知生成器
 * 为高风险操作生成详细的风险告知书，增强Human-in-the-loop安全性
 */

export interface RiskLevel {
  level: 'low' | 'medium' | 'high';
  score: number; // 0-100
}

export interface RiskFactors {
  commandType: string; // shell_cmd, file_write, file_delete, etc.
  command?: string;
  filePath?: string;
  fileCount?: number;
  isDestructive: boolean;
  modifiesSystem: boolean;
  requiresNetwork: boolean;
  modifiesGit: boolean;
}

export interface RiskDisclosure {
  riskLevel: RiskLevel;
  factors: RiskFactors;
  description: string;
  potentialIssues: string[];
  recommendedActions: string[];
  requireConfirmation: boolean;
  checkpoint?: string;
}

/**
 * 分析操作风险等级
 */
export function analyzeRiskLevel(factors: RiskFactors): RiskLevel {
  let score = 0;

  // 命令类型风险
  const commandTypeScores: Record<string, number> = {
    'shell_cmd': 50,
    'file_write': 40,
    'file_delete': 70,
    'file_read': 10,
    'git_operation': 40,
    'npm_install': 30,
    'docker_operation': 50,
    'system_config': 80,
  };
  score += commandTypeScores[factors.commandType] || 30;

  // 破坏性操作
  if (factors.isDestructive) {
    score += 30;
  }

  // 系统修改
  if (factors.modifiesSystem) {
    score += 20;
  }

  // 网络操作
  if (factors.requiresNetwork) {
    score += 15;
  }

  // Git操作
  if (factors.modifiesGit) {
    score += 10;
  }

  // 特定命令风险
  if (factors.command) {
    const highRiskPatterns = [
      /rm\s+-rf/,
      /rm\s+-r/,
      /del\s+\//,
      /format/,
      /mkfs/,
      /dd\s+if=/,
      /chmod\s+777/,
      /chmod\s+-R/,
      /chown\s+-R/,
      /wget.*\|/,
      /curl.*\|/,
      /:>.*\//,
      /eval/,
      /exec/,
    ];

    for (const pattern of highRiskPatterns) {
      if (pattern.test(factors.command)) {
        score += 30;
        break;
      }
    }
  }

  // 文件数量风险
  if (factors.fileCount && factors.fileCount > 10) {
    score += 20;
  }

  // 限制分数范围
  score = Math.min(100, Math.max(0, score));

  // 确定风险等级
  let level: 'low' | 'medium' | 'high';
  if (score >= 70) {
    level = 'high';
  } else if (score >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { level, score };
}

/**
 * 生成风险描述
 */
function generateRiskDescription(factors: RiskFactors, riskLevel: RiskLevel): string {
  let description = '';

  switch (factors.commandType) {
    case 'shell_cmd':
      description = `即将执行命令行操作。`;
      break;
    case 'file_write':
      description = `即将写入${factors.fileCount || 1}个文件。`;
      break;
    case 'file_delete':
      description = `即将删除${factors.fileCount || 1}个文件。`;
      break;
    case 'git_operation':
      description = `即将执行Git版本控制操作。`;
      break;
    case 'npm_install':
      description = `即将安装npm依赖包。`;
      break;
    case 'docker_operation':
      description = `即将执行Docker容器操作。`;
      break;
    case 'system_config':
      description = `即将修改系统配置。`;
      break;
    default:
      description = `即将执行潜在风险操作。`;
  }

  // 始终添加风险等级描述
  if (riskLevel.level === 'high') {
    description += ` 此操作风险等级为【高】，可能导致数据丢失或系统不可用。`;
  } else if (riskLevel.level === 'medium') {
    description += ` 此操作风险等级为【中】，请仔细检查操作内容。`;
  } else {
    description += ` 此操作风险等级为【低】，风险相对可控。`;
  }

  return description;
}

/**
 * 生成潜在问题列表
 */
function generatePotentialIssues(factors: RiskFactors, riskLevel: RiskLevel): string[] {
  const issues: string[] = [];

  if (factors.isDestructive) {
    issues.push('数据可能无法恢复');
    issues.push('重要文件可能被永久删除');
  }

  if (factors.modifiesSystem) {
    issues.push('系统配置可能被修改');
    issues.push('可能影响其他应用程序');
  }

  if (factors.requiresNetwork) {
    issues.push('需要网络连接');
    issues.push('可能下载不安全的软件');
    issues.push('可能泄露敏感信息');
  }

  if (factors.modifiesGit) {
    issues.push('Git历史可能被修改');
    issues.push('可能导致协作冲突');
  }

  if (factors.command) {
    if (factors.command.includes('rm') || factors.command.includes('del')) {
      issues.push('文件删除操作不可逆');
    }
    if (factors.command.includes('sudo')) {
      issues.push('需要管理员权限');
      issues.push('可能影响系统稳定性');
    }
    if (factors.command.includes('chmod')) {
      issues.push('文件权限可能被修改');
    }
  }

  // 高风险特殊问题
  if (riskLevel.level === 'high') {
    issues.push('可能导致系统崩溃');
    issues.push('可能需要重新安装系统');
  }

  return issues.length > 0 ? issues : ['可能导致不可预期的副作用'];
}

/**
 * 生成推荐行动
 */
function generateRecommendedActions(factors: RiskFactors, riskLevel: RiskLevel): string[] {
  const actions: string[] = [];

  if (factors.isDestructive) {
    actions.push('备份重要数据');
    actions.push('确认删除列表');
    actions.push('使用--dry-run参数测试');
  }

  if (factors.modifiesSystem) {
    actions.push('记录当前配置');
    actions.push('在测试环境先尝试');
    actions.push('准备回滚方案');
  }

  if (factors.requiresNetwork) {
    actions.push('验证软件来源');
    actions.push('检查数字签名');
    actions.push('使用网络隔离环境');
  }

  if (factors.modifiesGit) {
    actions.push('创建备份分支');
    actions.push('与团队成员沟通');
    actions.push('检查未提交的更改');
  }

  if (factors.command) {
    if (factors.command.includes('rm') || factors.command.includes('del')) {
      actions.push('使用通配符前先验证');
      actions.push('确认当前工作目录');
    }
    if (factors.command.includes('sudo')) {
      actions.push('确认命令来源');
      actions.push('检查依赖软件');
    }
  }

  // 通用建议
  actions.push('仔细审查命令参数');
  actions.push('确认文件路径正确');
  actions.push('考虑创建系统快照');

  if (riskLevel.level === 'high') {
    actions.unshift('⚠️ 强烈建议先在测试环境验证');
  }

  return actions;
}

/**
 * 生成检查点
 */
function generateCheckpoint(factors: RiskFactors, riskLevel: RiskLevel): string {
  const timestamp = new Date().toISOString();
  const actions: string[] = [];

  if (factors.isDestructive) {
    actions.push('已确认重要数据已备份');
  }

  if (factors.modifiesSystem) {
    actions.push('已记录当前系统配置');
  }

  if (factors.modifiesGit) {
    actions.push('已创建备份分支');
  }

  return `Checkpoint [${timestamp}]
- ${actions.join('\n- ') || '已确认操作风险'}`;
}

/**
 * 生成风险告知书
 */
export function generateRiskDisclosure(factors: RiskFactors): RiskDisclosure {
  const riskLevel = analyzeRiskLevel(factors);
  const description = generateRiskDescription(factors, riskLevel);
  const potentialIssues = generatePotentialIssues(factors, riskLevel);
  const recommendedActions = generateRecommendedActions(factors, riskLevel);
  const requireConfirmation = riskLevel.level === 'high';
  const checkpoint = riskLevel.level === 'high' ? generateCheckpoint(factors, riskLevel) : undefined;

  return {
    riskLevel,
    factors,
    description,
    potentialIssues,
    recommendedActions,
    requireConfirmation,
    checkpoint,
  };
}

/**
 * 格式化风险告知书为CLI友好的格式
 */
export function formatRiskDisclosureCLI(disclosure: RiskDisclosure): string {
  const { riskLevel, description, potentialIssues, recommendedActions, checkpoint } = disclosure;

  // 风险等级图标
  const riskIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  const riskLabels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  };

  let output = '';

  output += `\n${'='.repeat(60)}\n`;
  output += `${riskIcons[riskLevel.level]} 风险告知书 [风险等级: ${riskLabels[riskLevel.level]} (${riskLevel.score}/100)]\n`;
  output += `${'='.repeat(60)}\n\n`;

  output += `📋 操作描述\n${description}\n\n`;

  if (potentialIssues.length > 0) {
    output += `⚠️  潜在问题\n`;
    potentialIssues.forEach(issue => {
      output += `   • ${issue}\n`;
    });
    output += `\n`;
  }

  if (recommendedActions.length > 0) {
    output += `💡 推荐行动\n`;
    recommendedActions.forEach(action => {
      output += `   ${action}\n`;
    });
    output += `\n`;
  }

  if (checkpoint) {
    output += `📍 操作前检查点\n${checkpoint}\n\n`;
  }

  if (riskLevel.level === 'high') {
    output += `🔐 需要确认\n`;
    output += `   此操作风险较高，请确认：\n`;
    output += `   [y] 继续执行\n`;
    output += `   [n] 取消操作\n`;
    output += `   [v] 查看详细信息\n\n`;
  }

  output += `${'='.repeat(60)}\n`;

  return output;
}

/**
 * 从解析的thought生成风险因素
 */
export function extractRiskFactorsFromThought(thought: string): RiskFactors {
  // 这里可以解析thought中的action_type、command等信息
  // 暂时返回默认值，实际使用时需要根据具体的thought格式调整
  return {
    commandType: 'shell_cmd',
    isDestructive: false,
    modifiesSystem: false,
    requiresNetwork: false,
    modifiesGit: false,
  };
}
