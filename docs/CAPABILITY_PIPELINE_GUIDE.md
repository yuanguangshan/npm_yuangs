# Capability-Aware Pipeline 使用指南

> **代码版本**: v1.0 (2026-01-29)  
> **对应 Commit**: 与 CAPABILITY_PIPELINE_FIXES.md 同步

## 📋 概述

Capability-Aware Pipeline 是一个智能化的任务执行框架，能够根据任务复杂度自动调整 AI 能力等级，并在执行过程中实现优雅降级（Graceful Degradation）。

### 核心特性

- ✅ **自动成本计算** - 根据文件数量、语言复杂度、行数计算任务成本
- ✅ **动态能力调整** - 根据执行时间和置信度自动降级
- ✅ **完整追踪** - 记录每个阶段的执行历史和降级原因
- ✅ **灵活配置** - 支持自定义阶段、降级策略、成本模型

---

## 🎯 能力等级

| 等级 | 数值 | 说明 | 适用场景 |
|------|------|------|----------|
| **SEMANTIC** | 4 | 极致语义，理解业务意图和全局架构 | 复杂业务逻辑、架构设计、跨模块重构 |
| **STRUCTURAL** | 3 | 结构分析，理解代码依赖和模块接口 | 代码审查、依赖分析、接口设计 |
| **LINE** | 2 | 行级分析，关注具体代码行逻辑 | Bug 修复、代码片段优化 |
| **TEXT** | 1 | 文本分析，简单的字符串处理 | 格式化、文本替换、简单的正则匹配 |
| **NONE** | 0 | 无需智能分析 | 文件复制、元数据提取 |

---

## 🚀 快速开始

### 使用 PipelineFactory 创建预定义 Pipeline

#### 1. 代码审查 Pipeline

```typescript
import { PipelineFactory } from '@/core/capability';

// 创建代码审查 Pipeline
const pipeline = PipelineFactory.createCodeReviewPipeline({
    autoDegradation: true,
    maxExecutionTime: 30000,
    confidenceThreshold: 0.7,
});

// 创建执行上下文
const context = pipeline.createContext(
    '审查用户认证模块代码',
    ['src/auth/UserAuth.ts', 'src/auth/TokenManager.ts'],
    500
);

// 执行 Pipeline
const result = await pipeline.execute(context);

console.log(`执行成功: ${result.success}`);
console.log(`最终能力: ${result.stats.finalCapability}`);
console.log(`降级次数: ${result.stats.degradationCount}`);
```

#### 2. 代码生成 Pipeline

```typescript
// 创建代码生成 Pipeline
const pipeline = PipelineFactory.createCodeGenerationPipeline({
    autoDegradation: true,
    maxExecutionTime: 60000,
    confidenceThreshold: 0.75,
});

const context = pipeline.createContext(
    '实现用户注册功能',
    ['src/auth/UserAuth.ts'],
    300
);

const result = await pipeline.execute(context);
```

#### 3. Commit Message 生成 Pipeline

```typescript
// 创建 Commit Message 生成 Pipeline
const pipeline = PipelineFactory.createCommitMessagePipeline({
    autoDegradation: true,
    maxExecutionTime: 15000,
    confidenceThreshold: 0.7,
});

const context = pipeline.createContext(
    '生成 commit message',
    ['src/auth/UserAuth.ts', 'src/api/routes.ts'],
    200
);

const result = await pipeline.execute(context);
```

### 创建自定义 Pipeline

```typescript
import {
    CapabilityPipeline,
    PipelineStage,
    CapabilityLevel,
} from '@/core/capability';

// 定义自定义阶段
const customStages: PipelineStage[] = [
    {
        name: 'data_extraction',
        minCapability: {
            minCapability: CapabilityLevel.TEXT,
            fallbackChain: [CapabilityLevel.NONE],
        },
        execute: async (context) => {
            // 数据提取逻辑
            // 注意：实际使用时应注入 Logger，此处为示例简化
            console.log('提取数据...');
            return {
                success: true,
                data: { extracted: true },
                confidence: 1.0,
                finalCapability: CapabilityLevel.TEXT,
            };
        },
    },
    {
        name: 'semantic_analysis',
        minCapability: {
            minCapability: CapabilityLevel.SEMANTIC,
            fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
        },
        execute: async (context) => {
            // 语义分析逻辑
            // 注意：实际使用时应注入 Logger，此处为示例简化
            console.log('执行语义分析...');
            return {
                success: true,
                data: { analyzed: true },
                confidence: 0.9,
                finalCapability: CapabilityLevel.SEMANTIC,
            };
        },
    },
];

// 创建自定义 Pipeline（推荐完整配置）
const pipeline = new CapabilityPipeline({
    stages: customStages,
    degradationPolicy: new ThresholdDegradationPolicy({
        timeLimit: 45000,
        confidenceThreshold: 0.8,
    }),
    logger: new ConsoleLogger(),  // 显式配置 Logger
    costCalculator: new CostProfileCalculator(),  // 显式配置成本计算器
    autoDegradation: true,
    maxExecutionTime: 45000,
    confidenceThreshold: 0.8,
});

const context = pipeline.createContext(
    '自定义任务描述',
    ['file1.ts', 'file2.ts'],
    400
);

const result = await pipeline.execute(context);
```

---

## 🔧 高级配置

### 自定义降级策略

```typescript
import { ThresholdDegradationPolicy } from '@/core/capability';

// 自定义降级策略
const customPolicy = new ThresholdDegradationPolicy({
    timeLimit: 60000,        // 60秒超时
    confidenceThreshold: 0.8,  // 置信度阈值 0.8
});

const pipeline = new CapabilityPipeline({
    stages: customStages,
    degradationPolicy: customPolicy,
    autoDegradation: true,
});
```

### 自定义成本计算

```typescript
import { CostProfileCalculator } from '@/core/capability';

// 自定义语言权重
const customCostCalculator = new CostProfileCalculator({
    languageWeights: [
        { extensions: ['.ts', '.tsx'], weight: 1.3, complexity: 1.3 },
        { extensions: ['.py'], weight: 1.2, complexity: 1.2 },
        { extensions: ['.go'], weight: 1.4, complexity: 1.4 },
    ],
    baseTimeMultiplier: 1.2,      // 时间乘数
    baseMemoryMultiplier: 1.1,    // 内存乘数
    baseTokenMultiplier: 1.3,     // Token 乘数
});

const pipeline = new CapabilityPipeline({
    stages: customStages,
    costCalculator: customCostCalculator,
    autoDegradation: true,
});
```

---

## 📊 执行结果分析

### PipelineResult 接口

```typescript
interface PipelineResult {
    success: boolean;           // 是否成功
    data?: unknown;            // 返回的数据（类型安全，避免 any）
    error?: Error;             // 错误信息（失败时）
    confidence: number;         // 总体置信度 (0-1)
    finalCapability: CapabilityLevel;  // 最终达到的能力等级
    capability: CapabilityLevel; // 达到的能力等级
    degradation?: {            // 降级信息
        applied: boolean;
        originalLevel: CapabilityLevel;
        targetLevel: CapabilityLevel;
        reason: string;
    };
    stats: PipelineStats;       // 执行统计
}
```

### PipelineStats 接口

```typescript
interface PipelineStats {
    totalTime: number;         // 总执行时间（毫秒）
    totalTokens: number;       // 总 token 消耗
    finalCapability: CapabilityLevel; // 最终能力等级
    degradationCount: number;  // 降级次数
    stagesExecuted: number;    // 执行的阶段数
    stagesSucceeded: number;   // 成功的阶段数
}
```

---

## 🎨 输出示例

```
📊 Pipeline 启动
   任务: 审查用户认证模块代码
   文件: 2 个 (500 行)
   要求能力: 3 (结构分析)
   预计时间: 5000ms
   预计 Token: 5000

🔄 执行阶段: preprocessing
   📝 预处理代码变更...
✅ 阶段完成: preprocessing (120ms, 置信度 100.0%)

🔄 执行阶段: analysis
   🔍 分析代码结构...
✅ 阶段完成: analysis (850ms, 置信度 90.0%)

🔄 执行阶段: review
   👨‍💻 执行代码审查...
⚠️  降级触发: Time elapsed (32000ms) exceeds limit (30000ms)
   3 → 2
✅ 阶段完成: review (32000ms, 置信度 85.0%)

✅ Pipeline 执行完成
   成功: true
   最终能力: 2 (行级操作)
   降级次数: 1
   执行时间: 32970ms
```

---

## 🔍 调试与监控

### 查看执行历史

```typescript
const result = await pipeline.execute(context);

// 遍历执行历史
for (const record of context.executionHistory) {
    console.log(`阶段: ${record.stage}`);
    console.log(`能力: ${record.capability}`);
    console.log(`执行时间: ${record.endTime - record.startTime}ms`);
    console.log(`成功: ${record.success}`);
    console.log(`置信度: ${record.confidence}`);
    if (record.degradationApplied) {
        console.log(`降级原因: ${record.degradationReason}`);
    }
}
```

### 禁用自动降级

```typescript
const pipeline = new CapabilityPipeline({
    stages: customStages,
    autoDegradation: false,  // 禁用自动降级
});
```

---

## 📚 最佳实践

### 1. 合理设置能力等级

- **简单任务**（文本替换、格式化）：使用 `TEXT` 或 `NONE`
- **中等任务**（代码审查、Bug 修复）：使用 `LINE` 或 `STRUCTURAL`
- **复杂任务**（架构设计、跨模块重构）：使用 `SEMANTIC`

### 2. 配置适当的降级链

```typescript
// 好的降级链示例
minCapability: CapabilityLevel.SEMANTIC,
fallbackChain: [
    CapabilityLevel.STRUCTURAL,
    CapabilityLevel.LINE,
    CapabilityLevel.TEXT,
    CapabilityLevel.NONE,  // 必须以 NONE 结束
]
```

### 3. 根据任务类型选择合适的超时时间

- **文本处理任务**: 10-15 秒
- **代码审查任务**: 20-30 秒
- **代码生成任务**: 45-60 秒
- **复杂架构任务**: 60-120 秒

### 4. 监控置信度并调整阈值

- **保守策略**: `confidenceThreshold: 0.8`（更高准确性）
- **平衡策略**: `confidenceThreshold: 0.7`（默认值）
- **激进策略**: `confidenceThreshold: 0.6`（更快响应）

---

## 🛠️ 故障排查

### 问题：降级过于频繁

**解决方案**：
1. 增加 `maxExecutionTime` 值
2. 降低 `confidenceThreshold` 值
3. 检查模型性能，优化代码效率

### 问题：降级从未触发

**解决方案**：
1. 检查执行时间是否真的超时
2. 确认 `autoDegradation: true`
3. 检查置信度计算是否正确

### 问题：最终能力等级过低

**解决方案**：
1. 检查 `fallbackChain` 是否配置合理
2. 调整降级策略的阈值参数
3. 考虑使用更强的 AI 模型

---

## 📖 更多示例

- **完整代码审查示例**: 参见 `src/commands/git/review.ts`
- **代码生成示例**: 参见 `src/core/git/CodeGenerator.ts`
- **Commit Message 生成示例**: 参见 `src/core/git/CommitMessageGenerator.ts`

---

## 🎯 总结

Capability-Aware Pipeline 提供了一个强大而灵活的任务执行框架：

✅ 自动适应任务复杂度
✅ 优雅降级保证可用性
✅ 完整的执行追踪
✅ 灵活的配置选项
✅ 丰富的预定义模板

通过合理配置，可以在保证任务质量的同时，最大化执行效率！
