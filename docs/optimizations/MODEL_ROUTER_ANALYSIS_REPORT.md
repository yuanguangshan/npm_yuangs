# 模型路由系统 - 功能分析报告

## 1. 系统架构概述

### 1.1 设计理念

yuangs 模型路由系统采用**策略引擎架构**,将系统分为三个核心面:

1. **控制面 (Control Plane)**: 负责决策和策略配置
2. **执行面 (Execution Plane)**: 负责任务执行和模型调用
3. **观测面 (Observability Plane)**: 负责指标收集和系统监控

```
┌─────────────────────────────────────────────────────────┐
│                    控制面                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  策略引擎     │  │  监督器       │  │  配置管理     │ │
│  │  (Policies)  │  │(Supervisor) │  │  (Config)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   执行面                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │              ModelRouter                          │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │Gate过滤 │→ │策略评分  │→ │探索机制       │    │  │
│  │  └─────────┘  └──────────┘  └──────────────┘    │  │
│  │                                                 │  │
│  │  ┌────────────────────────────────────┐       │  │
│  │  │     适配器层        │       │  │
│  │  │  Google  │  Qwen  │  Codebuddy │       │  │
│  │  └────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 观测面                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 指标收集器    │  │  熔断器       │  │  日志记录     │ │
│  │(Metrics)     │  │(CircuitBreak)│  │   (Logger)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

| 组件 | 位置 | 职责 |
|------|------|------|
| **ModelRouter** | `src/core/modelRouter/ModelRouter.ts` | 执行面核心,负责路由和执行 |
| **RoutingPolicy** | `src/core/modelRouter/policies/` | 策略接口和实现 |
| **ModelSupervisor** | `src/core/modelRouter/ModelSupervisor.ts` | 监督器,自动决策 |
| **MetricsCollector** | `src/core/metrics/MetricsCollector.ts` | 指标收集 |
| **BaseAdapter** | `src/core/modelRouter/BaseAdapter.ts` | 适配器基类 |
| **ConfigManager** | `src/core/modelRouter/config.ts` | 配置管理 |

---

## 2. 实现原理深度分析

### 2.1 适配器模式

适配器模式是系统的基础,通过统一的 `ModelAdapter` 接口封装不同 AI CLI 工具。

**核心接口定义** (`src/core/modelRouter/types.ts:93-121`):

```typescript
export interface ModelAdapter {
  name: string;                    // 适配器名称
  version: string;                  // 适配器版本
  provider: string;                // 提供者
  capabilities: ModelCapabilities;  // 能力描述
  failureDomain?: string;          // 故障域(用于熔断)

  isAvailable(): Promise<boolean>; // 是否可用
  execute(prompt, config, onChunk): Promise<ModelExecutionResult>;
  healthCheck(): Promise<boolean>; // 健康检查
}
```

**能力描述** (`src/core/modelRouter/types.ts:54-67`):

```typescript
export interface ModelCapabilities {
  supportedTaskTypes: TaskType[];  // 支持的任务类型
  maxContextWindow: number;        // 最大上下文窗口
  avgResponseTime: number;         // 平均响应时间
  costLevel: number;               // 成本等级(1-5)
  supportsStreaming: boolean;      // 是否支持流式输出
  specialCapabilities?: string[];  // 特殊能力
}
```

**实现示例** - GoogleAdapter (`src/core/modelRouter/adapters/GoogleAdapter.ts`):

```typescript
export class GoogleAdapter extends BaseAdapter {
  name = 'google-gemini';
  version = '1.0.0';
  provider = 'Google';
  failureDomain = 'google';  // 指定故障域

  capabilities: ModelCapabilities = {
    supportedTaskTypes: [...],
    maxContextWindow: 1000000,
    avgResponseTime: 2000,
    costLevel: 2,
    supportsStreaming: true,
    specialCapabilities: ['long-context', 'multimodal'],
  };

  async execute(prompt, config, onChunk) {
    // 1. 选择合适的模型
    const model = this.selectModel(config.type);

    // 2. 构建参数
    const args = [prompt, '--model', model, '--output-format', 'json'];

    // 3. 执行命令(支持流式输出)
    const { stdout, stderr } = await this.runSpawnCommand(
      'gemini', args, config.expectedResponseTime || 60000, onChunk
    );

    // 4. 解析输出
    return this.parseGeminiOutput(stdout);
  }
}
```

**BaseAdapter 提供的功能** (`src/core/modelRouter/BaseAdapter.ts`):

1. **命令执行**: `runSpawnCommand()` - 封装 `spawn` API,支持超时和流式输出
2. **上下文管理**: `buildPromptWithContext()`, `saveToContext()`
3. **错误处理**: `createSuccessResult()`, `createErrorResult()`
4. **输出解析**: `extractJsonContent()` - 处理 CLI 输出中的干扰日志

### 2.2 DSL 策略引擎

系统使用 DSL(Domain-Specific Language)驱动策略配置,实现灵活的路由决策。

**策略 DSL 定义** (`src/core/modelRouter/types.ts:279-288`):

```typescript
export interface PolicyDsl {
  name: string;
  description: string;
  gate?: {                        // Gate: 硬约束过滤
    minContext?: number;          // 最小上下文要求
    requireStreaming?: boolean;   // 是否需要流式输出
    requiredCapabilities?: string[]; // 必需的特殊能力
  };
  weights: PolicyWeights;         // Weights: 加权评分
}
```

**权重配置** (`src/core/modelRouter/types.ts:267-274`):

```typescript
export interface PolicyWeights {
  taskMatch?: number;   // 任务匹配度
  context?: number;     // 上下文富余度
  latency?: number;     // 延迟性能
  cost?: number;        // 成本效益
  history?: number;     // 历史成功率
  quality?: number;     // 质量专家
}
```

**DslPolicy 实现** (`src/core/modelRouter/policies/DslPolicy.ts`):

```typescript
export class DslPolicy extends BasePolicy {
  protected async gate(adapters, task, modelStats, domainHealthMap) {
    let filtered = await super.gate(adapters, task, modelStats, domainHealthMap);

    const gateConfig = this.dsl.gate;
    if (!gateConfig) return filtered;

    return filtered.filter(adapter => {
      // 1. 最小上下文阈值
      if (gateConfig.minContext &&
          adapter.capabilities.maxContextWindow < gateConfig.minContext) {
        return false;
      }

      // 2. 流式输出要求
      if (gateConfig.requireStreaming &&
          !adapter.capabilities.supportsStreaming) {
        return false;
      }

      // 3. 特殊能力要求
      if (gateConfig.requiredCapabilities) {
        const hasAll = gateConfig.requiredCapabilities.every(req =>
          adapter.capabilities.specialCapabilities?.includes(req)
        );
        if (!hasAll) return false;
      }

      return true;
    });
  }

  protected score(adapters, task, config, modelStats) {
    return adapters.map(adapter => {
      let totalScore = 0;
      let reasons = [];

      // 1. 任务匹配度
      if (weights.taskMatch) {
        const isSupported = adapter.capabilities.supportedTaskTypes.includes(task.type);
        totalScore += (isSupported ? 1.0 : 0.0) * weights.taskMatch;
      }

      // 2. 上下文富余度
      if (weights.context) {
        const ratio = Math.min(
          adapter.capabilities.maxContextWindow / Math.max(requested * 2, 8000),
          1.0
        );
        totalScore += ratio * weights.context;
      }

      // 3. 延迟性能 (归一化: <1s→1.0, >10s→0.0)
      if (weights.latency) {
        const score = Math.max(0, 1 - (latency / 10000));
        totalScore += score * weights.latency;
      }

      // 4. 成本效益 (等级1→1.0, 等级5→0.2)
      if (weights.cost) {
        const score = (6 - costLevel) * 0.2;
        totalScore += score * weights.cost;
      }

      // 5. 历史成功率
      if (weights.history) {
        const stats = modelStats.get(adapter.name);
        const score = stats ? stats.successCount / stats.totalRequests : 0.5;
        totalScore += score * weights.history;
      }

      // 6. 质量专家
      if (weights.quality) {
        let score = 0.5;
        const isSpecialist = (
          (task.type === TaskType.CODE_GENERATION || task.type === TaskType.DEBUG) &&
          adapter.capabilities.specialCapabilities?.includes('code-expert')
        );
        if (isSpecialist) score = 1.0;
        totalScore += score * weights.quality;
      }

      return { adapter, score: totalScore, reason: reasons.join('; ') };
    });
  }
}
```

**预定义策略** (`src/core/modelRouter/ModelRouter.ts:50-75`):

```typescript
private registerDefaultPolicies() {
  this.registerPolicy(new DslPolicy({
    name: 'balanced',
    description: '均衡策略',
    weights: { taskMatch: 0.4, context: 0.2, latency: 0.2, cost: 0.1, history: 0.1 }
  }));

  this.registerPolicy(new DslPolicy({
    name: 'cost-saving',
    description: '成本优先',
    weights: { cost: 0.7, taskMatch: 0.2, history: 0.1 }
  }));

  this.registerPolicy(new DslPolicy({
    name: 'latency-critical',
    description: '追求极致响应速度',
    weights: { latency: 0.7, taskMatch: 0.2, history: 0.1 }
  }));

  this.registerPolicy(new DslPolicy({
    name: 'quality-first',
    description: '高复杂度任务优先',
    gate: { minContext: 32000 },
    weights: { quality: 0.6, history: 0.2, taskMatch: 0.2 }
  }));
}
```

### 2.3 监督器自动决策

监督器基于系统指标自动调整路由策略,实现自适应优化。

**监督器配置** (`src/core/modelRouter/types.ts:292-310`):

```typescript
export interface SupervisorTrigger {
  id: string;
  metric: 'global_latency' | 'global_success_rate' | 'google_domain_error';
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
  action: {
    type: 'switch_strategy';
    targetStrategy: RoutingStrategy;
  };
}

export interface SupervisorConfig {
  enabled: boolean;
  triggers: SupervisorTrigger[];
}
```

**默认配置** (`src/core/modelRouter/ModelSupervisor.ts:74-100`):

```typescript
static getDefaultConfig(): SupervisorConfig {
  return {
    enabled: true,
    triggers: [
      {
        id: 'high_latency_circuit_breaker',
        metric: 'global_latency',
        operator: '>',
        threshold: 5000,
        action: {
          type: 'switch_strategy',
          targetStrategy: RoutingStrategy.FASTEST_FIRST
        }
      },
      {
        id: 'severe_success_rate_drop',
        metric: 'global_success_rate',
        operator: '<',
        threshold: 0.5,
        action: {
          type: 'switch_strategy',
          targetStrategy: RoutingStrategy.CHEAPEST_FIRST
        }
      }
    ]
  };
}
```

**监督器评估逻辑** (`src/core/modelRouter/ModelSupervisor.ts:22-59`):

```typescript
evaluate(snapshot, currentStrategy): SupervisorAction | null {
  if (!this.config.enabled) return null;

  const { globalLatencyEMA, globalSuccessRateEMA, domainHealth } = snapshot;

  for (const trigger of this.config.triggers) {
    let metricValue = 0;

    switch (trigger.metric) {
      case 'global_latency':
        metricValue = globalLatencyEMA;
        break;
      case 'global_success_rate':
        metricValue = globalSuccessRateEMA;
        break;
      case 'google_domain_error':
        const googleHealth = domainHealth.get('google');
        metricValue = (googleHealth?.state === 'open') ? 1 : 0;
        break;
    }

    if (this.checkCondition(metricValue, trigger.operator, trigger.threshold)) {
      // 避免重复切换
      if (currentStrategy === trigger.action.targetStrategy) continue;

      return {
        type: 'switch_strategy',
        targetStrategy: trigger.action.targetStrategy,
        reason: `Trigger[${trigger.id}] fired: ${trigger.metric}(${metricValue.toFixed(2)}) ${trigger.operator} ${trigger.threshold}`
      };
    }
  }

  return null;
}
```

**监督器介入示例** (`src/core/modelRouter/ModelRouter.ts:136-182`):

```typescript
// 1. 更新系统状态(熔断器状态)
this.updateDomainHealthStates();

// 2. 获取指标快照
const snapshot = this.metrics.snapshot(this.domainHealth);

// 3. 监督器评估
const action = this.supervisor.evaluate(snapshot, routingConfig.strategy);

if (action && action.type === 'switch_strategy') {
  const previous = activeStrategy;
  activeStrategy = action.targetStrategy;
  supervisorNote = ` [监督器干预: ${action.reason}]`;

  // 记录结构化日志
  this.supervisorLogger.log({
    eventId: crypto.randomUUID(),
    timestamp: Date.now(),
    action,
    previousStrategy: previous,
    currentStrategy: activeStrategy,
    snapshot: { /* ... */ }
  });
}
```

### 2.4 熔断器机制

系统实现故障域级别的熔断保护,防止级联故障。

**故障域状态** (`src/core/modelRouter/types.ts:227-236`):

```typescript
export type DomainState = 'closed' | 'open' | 'half-open';

export interface DomainHealth {
  state: DomainState;
  openedAt?: number;      // 进入 Open 状态的时间
  lastProbeAt?: number;   // 最后一次探测时间
}
```

**状态转换逻辑** (`src/core/modelRouter/ModelRouter.ts:310-344`):

```typescript
private updateDomainHealthStates() {
  const now = Date.now();
  const adapters = this.getAdapters();
  const domains = new Set(adapters.map(a => a.failureDomain ?? a.provider));

  for (const domain of domains) {
    let health = this.domainHealth.get(domain);
    if (!health) {
      health = { state: 'closed' };
      this.domainHealth.set(domain, health);
    }

    // 判断域是否不稳定
    const domainAdapters = adapters.filter(a =>
      (a.failureDomain ?? a.provider) === domain
    );
    const isUnstable = domainAdapters.some(a => {
      const s = this.metrics.getStats(a.name);
      return s && (s.recentFailures >= 3 || s.successEMA < 0.4);
    });

    const isStable = domainAdapters.every(a => {
      const s = this.metrics.getStats(a.name);
      return s && s.successEMA > 0.85;
    });

    // Closed → Open: 不稳定时触发熔断
    if (health.state === 'closed' && isUnstable) {
      health.state = 'open';
      health.openedAt = now;
      console.warn(`🚨 故障域 [${domain}] 表现极差或连续错误,已触发熔断拦截 (Open)`);
    }

    // Open → Half-Open: 30秒后尝试恢复
    else if (health.state === 'open' && now - (health.openedAt || 0) > 30000) {
      health.state = 'half-open';
      console.log(`📡 故障域 [${domain}] 进入半探测模式 (Half-Open)`);
    }

    // Half-Open → Closed: 稳定则完全恢复
    else if (health.state === 'half-open' && isStable) {
      health.state = 'closed';
      console.log(`✅ 故障域 [${domain}] EMA 指标已恢复,熔断状态重置 (Closed)`);
    }
  }
}
```

**熔断检查** (`src/core/modelRouter/ModelRouter.ts:347-354`):

```typescript
private isAdapterAllowedByCircuitBreaker(adapter): boolean {
  const domain = adapter.failureDomain ?? adapter.provider;
  const health = this.domainHealth.get(domain);
  if (!health || health.state === 'closed') return true;
  if (health.state === 'open') return false;
  if (health.state === 'half-open') return Math.random() < 0.1;  // 10% 探测流量
  return true;
}
```

### 2.5 指标收集

系统使用 EMA(指数移动平均)实现平滑的指标跟踪。

**指标收集器** (`src/core/metrics/MetricsCollector.ts:40-95`):

```typescript
export class DefaultMetricsCollector implements MetricsCollector {
  private stats: Map<string, ModelStats> = new Map();
  private globalLatencyEMA: number = 1000;
  private globalSuccessRateEMA: number = 1.0;

  recordRequest(adapterName, domain, latencyMs, success, costLevel) {
    let s = this.stats.get(adapterName);
    if (!s) {
      s = { /* 初始化统计对象 */ };
      this.stats.set(adapterName, s);
    }

    s.totalRequests++;
    s.lastUsed = new Date();

    // 动态 α = 1 / sqrt(N),早期学习快,后期稳定
    const alpha = Math.max(0.05, Math.min(0.3, 1 / Math.sqrt(s.totalRequests)));

    if (success) {
      s.successCount++;
      s.recentFailures = 0;
      s.successEMA = (1 - alpha) * s.successEMA + alpha * 1;
      s.latencyEMA = (1 - alpha) * s.latencyEMA + alpha * latencyMs;
      s.costEMA = (1 - alpha) * s.costEMA + alpha * costLevel;
    } else {
      s.failureCount++;
      s.recentFailures++;
      s.successEMA = (1 - alpha) * s.successEMA + alpha * 0;
      s.lastFailureAt = new Date();
    }

    // 更新全局 EMA
    this.globalLatencyEMA = (1 - alpha) * this.globalLatencyEMA + alpha * latencyMs;
    this.globalSuccessRateEMA = (1 - alpha) * this.globalSuccessRateEMA + alpha * (success ? 1 : 0);

    // 更新累积平均值
    s.avgResponseTime = (s.avgResponseTime * (s.totalRequests - 1) + latencyMs) / s.totalRequests;
  }
}
```

**EMA 优势:**
- 平滑噪声,避免瞬时波动
- 动态学习率: 早期(`α≈0.3`)快速适应,后期(`α≈0.05`)趋于稳定
- 计算简单,适合实时场景

### 2.6 探索机制

系统支持两种探索策略,避免陷入局部最优。

#### ε-greedy 策略

**实现** (`src/core/modelRouter/ModelRouter.ts:209-221`):

```typescript
if (strategy === ExplorationStrategy.EPSILON_GREEDY) {
  const epsilon = exploration?.epsilon || 0;
  if (epsilon > 0 && Math.random() < epsilon) {
    const otherCandidates = allowedCandidates.filter(c => c.name !== bestCandidate.name);
    if (otherCandidates.length > 0) {
      const picked = otherCandidates[Math.floor(Math.random() * otherCandidates.length)];
      const pickedAdapter = this.adapters.get(picked.name);
      if (pickedAdapter) {
        finalAdapter = pickedAdapter;
        finalReason = `ε-greedy 采样(${epsilon}): 随机选中 [${picked.name}]`;
      }
    }
  }
}
```

**特点:**
- 简单直接
- 适合探索空间较小的情况
- 需要调整 `epsilon` 参数

#### UCB1 策略

**实现** (`src/core/modelRouter/ModelRouter.ts:222-238`):

```typescript
else if (strategy === ExplorationStrategy.UCB1) {
  const statsMap = this.metrics.getAllStats();
  const totalRuns = Array.from(statsMap.values()).reduce((sum, s) => sum + s.totalRequests, 0);

  const candidatesWithUCB = allowedCandidates.map(c => {
    const ucb = this.calculateUCB1(statsMap.get(c.name), totalRuns);
    return { ...c, combinedScore: c.score * 0.7 + ucb * 0.3, ucb };
  });

  candidatesWithUCB.sort((a, b) => b.combinedScore - a.combinedScore);
  const topOne = candidatesWithUCB[0];

  if (topOne.name !== bestCandidate.name) {
    finalAdapter = this.adapters.get(topOne.name)!;
    finalReason = `UCB1 探索: 选中 [${topOne.name}] (UCB=${topOne.ucb.toFixed(3)})`;
  }
}
```

**UCB1 计算** (`src/core/modelRouter/ModelRouter.ts:356-361`):

```typescript
private calculateUCB1(stats: ModelStats | undefined, totalRuns: number): number {
  if (!stats || stats.totalRequests === 0) return 1.0;
  const mean = stats.successCount / stats.totalRequests;
  const explorationBonus = Math.sqrt((2 * Math.log(Math.max(totalRuns, 1))) / stats.totalRuns);
  return Math.min(mean + explorationBonus, 2.0) / 2.0;
}
```

**UCB1 公式:**

```
UCB1 = (μ + √(2ln(N)/n)) / 2
```

其中:
- `μ`: 平均奖励值(成功率)
- `N`: 总尝试次数
- `n`: 该 arm 的尝试次数
- 除以 2 归一化到 [0,1]

**特点:**
- 平衡利用和探索
- 自动调整探索权重
- 适合长期运行场景

### 2.7 完整路由流程

```
用户发起请求
    ↓
executeTask()
    ↓
router.route() ───────────────────────────┐
    ↓                                      │
1. 手动指定?                                │
    ├─ 是 → 直接返回                      │
    └─ 否 → 继续                           │
    ↓                                      │
2. 更新故障域状态                          │
    ↓                                      │
3. 获取指标快照                            │
    ↓                                      │
4. 监督器评估(可能触发策略切换)             │
    ↓                                      │
5. 选择策略                        │
    ↓                                      │
6. 执行策略 + 探索                          │
    ├─ Gate 过滤                          │
    ├─ 评分                               │
    └─ 探索调整                           │
    ↓                                      │
7. 熔断检查                                │
    ↓                                      │
8. 返回 RoutingResult ─────────────────────┘
    ↓
执行任务
    ↓
记录指标(触发熔断状态更新)
```

---

## 3. 功能亮点

### 3.1 DSL 驱动的策略配置

**亮点:** 使用声明式 DSL 配置策略,无需修改代码即可调整路由逻辑。

**优势:**
- ✅ 灵活性强: 可通过配置文件或 CLI 动态调整
- ✅ 可读性好: 权重配置直观易懂
- ✅ 易于扩展: 新增策略只需配置 DSL

**示例:**

```typescript
// 成本优先策略
new DslPolicy({
  name: 'cost-saving',
  description: '成本优先模式',
  weights: { cost: 0.7, taskMatch: 0.2, history: 0.1 }
})

// 质量优先策略(带 Gate)
new DslPolicy({
  name: 'quality-first',
  description: '高复杂度任务优先',
  gate: { minContext: 32000 },
  weights: { quality: 0.6, history: 0.2, taskMatch: 0.2 }
})
```

### 3.2 监督器自动决策

**亮点:** 基于实时指标自动调整策略,实现自适应优化。

**优势:**
- ✅ 自动化: 无需人工干预
- ✅ 响应快: 实时监控,及时调整
- ✅ 可追溯: 记录决策日志

**触发场景:**
- 全局延迟过高 → 切换到速度优先
- 成功率骤降 → 切换到成本优先
- 特定故障域失效 → 切换策略

### 3.3 故障域级熔断

**亮点:** 支持跨多个模型的故障域级别熔断,防止级联故障。

**优势:**
- ✅ 细粒度: 按故障域(Provider)而非单个模型
- ✅ 自恢复: 自动探测和恢复
- ✅ 可配置: 调整阈值和探测比例

**状态机:**

```
Closed → Open → Half-Open → Closed
  ↑           │        │
  └───────────┴────────┘
```

### 3.4 动态 EMA 学习

**亮点:** 使用动态学习率的 EMA,早期快速适应,后期趋于稳定。

**公式:**

```
α = max(0.05, min(0.3, 1/√N))
```

**效果:**
- 前 10 次请求: `α ≈ 0.3` (快速学习)
- 100 次后: `α ≈ 0.1` (平滑稳定)
- 400 次后: `α ≈ 0.05` (极度稳定)

### 3.5 多种探索机制

**亮点:** 支持 ε-greedy 和 UCB1 两种探索策略,适应不同场景。

**对比:**

| 策略 | 适用场景 | 调参难度 | 计算复杂度 |
|------|---------|---------|-----------|
| ε-greedy | 短期/测试 | 低 | O(1) |
| UCB1 | 长期/生产 | 无需调参 | O(n) |

### 3.6 丰富的 CLI 接口

**亮点:** 提供完整的 CLI 命令集,覆盖所有核心功能。

**命令分类:**

1. **执行类:**
   - `yuangs router exec` - 执行任务

2. **查询类:**
   - `yuangs router list` - 列出适配器
   - `yuangs router stats` - 查看统计
   - `yuangs router test` - 测试适配器

3. **配置类:**
   - `yuangs router config` - 管理配置
   - `yuangs router policy` - 管理策略
   - `yuangs router exploration` - 管理探索

4. **诊断类:**
   - `yuangs router doctor` - 系统自检

### 3.7 可扩展的适配器系统

**亮点:** 通过继承 `BaseAdapter` 可轻松添加新的模型适配器。

**步骤:**

```typescript
// 1. 创建适配器类
export class MyAdapter extends BaseAdapter {
  name = 'my-model';
  version = '1.0.0';
  provider = 'MyProvider';
  capabilities = { /* ... */ };

  async healthCheck() {
    return await this.checkCommand('my-cli');
  }

  async execute(prompt, config, onChunk) {
    // 调用 CLI 并返回结果
  }
}

// 2. 注册适配器
router.registerAdapter(new MyAdapter());

// 3. 启用适配器
yuangs router config enable my-model
```

---

## 4. 优化建议

### 4.1 架构层面

#### 建议 1: 引入自适应权重调整

**问题:** 当前策略权重是静态配置的,无法根据实际效果自动调整。

**方案:** 使用多臂老虎机(MAB)算法,如 Thompson Sampling,动态调整权重。

**实现思路:**

```typescript
class AdaptivePolicy extends DslPolicy {
  private weightHistory: Map<string, number[]> = new Map();

  async select(adapters, task, config, modelStats, domainHealth) {
    // 1. 根据历史效果动态调整权重
    const adjustedWeights = this.adjustWeights(task.type);

    // 2. 使用调整后的权重评分
    return this.scoreWithWeights(adapters, task, adjustedWeights, modelStats);
  }

  private adjustWeights(taskType: TaskType): PolicyWeights {
    const history = this.weightHistory.get(taskType) || [];
    // 使用 Thompson Sampling 计算最优权重
    return this.thompsonSample(history);
  }
}
```

**预期收益:**
- 策略性能提升 10-20%
- 减少人工调参

#### 建议 2: 实现分层缓存

**问题:** 相同的 prompt 重复请求不同模型,浪费资源。

**方案:** 实现多层缓存机制。

**缓存层级:**

```
L1: 内存缓存 (最近 100 条)
L2: 本地文件缓存 (最近 10000 条)
L3: Redis 缓存 (可选,多实例共享)
```

**实现思路:**

```typescript
class CacheLayer {
  private l1Cache: LRUCache<string, CachedResponse> = new LRUCache(100);
  private l2Cache: PersistentCache = new PersistentCache();

  async get(prompt: string, taskType: TaskType): Promise<ModelExecutionResult | null> {
    const key = this.hash(prompt, taskType);

    // L1 缓存
    const cached = this.l1Cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.result;
    }

    // L2 缓存
    const persisted = await this.l2Cache.get(key);
    if (persisted && !this.isExpired(persisted)) {
      this.l1Cache.set(key, persisted);  // 提升到 L1
      return persisted.result;
    }

    return null;
  }
}
```

**预期收益:**
- 重复请求命中率 > 30%
- 响应时间减少 50-80%

#### 建议 3: 添加 A/B 测试框架

**问题:** 新策略或新模型的上线缺乏实验验证。

**方案:** 实现流量分流和效果对比。

**实现思路:**

```typescript
class ABTestFramework {
  private experiments: Map<string, Experiment> = new Map();

  selectStrategy(taskConfig: TaskConfig, userId: string): RoutingStrategy {
    const experiment = this.getExperiment(taskConfig.type);
    if (!experiment) return RoutingStrategy.AUTO;

    const bucket = this.hashToBucket(userId, experiment.buckets);
    return bucket.strategy;
  }

  recordResult(userId: string, result: ModelExecutionResult) {
    // 记录实验数据
    const bucket = this.getUserBucket(userId);
    this.stats.record(bucket.experimentId, bucket.variant, result);
  }

  analyze(experimentId: string) {
    // 统计显著性检验
    return this.stats.analyze(experimentId);
  }
}
```

**预期收益:**
- 新策略上线风险降低
- 科学评估策略效果

### 4.2 性能层面

#### 建议 4: 优化指标存储

**问题:** 指标数据持续增长,占用内存。

**方案:** 实现指标采样和压缩。

**实现思路:**

```typescript
class OptimizedMetricsCollector {
  private stats: Map<string, ModelStats> = new Map();
  private rawMetrics: Map<string, MetricBuffer> = new Map();

  recordRequest(adapterName, domain, latencyMs, success, costLevel) {
    // 更新 EMA(实时)
    this.updateEMA(adapterName, latencyMs, success, costLevel);

    // 缓存原始指标(异步写入)
    this.bufferRawMetric(adapterName, {
      timestamp: Date.now(),
      latencyMs,
      success,
      costLevel
    });
  }

  // 定期持久化
  private async flushBuffers() {
    for (const [adapter, buffer] of this.rawMetrics.entries()) {
      await this.persistToDisk(adapter, buffer.compress());
      buffer.clear();
    }
  }
}
```

**预期收益:**
- 内存占用减少 60-80%
- 长期运行更稳定

#### 建议 5: 并行健康检查

**问题:** 适配器健康检查串行执行,启动慢。

**方案:** 并行执行健康检查。

**实现思路:**

```typescript
async getAvailableAdapters(): Promise<ModelAdapter[]> {
  const adapters = Array.from(this.adapters.values());

  const availabilityChecks = await Promise.all(
    adapters.map(async (adapter) => ({
      adapter,
      available: await adapter.healthCheck().catch(() => false),
    }))
  );

  return availabilityChecks
    .filter((check) => check.available)
    .map((check) => check.adapter);
}
```

**预期收益:**
- 启动时间减少 70-90%

### 4.3 功能层面

#### 建议 6: 添加成本追踪

**问题:** 无法精确追踪每个请求的实际成本。

**方案:** 基于价格的精细成本计算。

**实现思路:**

```typescript
interface Pricing {
  inputPrice: number;  // 每 1K input tokens
  outputPrice: number; // 每 1K output tokens
}

class CostTracker {
  private pricing: Map<string, Pricing> = new Map();

  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const price = this.pricing.get(model);
    if (!price) return 0;

    const inputCost = (inputTokens / 1000) * price.inputPrice;
    const outputCost = (outputTokens / 1000) * price.outputPrice;
    return inputCost + outputCost;
  }

  recordUsage(model: string, inputTokens: number, outputTokens: number) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    this.totalCost += cost;
    this.modelCosts.set(model, (this.modelCosts.get(model) || 0) + cost);
  }

  getCostReport(): CostReport {
    return {
      total: this.totalCost,
      byModel: this.modelCosts,
      byTaskType: this.taskTypeCosts
    };
  }
}
```

**预期收益:**
- 精确的成本控制
- 优化模型选择

#### 建议 7: 增强可观测性

**问题:** 缺少完整的观测工具,调试困难。

**方案:** 实现全面的观测工具链。

**工具链:**

1. **Metrics Dashboard**
   ```typescript
   class MetricsDashboard {
     renderCLI() {
       // ASCII 图表展示指标趋势
     }
   }
   ```

2. **Trace Viewer**
   ```typescript
   class TraceViewer {
     exportTrace(traceId: string): Trace {
       // 导出完整请求链路
     }
   }
   ```

3. **Alert Manager**
   ```typescript
   class AlertManager {
     checkMetrics(snapshot: MetricsSnapshot): Alert[] {
       // 检查指标并生成告警
     }
   }
   ```

**预期收益:**
- 问题定位时间减少 70%
- 系统可维护性提升

#### 建议 8: 支持批量任务

**问题:** 批量任务无法优化执行。

**方案:** 实现批量任务调度和并行执行。

**实现思路:**

```typescript
class BatchExecutor {
  async executeBatch(tasks: TaskConfig[]): Promise<ModelExecutionResult[]> {
    // 1. 任务分组(按优先级、任务类型)
    const groups = this.groupTasks(tasks);

    // 2. 并行执行组内任务
    const results = await Promise.all(
      groups.map(group => this.executeGroup(group))
    );

    return results.flat();
  }

  private async executeGroup(group: TaskGroup): Promise<ModelExecutionResult[]> {
    // 1. 选择最优模型
    const adapter = await this.selectBestModelForGroup(group);

    // 2. 批量执行(利用并发限制)
    const limited = this.pLimit(5);  // 最大并发 5
    return await Promise.all(
      group.tasks.map(task => limited(() => this.executeOne(adapter, task)))
    );
  }
}
```

**预期收益:**
- 批量任务吞吐量提升 200-500%
- 资源利用率提升

### 4.4 可靠性层面

#### 建议 9: 实现多级重试

**问题:** 失败后直接放弃,没有重试机制。

**方案:** 实现指数退避重试。

**实现思路:**

```typescript
class RetryManager {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    backoffBase: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = backoffBase * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

**预期收益:**
- 瞬时故障自动恢复
- 整体成功率提升 5-10%

#### 建议 10: 添加限流机制

**问题:** 高并发时可能压垮上游 API。

**方案:** 实现令牌桶限流。

**实现思路:**

```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private capacity: number, private refillRate: number) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // 等待令牌补充
    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
    await this.sleep(waitTime);
    this.tokens -= tokens;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}
```

**预期收益:**
- 避免 API 限流
- 稳定性提升

---

## 5. 总结

### 5.1 系统优势

1. **架构清晰:** 三面架构(控制面、执行面、观测面)职责分明
2. **灵活性高:** DSL 驱动的策略配置,易于扩展
3. **智能化强:** 监督器自动决策,熔断器自动保护
4. **可观测性好:** 完整的指标收集和日志记录
5. **用户友好:** 丰富的 CLI 接口和配置选项

### 5.2 技术亮点

1. **DSL 策略引擎:** 声明式配置,代码与策略分离
2. **动态 EMA 学习:** 自适应学习率,早期快速适应
3. **故障域熔断:** 细粒度保护,自动恢复
4. **多种探索机制:** ε-greedy 和 UCB1,适应不同场景
5. **适配器模式:** 统一接口,易于扩展

### 5.3 适用场景

- ✅ 多模型管理: 统一管理多个 AI 服务商
- ✅ 成本优化: 根据任务类型选择性价比最高的模型
- ✅ 性能优化: 在关键时刻选择最快或最优质的模型
- ✅ 可靠性保障: 熔断保护,自动重试
- ✅ 灵活配置: 支持多种路由策略和探索机制

### 5.4 发展方向

基于优化建议,系统可以从以下方向演进:

**短期 (1-3 个月):**
- 实现分层缓存
- 添加成本追踪
- 优化指标存储

**中期 (3-6 个月):**
- 引入自适应权重
- 实现批量任务
- 添加 A/B 测试

**长期 (6-12 个月):**
- 分布式部署支持
- 多租户隔离
- 完整的观测工具链

---

## 附录

### A. 相关文件清单

| 文件路径 | 说明 |
|---------|------|
| `src/core/modelRouter/ModelRouter.ts` | 路由器核心实现 |
| `src/core/modelRouter/policies/DslPolicy.ts` | DSL 策略引擎 |
| `src/core/modelRouter/ModelSupervisor.ts` | 监督器 |
| `src/core/metrics/MetricsCollector.ts` | 指标收集器 |
| `src/core/modelRouter/BaseAdapter.ts` | 适配器基类 |
| `src/core/modelRouter/adapters/GoogleAdapter.ts` | Gemini 适配器 |
| `src/core/modelRouter/adapters/QwenAdapter.ts` | Qwen 适配器 |
| `src/commands/routerCommands.ts` | CLI 命令实现 |
| `src/core/modelRouter/config.ts` | 配置管理 |

### B. 参考资料

1. **多臂老虎机 (MAB):**
   - ε-greedy 算法
   - UCB1 算法
   - Thompson Sampling

2. **熔断器模式:**
   - Circuit Breaker Pattern
   - 故障域隔离

3. **指数移动平均 (EMA):**
   - 动态学习率
   - 平滑滤波

4. **策略模式:**
   - 开闭原则
   - 策略配置化
