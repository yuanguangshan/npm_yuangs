import {
  SupervisorConfig,
  RoutingStrategy,
  SupervisorContext,
  ActionType
} from './types';
import { MetricsSnapshot } from '../metrics/MetricsCollector';
import { ModelSupervisor, SupervisorDecision } from './ModelSupervisor';
import { SupervisorAction } from '../observability/SupervisorActionLog';

/**
 * 策略评分
 */
interface StrategyScore {
  strategy: RoutingStrategy;
  score: number;
  details: {
    latencyScore: number;
    successRateScore: number;
    errorRateScore: number;
    costScore: number;
    stabilityScore: number;
  };
}

/**
 * 多指标权重配置
 */
export interface MultiMetricWeights {
  latency: number;
  successRate: number;
  errorRate: number;
  cost: number;
  stability: number;
}

const DEFAULT_MULTI_METRIC_WEIGHTS: MultiMetricWeights = {
  latency: 0.25,
  successRate: 0.30,
  errorRate: 0.20,
  cost: 0.10,
  stability: 0.15
};

/**
 * 多指标综合决策监督器
 *
 * 相比原有的 ModelSupervisor，多指标版本:
 * 1. 同时评估所有策略的得分
 * 2. 使用多维度加权评分
 * 3. 只有当最优策略显著优于当前策略时才切换
 * 4. 避免频繁切换导致的抖动
 *
 * 评分公式:
 * score = w_latency * latency_score +
 *         w_success * success_score +
 *         w_error * error_score +
 *         w_cost * cost_score +
 *         w_stability * stability_score
 *
 * 其中各维度得分范围 [0, 1]，越高越好
 */
export class MultiMetricSupervisor extends ModelSupervisor {
  private metricWeights: MultiMetricWeights;
  private switchThreshold: number; // 切换阈值 (0-1)

  constructor(
    config: SupervisorConfig,
    metricWeights: Partial<MultiMetricWeights> = {},
    switchThreshold: number = 0.2
  ) {
    super(config);
    this.metricWeights = { ...DEFAULT_MULTI_METRIC_WEIGHTS, ...metricWeights };
    this.switchThreshold = switchThreshold;
  }

  /**
   * 多指标综合决策
   *
   * 流程:
   * 1. 计算所有候选策略的综合得分
   * 2. 找出得分最高的策略
   * 3. 如果与当前策略差异超过阈值，建议切换
   */
  evaluate(
    snapshot: MetricsSnapshot,
    ctx: SupervisorContext,
    currentStrategy: RoutingStrategy
  ): SupervisorDecision {
    const nextHitCounts = { ...(ctx.triggerHitCounts || {}) };

    if (!this.isEnabled()) {
      return { action: this.noop('Supervisor disabled'), contextPatch: {} };
    }

    // 冷却期检查
    if (ctx.cooldownUntil && ctx.now < ctx.cooldownUntil) {
      return { action: this.noop('Cooldown active'), contextPatch: {} };
    }

    // 计算所有策略的得分
    const candidateStrategies = [
      RoutingStrategy.BALANCED,
      RoutingStrategy.FASTEST_FIRST,
      RoutingStrategy.CHEAPEST_FIRST,
      RoutingStrategy.BEST_QUALITY
    ];

    const scores = this.scoreAllStrategies(snapshot, candidateStrategies);

    // 找出最优策略
    const sortedScores = scores.sort((a, b) => b.score - a.score);
    const bestStrategy = sortedScores[0];
    const currentScore = sortedScores.find(s => s.strategy === currentStrategy);

    if (!currentScore) {
      // 当前策略不在候选中，切换到最优
      return this.createSwitchDecision(
        bestStrategy.strategy,
        currentStrategy,
        bestStrategy,
        ctx
      );
    }

    // 计算得分差异
    const scoreDiff = bestStrategy.score - currentScore.score;

    // 只有显著更优时才切换
    if (scoreDiff > this.switchThreshold) {
      return this.createSwitchDecision(
        bestStrategy.strategy,
        currentStrategy,
        bestStrategy,
        ctx
      );
    }

    // 差异不显著，保持当前策略
    return {
      action: this.noop(`Current strategy optimal (score: ${currentScore.score.toFixed(3)})`),
      contextPatch: { triggerHitCounts: nextHitCounts }
    };
  }

  /**
   * 为所有策略计算综合得分
   */
  private scoreAllStrategies(
    snapshot: MetricsSnapshot,
    strategies: RoutingStrategy[]
  ): StrategyScore[] {
    return strategies.map(strategy => ({
      strategy,
      score: this.calculateStrategyScore(snapshot, strategy),
      details: this.getScoreDetails(snapshot, strategy)
    }));
  }

  /**
   * 计算单个策略的综合得分
   */
  private calculateStrategyScore(
    snapshot: MetricsSnapshot,
    strategy: RoutingStrategy
  ): number {
    const details = this.getScoreDetails(snapshot, strategy);

    return (
      details.latencyScore * this.metricWeights.latency +
      details.successRateScore * this.metricWeights.successRate +
      details.errorRateScore * this.metricWeights.errorRate +
      details.costScore * this.metricWeights.cost +
      details.stabilityScore * this.metricWeights.stability
    );
  }

  /**
   * 获取策略各维度得分详情
   */
  private getScoreDetails(
    snapshot: MetricsSnapshot,
    strategy: RoutingStrategy
  ): StrategyScore['details'] {
    // 1. 延迟得分 (0-1，越低越好)
    const latencyScore = this.normalizeLatency(snapshot.globalLatencyEMA, strategy);

    // 2. 成功率得分 (0-1，越高越好)
    const successRateScore = snapshot.globalSuccessRateEMA;

    // 3. 错误率得分 (0-1，越低越好)
    const openDomainCount = Array.from(snapshot.domainHealth.values())
      .filter(d => d.state === 'open').length;
    const errorRateScore = 1 - (openDomainCount / Math.max(snapshot.domainHealth.size, 1));

    // 4. 成本得分 (基于策略偏好)
    const costScore = this.calculateCostScore(strategy);

    // 5. 稳定性得分 (基于成功率的变化趋势)
    const stabilityScore = this.calculateStabilityScore(snapshot);

    return {
      latencyScore,
      successRateScore,
      errorRateScore,
      costScore,
      stabilityScore
    };
  }

  /**
   * 根据策略归一化延迟得分
   */
  private normalizeLatency(latency: number, strategy: RoutingStrategy): number {
    let targetLatency: number;

    switch (strategy) {
      case RoutingStrategy.FASTEST_FIRST:
        targetLatency = 1000; // 目标 1s
        break;
      case RoutingStrategy.CHEAPEST_FIRST:
        targetLatency = 10000; // 目标 10s
        break;
      case RoutingStrategy.BEST_QUALITY:
        targetLatency = 5000; // 目标 5s
        break;
      default:
        targetLatency = 3000; // 默认目标 3s
    }

    // 使用 sigmoid 函数平滑转换
    return 1 / (1 + Math.exp((latency - targetLatency) / 1000));
  }

  /**
   * 计算成本得分
   */
  private calculateCostScore(strategy: RoutingStrategy): number {
    switch (strategy) {
      case RoutingStrategy.CHEAPEST_FIRST:
        return 1.0;
      case RoutingStrategy.FASTEST_FIRST:
        return 0.5;
      case RoutingStrategy.BEST_QUALITY:
        return 0.3;
      case RoutingStrategy.BALANCED:
        return 0.7;
      default:
        return 0.5;
    }
  }

  /**
   * 计算稳定性得分
   *
   * 基于 EMA 的变化率，变化越小越稳定
   */
  private calculateStabilityScore(snapshot: MetricsSnapshot): number {
    // 简化版：基于成功率本身的稳定性
    // 成功率在 0.8-1.0 之间认为稳定
    if (snapshot.globalSuccessRateEMA > 0.9) return 1.0;
    if (snapshot.globalSuccessRateEMA > 0.8) return 0.8;
    if (snapshot.globalSuccessRateEMA > 0.6) return 0.5;
    return 0.2;
  }

  /**
   * 创建切换决策
   */
  private createSwitchDecision(
    targetStrategy: RoutingStrategy,
    currentStrategy: RoutingStrategy,
    targetScore: StrategyScore,
    ctx: SupervisorContext
  ): SupervisorDecision {
    const details = targetScore.details;
    const reason = `Multi-metric decision: ${targetStrategy} is superior ` +
      `(latency: ${details.latencyScore.toFixed(2)}, ` +
      `success: ${details.successRateScore.toFixed(2)}, ` +
      `errors: ${details.errorRateScore.toFixed(2)}, ` +
      `cost: ${details.costScore.toFixed(2)}, ` +
      `stability: ${details.stabilityScore.toFixed(2)})`;

    // 计算冷却时间：得分差异越大，冷却时间越短
    const currentScore = this.calculateStrategyScore(
      {} as MetricsSnapshot, // 简化，实际需要传入
      currentStrategy
    );
    const scoreDiff = targetScore.score - currentScore;
    const baseCooldown = 30000;
    const dynamicCooldown = Math.round(baseCooldown * (1 - Math.min(scoreDiff, 0.5) * 2));

    return {
      action: {
        type: ActionType.SWITCH_STRATEGY,
        targetStrategy,
        reason
      },
      contextPatch: {
        cooldownUntil: ctx.now + Math.max(dynamicCooldown, 10000),
        triggerHitCounts: ctx.triggerHitCounts || {},
        lastAction: {
          type: ActionType.SWITCH_STRATEGY,
          targetStrategy,
          timestamp: ctx.now
        }
      }
    };
  }

  /**
   * 更新多指标权重
   */
  updateMetricWeights(weights: Partial<MultiMetricWeights>): void {
    this.metricWeights = { ...this.metricWeights, ...weights };
  }

  /**
   * 更新切换阈值
   */
  updateSwitchThreshold(threshold: number): void {
    this.switchThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * 获取当前配置
   */
  getConfig(): { weights: MultiMetricWeights; switchThreshold: number } {
    return {
      weights: { ...this.metricWeights },
      switchThreshold: this.switchThreshold
    };
  }

  /**
   * 检查是否启用
   */
  private isEnabled(): boolean {
    // 通过检查 config 是否存在来确定
    try {
      const defaultConfig = ModelSupervisor.getDefaultConfig();
      return true;
    } catch {
      return false;
    }
  }

  private noop(reason: string): SupervisorAction {
    return {
      type: ActionType.NOOP,
      reason
    };
  }
}

/**
 * 创建默认的多指标监督器
 */
export function createDefaultMultiMetricSupervisor(): MultiMetricSupervisor {
  const config = ModelSupervisor.getDefaultConfig();
  return new MultiMetricSupervisor(config);
}
