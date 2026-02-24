import { RoutingStrategy } from './types';

/**
 * 执行结果，用于学习
 */
export interface ExecutionOutcome {
  success: boolean;
  executionTime: number;
  costLevel: number;
  timestamp: number;
  strategy: RoutingStrategy;
  modelName: string;
}

/**
 * 权重配置
 */
export interface WeightConfig {
  taskMatch?: number;
  context?: number;
  latency?: number;
  cost?: number;
  history?: number;
  quality?: number;
}

/**
 * 权重历史记录
 */
interface WeightSnapshot {
  weights: WeightConfig;
  timestamp: number;
  outcomeCount: number;
}

/**
 * 学习超参数配置
 */
export interface LearningConfig {
  /** 学习率 (0-1)，默认 0.1 */
  learningRate: number;
  /** 最小样本数才开始学习，默认 10 */
  minSamples: number;
  /** 历史窗口大小，默认 100 */
  historyWindow: number;
  /** 权重衰减因子，防止权重无限增长，默认 0.01 */
  weightDecay: number;
  /** 奖励归一化因子 */
  rewardNormalization: {
    latency: number;    // 延迟奖励归一化 (ms)
    cost: number;       // 成本奖励归一化 (cost level)
  };
}

const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  learningRate: 0.1,
  minSamples: 10,
  historyWindow: 100,
  weightDecay: 0.01,
  rewardNormalization: {
    latency: 5000,   // 5秒作为基准
    cost: 3          // cost level 3 作为基准
  }
};

/**
 * 自适应权重学习系统
 *
 * 使用强化学习思想，根据执行结果动态调整策略权重
 *
 * 核心算法:
 * 1. 收集执行结果
 * 2. 计算奖励函数 (综合考虑延迟、成本、成功率)
 * 3. 使用梯度上升更新权重
 * 4. 应用权重衰减防止过拟合
 *
 * 奖励函数设计:
 * reward = w_latency * (-latency/normalize) +
 *          w_cost * (-cost/normalize) +
 *          w_success * (success ? 1 : -1)
 */
export class AdaptiveWeights {
  private weightsHistory: Map<RoutingStrategy, WeightSnapshot[]> = new Map();
  private outcomeHistory: Map<RoutingStrategy, ExecutionOutcome[]> = new Map();
  private currentWeights: Map<RoutingStrategy, WeightConfig> = new Map();
  private config: LearningConfig;

  // 默认权重配置 (与 DslPolicy 保持一致)
  private readonly DEFAULT_WEIGHTS: Partial<Record<RoutingStrategy, WeightConfig>> = {
    [RoutingStrategy.AUTO]: {
      taskMatch: 0.4,
      context: 0.2,
      latency: 0.2,
      cost: 0.1,
      history: 0.1
    },
    [RoutingStrategy.FASTEST_FIRST]: {
      taskMatch: 0.2,
      context: 0.0,
      latency: 0.7,
      cost: 0.0,
      history: 0.1
    },
    [RoutingStrategy.CHEAPEST_FIRST]: {
      taskMatch: 0.2,
      context: 0.0,
      latency: 0.0,
      cost: 0.7,
      history: 0.1
    },
    [RoutingStrategy.BEST_QUALITY]: {
      taskMatch: 0.2,
      context: 0.0,
      latency: 0.0,
      cost: 0.0,
      history: 0.2,
      quality: 0.6
    },
    [RoutingStrategy.MANUAL]: {
      taskMatch: 1.0,
      context: 0.0,
      latency: 0.0,
      cost: 0.0,
      history: 0.0
    },
    [RoutingStrategy.ROUND_ROBIN]: {
      taskMatch: 1.0,
      context: 0.0,
      latency: 0.0,
      cost: 0.0,
      history: 0.0
    }
  };

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };

    // 初始化所有策略的权重
    for (const strategy of Object.keys(this.DEFAULT_WEIGHTS)) {
      const strategyKey = strategy as RoutingStrategy;
      this.currentWeights.set(strategyKey, { ...this.DEFAULT_WEIGHTS[strategyKey] });
      this.weightsHistory.set(strategyKey, []);
      this.outcomeHistory.set(strategyKey, []);
    }
  }

  /**
   * 记录执行结果
   */
  recordOutcome(outcome: ExecutionOutcome): void {
    const strategy = outcome.strategy;
    const history = this.outcomeHistory.get(strategy);

    if (!history) return;

    history.push(outcome);

    // 限制历史窗口大小
    if (history.length > this.config.historyWindow) {
      history.shift();
    }

    // 达到最小样本数后触发学习
    if (history.length >= this.config.minSamples) {
      this.updateWeights(strategy);
    }
  }

  /**
   * 获取当前策略权重
   */
  getWeights(strategy: RoutingStrategy): WeightConfig {
    return { ...this.currentWeights.get(strategy) || this.DEFAULT_WEIGHTS[strategy] };
  }

  /**
   * 获取权重历史
   */
  getWeightHistory(strategy: RoutingStrategy): WeightSnapshot[] {
    return [...this.weightsHistory.get(strategy) || []];
  }

  /**
   * 核心权重更新算法 (梯度上升)
   *
   * 对于每个权重维度:
   * new_weight = old_weight + learning_rate * reward_gradient
   *
   * 奖励梯度计算:
   * - 延迟权重: 如果延迟低，增加延迟权重
   * - 成本权重: 如果成本低，增加成本权重
   * - 历史权重: 如果成功，增加历史权重
   */
  private updateWeights(strategy: RoutingStrategy): void {
    const history = this.outcomeHistory.get(strategy);
    if (!history || history.length < this.config.minSamples) return;

    const currentWeights = this.currentWeights.get(strategy);
    if (!currentWeights) return;

    // 计算最近一批结果的平均奖励
    const recentOutcomes = history.slice(-this.config.minSamples);
    const avgReward = this.calculateAverageReward(recentOutcomes);

    // 计算每个维度的梯度
    const gradients = this.calculateGradients(recentOutcomes, currentWeights);

    // 梯度上升更新权重
    const newWeights: WeightConfig = { ...currentWeights };
    let totalWeight = 0;

    for (const [key, gradient] of Object.entries(gradients)) {
      if (key === 'quality') continue; // quality 权重固定不学习

      const oldValue = (currentWeights as any)[key] as number;
      const weightDecay = oldValue * this.config.weightDecay;

      // new_weight = old_weight + lr * gradient - decay
      let newValue = oldValue + this.config.learningRate * gradient - weightDecay;

      // 确保权重非负
      newValue = Math.max(0, newValue);
      (newWeights as any)[key] = newValue;
      totalWeight += newValue;
    }

    // 归一化权重 (使总和为 1)
    if (totalWeight > 0) {
      for (const key of Object.keys(newWeights)) {
        if (key === 'quality') continue;
        const value = (newWeights as any)[key];
        if (typeof value === 'number') {
          (newWeights as any)[key] = value / totalWeight;
        }
      }
    }

    // 保存权重快照
    const snapshot: WeightSnapshot = {
      weights: { ...currentWeights },
      timestamp: Date.now(),
      outcomeCount: history.length
    };

    const weightHistory = this.weightsHistory.get(strategy);
    if (weightHistory) {
      weightHistory.push(snapshot);
      if (weightHistory.length > this.config.historyWindow) {
        weightHistory.shift();
      }
    }

    // 应用新权重
    this.currentWeights.set(strategy, newWeights);

    // 如果改进显著，记录日志
    const improvement = avgReward - this.calculateAverageReward(history.slice(-2 * this.config.minSamples, -this.config.minSamples));
    if (improvement > 0.1) {
      console.log(`[AdaptiveWeights] Strategy ${strategy} improved by ${improvement.toFixed(3)}`);
      console.log(`[AdaptiveWeights] New weights:`, JSON.stringify(newWeights, null, 2));
    }
  }

  /**
   * 计算平均奖励
   */
  private calculateAverageReward(outcomes: ExecutionOutcome[]): number {
    if (outcomes.length === 0) return 0;

    const sum = outcomes.reduce((acc, outcome) => acc + this.calculateReward(outcome), 0);
    return sum / outcomes.length;
  }

  /**
   * 计算单个执行的奖励
   *
   * 奖励函数:
   * reward = -0.4 * (latency / normalize_latency)
   *          -0.3 * (cost / normalize_cost)
   *          +0.3 * (success ? 1 : -1)
   */
  private calculateReward(outcome: ExecutionOutcome): number {
    const norm = this.config.rewardNormalization;

    // 延迟惩罚: 越快越好
    const latencyScore = -0.4 * (outcome.executionTime / norm.latency);

    // 成本惩罚: 越便宜越好
    const costScore = -0.3 * (outcome.costLevel / norm.cost);

    // 成功奖励
    const successScore = 0.3 * (outcome.success ? 1 : -1);

    return latencyScore + costScore + successScore;
  }

  /**
   * 计算每个权重维度的梯度
   *
   * 梯度表示: 该权重的增加对奖励的正向影响程度
   */
  private calculateGradients(outcomes: ExecutionOutcome[], _weights: WeightConfig): Record<string, number> {
    const gradients: Record<string, number> = {};

    // 延迟梯度: 延迟越低，延迟权重应该越高
    const avgLatency = outcomes.reduce((sum, o) => sum + o.executionTime, 0) / outcomes.length;
    const latencyGradient = -(avgLatency / this.config.rewardNormalization.latency) * 2;
    gradients.latency = latencyGradient;

    // 成本梯度: 成本越低，成本权重应该越高
    const avgCost = outcomes.reduce((sum, o) => sum + o.costLevel, 0) / outcomes.length;
    const costGradient = -(avgCost / this.config.rewardNormalization.cost) * 2;
    gradients.cost = costGradient;

    // 历史梯度: 成功率越高，历史权重应该越高
    const successRate = outcomes.filter(o => o.success).length / outcomes.length;
    const historyGradient = (successRate - 0.5) * 2;
    gradients.history = historyGradient;

    // 任务匹配梯度: 保持高权重
    gradients.taskMatch = 0.1;

    // 上下文梯度: 根据策略调整
    gradients.context = 0.05;

    return gradients;
  }

  /**
   * 重置权重为默认值
   */
  reset(strategy?: RoutingStrategy): void {
    if (strategy) {
      this.currentWeights.set(strategy, { ...this.DEFAULT_WEIGHTS[strategy] });
      this.outcomeHistory.set(strategy, []);
      this.weightsHistory.set(strategy, []);
    } else {
      for (const s of Object.keys(this.DEFAULT_WEIGHTS)) {
        const strategyKey = s as RoutingStrategy;
        this.currentWeights.set(strategyKey, { ...this.DEFAULT_WEIGHTS[strategyKey] });
        this.outcomeHistory.set(strategyKey, []);
        this.weightsHistory.set(strategyKey, []);
      }
    }
  }

  /**
   * 获取学习统计信息
   */
  getStats(): Record<string, {
    currentWeights: WeightConfig;
    sampleCount: number;
    avgReward: number;
    improvement: number;
  }> {
    const stats: Record<string, any> = {};

    for (const strategy of Object.keys(this.DEFAULT_WEIGHTS)) {
      const strategyKey = strategy as RoutingStrategy;
      const history = this.outcomeHistory.get(strategyKey);
      const weightHistory = this.weightsHistory.get(strategyKey);

      stats[strategy] = {
        currentWeights: this.currentWeights.get(strategyKey),
        sampleCount: history?.length || 0,
        avgReward: history && history.length > 0 ? this.calculateAverageReward(history) : 0,
        improvement: this.calculateImprovement(weightHistory || [])
      };
    }

    return stats;
  }

  /**
   * 计算权重改进幅度
   */
  private calculateImprovement(history: WeightSnapshot[]): number {
    if (history.length < 2) return 0;

    const latest = history[history.length - 1].weights;
    const earliest = history[0].weights;

    // 计算权重变化幅度
    let change = 0;
    for (const key of Object.keys(latest)) {
      const latestValue = (latest as any)[key];
      const earliestValue = (earliest as any)[key];
      change += Math.abs(latestValue - earliestValue);
    }

    return change;
  }
}
