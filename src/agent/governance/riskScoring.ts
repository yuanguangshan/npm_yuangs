import { ProposedAction, ToolCallPayload, ShellCmdPayload } from '../state';

/**
 * 风险评分配置
 */
export interface RiskScoringConfig {
  /** 是否启用用户信任度 */
  enableUserTrust: boolean;
  /** 用户信任度衰减因子 (每天) */
  trustDecayRate: number;
  /** 最小信任度 (0-1) */
  minTrust: number;
  /** 最大信任度 (0-1) */
  maxTrust: number;
}

const DEFAULT_RISK_CONFIG: RiskScoringConfig = {
  enableUserTrust: true,
  trustDecayRate: 0.05,  // 每天衰减 5%
  minTrust: 0.1,
  maxTrust: 0.95
};

/**
 * 风险因子
 */
export interface RiskFactor {
  /** 因子名称 */
  name: string;
  /** 权重 (0-1) */
  weight: number;
  /** 计算出的分数 (0-1) */
  score: number;
  /** 原因说明 */
  reason: string;
}

/**
 * 综合风险评估结果
 */
export interface RiskAssessment {
  /** 总风险分数 (0-100) */
  score: number;
  /** 风险等级 */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** 各维度评分 */
  factors: RiskFactor[];
  /** 评分置信度 (0-1) */
  confidence: number;
  /** 建议的操作 */
  suggestedAction: 'auto-allow' | 'human-review' | 'deny';
  /** 用户信任度 (0-1) */
  userTrust: number;
}

/**
 * 破坏性命令模式
 */
const DESTRUCTIVE_PATTERNS = [
  { pattern: /\brm\s+[-rf]+\s+\/?/, risk: 50, reason: '强制递归删除根目录' },
  { pattern: /\bdd\s+if=\/dev\/(zero|null)/, risk: 50, reason: '使用 dd 写入零数据' },
  { pattern: /\bmkfs\.(ext[234]|xfs|btrfs|vfat)/, risk: 45, reason: '格式化文件系统' },
  { pattern: /\bformat\s+[a-z]:/i, risk: 45, reason: 'Windows 格式化命令' },
  { pattern: /\bdel\s+\/[sq]/i, risk: 40, reason: 'Windows 强制删除' },
  { pattern: /\bshutdown\s+\/[s]/i, risk: 35, reason: '系统关机命令' },
  { pattern: /\breboot\b/i, risk: 30, reason: '系统重启命令' },
  { pattern: /\bchmod\s+000\b/, risk: 35, reason: '移除所有权限' },
  { pattern: /\bchown\s+-R\s+root/, risk: 30, reason: '递归更改所有者为 root' },
  { pattern: />\s*\/dev\/\w+/, risk: 25, reason: '重定向到设备文件' },
  { pattern: /:\s*\(\s*\)/, risk: 20, reason: '空命令 (冒号命令)' },
];

/**
 * 敏感路径模式
 */
const SENSITIVE_PATH_PATTERNS = [
  { pattern: /\/etc\//, risk: 20, reason: '系统配置目录' },
  { pattern: /\/usr\/bin\//, risk: 15, reason: '系统二进制目录' },
  { pattern: /\/usr\/lib\//, risk: 15, reason: '系统库目录' },
  { pattern: /\/var\/log\//, risk: 10, reason: '系统日志目录' },
  { pattern: /\/boot\//, risk: 25, reason: '启动分区目录' },
  { pattern: /\/root\/\.ssh\//, risk: 30, reason: 'SSH 密钥目录' },
  { pattern: /~\/\.ssh\//, risk: 30, reason: 'SSH 密钥目录' },
  { pattern: /\.env$/i, risk: 15, reason: '环境变量文件' },
  { pattern: /\.pem$/i, risk: 25, reason: 'PEM 证书文件' },
  { pattern: /\.key$/i, risk: 25, reason: '私钥文件' },
];

/**
 * 高风险工具
 */
const HIGH_RISK_TOOLS = [
  'write_file',
  'delete_file',
  'execute_shell',
  'modify_system_config',
];

/**
 * 中风险工具
 */
const MEDIUM_RISK_TOOLS = [
  'search_files',
  'read_file',
  'list_directory',
];

/**
 * 低风险工具（内置白名单）
 */
const LOW_RISK_TOOLS = [
  'read_file',
  'list_files',
  'web_search',
];

/**
 * 风险评分计算器
 *
 * 算法:
 * 1. 基础风险: 命令类型和工具风险
 * 2. 破坏性风险: 检测破坏性模式
 * 3. 路径敏感性: 目标路径的风险等级
 * 4. 用户信任度: 历史行为建立的信任
 * 5. 上下文风险: 执行上下文的额外考虑
 *
 * 最终得分 = Σ(weight_i × score_i) - trust_bonus
 */
export class RiskScoringModel {
  private config: RiskScoringConfig;
  private userTrustScores: Map<string, number> = new Map();
  private userLastSeen: Map<string, number> = new Map();

  constructor(config: Partial<RiskScoringConfig> = {}) {
    this.config = { ...DEFAULT_RISK_CONFIG, ...config };
  }

  /**
   * 评估单个动作的风险
   */
  assessRisk(action: ProposedAction, userId?: string): RiskAssessment {
    const factors: RiskFactor[] = [];
    const userTrust = this.getUserTrust(userId);

    // 1. 基础风险因子 (命令类型)
    factors.push(this.assessBaseRisk(action));

    // 2. 破坏性风险因子
    factors.push(this.assessDestructiveRisk(action));

    // 3. 路径敏感性因子
    factors.push(this.assessPathSensitivity(action));

    // 4. 命令复杂度因子
    factors.push(this.assessCommandComplexity(action));

    // 5. 上下文风险因子
    factors.push(this.assessContextualRisk(action));

    // 计算加权总分
    let totalWeight = 0;
    let weightedScore = 0;

    for (const factor of factors) {
      weightedScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    }

    const rawScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // 用户信任度奖励（降低风险）
    const trustBonus = userTrust * 15; // 最高可降低 15 分
    const finalScore = Math.max(0, Math.min(100, rawScore * 100 - trustBonus));

    // 确定风险等级和建议操作
    const level = this.determineLevel(finalScore);
    const suggestedAction = this.determineAction(finalScore, userTrust);

    return {
      score: Math.round(finalScore),
      level,
      factors,
      confidence: this.calculateConfidence(factors),
      suggestedAction,
      userTrust
    };
  }

  /**
   * 基础风险评估
   */
  private assessBaseRisk(action: ProposedAction): RiskFactor {
    let score = 0;
    let reason = '未知类型';

    if (action.type === 'shell_cmd') {
      // shell 命令基础风险 20 分
      score = 0.2;
      reason = 'Shell 命令执行';
    } else if (action.type === 'tool_call') {
      const toolParams = action.payload as unknown as ToolCallPayload;
      const toolName = toolParams.tool_name;

      if (LOW_RISK_TOOLS.includes(toolName)) {
        score = 0.05;
        reason = '低风险工具调用';
      } else if (HIGH_RISK_TOOLS.includes(toolName)) {
        score = 0.35;
        reason = '高风险工具调用';
      } else if (MEDIUM_RISK_TOOLS.includes(toolName)) {
        score = 0.15;
        reason = '中风险工具调用';
      } else {
        score = 0.2;
        reason = '未知工具调用';
      }
    }

    return {
      name: 'base_risk',
      weight: 0.25,
      score,
      reason
    };
  }

  /**
   * 破坏性风险评估
   */
  private assessDestructiveRisk(action: ProposedAction): RiskFactor {
    let maxScore = 0;
    let matchedReason = '无破坏性特征';

    if (action.type === 'shell_cmd') {
      const command = (action.payload as unknown as ShellCmdPayload).command || '';

      for (const { pattern, risk, reason } of DESTRUCTIVE_PATTERNS) {
        if (pattern.test(command)) {
          const score = risk / 100;
          if (score > maxScore) {
            maxScore = score;
            matchedReason = reason;
          }
        }
      }
    } else if (action.type === 'tool_call') {
      // 工具调用的破坏性检查
      const toolParams = action.payload as unknown as ToolCallPayload;
      if ((toolParams.parameters as Record<string, unknown>)?.destructive) {
        maxScore = 0.5;
        matchedReason = '工具标记为破坏性';
      }
    }

    return {
      name: 'destructive_risk',
      weight: 0.3,
      score: maxScore,
      reason: matchedReason
    };
  }

  /**
   * 路径敏感性评估
   */
  private assessPathSensitivity(action: ProposedAction): RiskFactor {
    let maxScore = 0;
    let matchedReason = '无敏感路径';

    let targetPath = '';
    if (action.type === 'shell_cmd') {
      targetPath = (action.payload as unknown as ShellCmdPayload).command || '';
    } else if (action.type === 'tool_call') {
      const toolParams = action.payload as unknown as ToolCallPayload;
      const params = toolParams.parameters as Record<string, unknown>;
      if (params?.path) {
        targetPath = params.path as string;
      } else if (params?.file) {
        targetPath = params.file as string;
      }
    }

    for (const { pattern, risk, reason } of SENSITIVE_PATH_PATTERNS) {
      if (pattern.test(targetPath)) {
        const score = risk / 100;
        if (score > maxScore) {
          maxScore = score;
          matchedReason = reason;
        }
      }
    }

    return {
      name: 'path_sensitivity',
      weight: 0.2,
      score: maxScore,
      reason: matchedReason
    };
  }

  /**
   * 命令复杂度评估
   */
  private assessCommandComplexity(action: ProposedAction): RiskFactor {
    let score = 0;
    let reason = '简单命令';

    if (action.type === 'shell_cmd') {
      const command = (action.payload as unknown as ShellCmdPayload).command || '';

      // 管道数量
      const pipeCount = (command.match(/\|/g) || []).length;
      // 重定向数量
      const redirectCount = (command.match(/[>]/g) || []).length;
      // 命令替换数量
      const backtickCount = (command.match(/`/g) || []).length;
      // 逻辑操作符数量
      const logicCount = (command.match(/&&|\|\|/g) || []).length;

      const complexity = pipeCount + redirectCount + backtickCount + logicCount;

      if (complexity === 0) {
        score = 0.05;
        reason = '单条简单命令';
      } else if (complexity <= 2) {
        score = 0.15;
        reason = `中等复杂度 (${complexity} 个操作符)`;
      } else if (complexity <= 5) {
        score = 0.25;
        reason = `高复杂度 (${complexity} 个操作符)`;
      } else {
        score = 0.4;
        reason = `极高复杂度 (${complexity} 个操作符)`;
      }
    } else {
      score = 0.1;
      reason = '工具调用';
    }

    return {
      name: 'command_complexity',
      weight: 0.1,
      score,
      reason
    };
  }

  /**
   * 上下文风险评估
   */
  private assessContextualRisk(action: ProposedAction): RiskFactor {
    let score = 0;
    let reason = '无特殊上下文';

    // 检查风险等级标记
    if (action.payload?.risk_level === 'high') {
      score = 0.5;
      reason = '显式高风险标记';
    } else if (action.payload?.risk_level === 'medium') {
      score = 0.25;
      reason = '显式中风险标记';
    }

    // 检查推理中的风险指标
    if (action.reasoning) {
      const reasoning = action.reasoning.toLowerCase();

      if (reasoning.includes('delete') || reasoning.includes('remove')) {
        score = Math.max(score, 0.2);
        reason = '推理中包含删除操作';
      }
      if (reasoning.includes('overwrite') || reasoning.includes('replace')) {
        score = Math.max(score, 0.2);
        reason = '推理中包含覆盖操作';
      }
      if (reasoning.includes('sudo') || reasoning.includes('root')) {
        score = Math.max(score, 0.25);
        reason = '需要管理员权限';
      }
    }

    return {
      name: 'contextual_risk',
      weight: 0.15,
      score,
      reason
    };
  }

  /**
   * 确定风险等级
   */
  private determineLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  }

  /**
   * 确定建议操作
   */
  private determineAction(
    score: number,
    userTrust: number
  ): 'auto-allow' | 'human-review' | 'deny' {
    // 极高风险直接拒绝
    if (score >= 90) return 'deny';

    // 高风险需要人工审查（除非信任度极高）
    if (score >= 60) {
      return userTrust > 0.8 ? 'human-review' : 'deny';
    }

    // 中等风险根据信任度决定
    if (score >= 35) {
      return userTrust > 0.7 ? 'auto-allow' : 'human-review';
    }

    // 低风险自动允许
    return 'auto-allow';
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(factors: RiskFactor[]): number {
    // 基于因子数量和一致性计算置信度
    let consistency = 0;
    const scores = factors.map(f => f.score);

    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        consistency += 1 - Math.abs(scores[i] - scores[j]);
      }
    }

    const maxPairs = (scores.length * (scores.length - 1)) / 2;
    const normalizedConsistency = maxPairs > 0 ? consistency / maxPairs : 1;

    return Math.min(0.95, Math.max(0.5, normalizedConsistency));
  }

  /**
   * 获取用户信任度
   */
  private getUserTrust(userId?: string): number {
    if (!userId || !this.config.enableUserTrust) {
      return 0.5; // 默认中等信任
    }

    let trust = this.userTrustScores.get(userId) || 0.5;

    // 应用时间衰减
    const lastSeen = this.userLastSeen.get(userId) || Date.now();
    const daysSinceLastSeen = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
    const decayedTrust = trust * Math.pow(1 - this.config.trustDecayRate, daysSinceLastSeen);

    // 限制在合理范围内
    return Math.max(this.config.minTrust, Math.min(this.config.maxTrust, decayedTrust));
  }

  /**
   * 更新用户信任度
   */
  updateUserTrust(
    userId: string,
    outcome: 'success' | 'failure' | 'abuse',
    magnitude: number = 0.1
  ): void {
    if (!this.config.enableUserTrust) return;

    const currentTrust = this.userTrustScores.get(userId) || 0.5;

    let newTrust = currentTrust;
    switch (outcome) {
      case 'success':
        newTrust = Math.min(this.config.maxTrust, currentTrust + magnitude);
        break;
      case 'failure':
        newTrust = Math.max(this.config.minTrust, currentTrust - magnitude * 0.5);
        break;
      case 'abuse':
        newTrust = Math.max(this.config.minTrust, currentTrust - magnitude * 2);
        break;
    }

    this.userTrustScores.set(userId, newTrust);
    this.userLastSeen.set(userId, Date.now());
  }

  /**
   * 重置用户信任度
   */
  resetUserTrust(userId?: string): void {
    if (userId) {
      this.userTrustScores.delete(userId);
      this.userLastSeen.delete(userId);
    } else {
      this.userTrustScores.clear();
      this.userLastSeen.clear();
    }
  }

  /**
   * 获取信任度统计
   */
  getTrustStats(): Map<string, { trust: number; lastSeen: number }> {
    const stats = new Map();
    for (const [userId, trust] of this.userTrustScores) {
      const lastSeen = this.userLastSeen.get(userId) || Date.now();
      stats.set(userId, { trust, lastSeen });
    }
    return stats;
  }
}

// 默认单例
export const defaultRiskScoringModel = new RiskScoringModel();
