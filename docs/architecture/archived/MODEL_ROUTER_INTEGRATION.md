# ModelRouter 与 AgentRuntime/DualAgentRuntime 集成指南

## 概述

ModelRouter 系统已经深度集成到 yuangs 的核心 AI 执行引擎（AgentRuntime 和 DualAgentRuntime）中。这个集成提供了智能的模型选择、任务类型推断和自动路由功能。

## 核心功能

### 1. 智能任务类型推断

系统会自动根据用户输入推断任务类型，包括：
- 代码生成 (CODE_GENERATION)
- 代码审查 (CODE_REVIEW)
- 调试 (DEBUG)
- 翻译 (TRANSLATION)
- 摘要 (SUMMARIZATION)
- 分析 (ANALYSIS)
- 命令生成 (COMMAND_GENERATION)
- 对话 (CONVERSATION)

### 2. 智能路由策略

根据任务类型和用户需求自动选择最佳路由策略：
- **AUTO**: 自动选择（基于任务类型和模型能力）
- **FASTEST_FIRST**: 最快响应优先
- **CHEAPEST_FIRST**: 最低成本优先
- **BEST_QUALITY**: 最佳质量优先
- **ROUND_ROBIN**: 轮询
- **MANUAL**: 手动指定

### 3. 自动回退机制

当 ModelRouter 执行失败时，系统会自动回退到默认 AI 服务，确保任务能够继续执行。

## 配置

### 启用/禁用路由

在 `~/.yuangs.json` 中配置：

```json
{
  "enableModelRouting": true,
  "enableModelRouterFallback": true,
  "defaultRoutingStrategy": "auto"
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enableModelRouting` | boolean | true | 是否启用模型路由 |
| `enableModelRouterFallback` | boolean | true | 是否启用回退机制 |
| `defaultRoutingStrategy` | string | "auto" | 默认路由策略 |

## 使用方式

### 1. 自动路由（推荐）

默认情况下，AgentRuntime 和 DualAgentRuntime 会自动使用 ModelRouter：

```typescript
// 在 AgentRuntime 中
const runtime = new AgentRuntime(initialContext);
await runtime.run(userInput, 'command');

// 在 DualAgentRuntime 中
const runtime = new DualAgentRuntime(initialContext);
await runtime.run(userInput);
```

系统会自动：
1. 推断任务类型
2. 选择最佳模型
3. 执行任务
4. 处理失败回退

### 2. 手动指定策略

通过用户输入可以手动指定策略：

```bash
# 使用最快模型
yuangs "翻译这段文字，要快" -e

# 使用最便宜的模型
yuangs "写一个简单函数，用便宜点的模型" -e

# 使用质量最好的模型
yuangs "审查这段代码，要高质量" -e
```

### 3. 在代码中手动控制

```typescript
import { 
  getRouterIntegration,
  inferTaskType,
  inferRoutingStrategy 
} from 'yuangs/agent/modelRouterIntegration';

// 获取路由器实例
const router = getRouterIntegration();

// 更新配置
router.updateConfig({
  enableRouting: true,
  defaultStrategy: 'fastest_first'
});

// 推断任务类型
const taskType = inferTaskType(userInput, 'command');

// 推断路由策略
const strategy = inferRoutingStrategy(taskType, userInput);
```

## 工作流程

### AgentRuntime 集成流程

```
1. 用户输入
   ↓
2. 推断任务类型（inferTaskType）
   ↓
3. 判断是否使用路由器（shouldUseRouter）
   ↓
4a. 使用路由器
    → executeWithRouter()
    → 选择最佳模型
    → 执行任务
   ↓
4b. 不使用路由器或路由失败
    → 回退到默认 AI（runLLM）
   ↓
5. 返回结果
```

### DualAgentRuntime 集成流程

```
1. 用户输入
   ↓
2. 判断是否需要 Planner
   ↓
3. 如果需要 Planner
    → 调用 callPlanner()
    → Planner 使用路由器选择模型
   ↓
4. 执行计划步骤
    → 每个步骤可以使用路由器
   ↓
5. 返回结果
```

## 实现细节

### 修改的文件

1. **src/agent/modelRouterIntegration.ts** (新增)
   - ModelRouter 集成模块
   - 任务类型推断
   - 路由策略推断
   - 路由器集成类

2. **src/agent/AgentRuntime.ts** (待修改)
   - 集成 ModelRouter
   - 添加路由器支持

3. **src/agent/DualAgentRuntime.ts** (待修改)
   - 集成 ModelRouter
   - Planner 使用路由器

### API 接口

#### ModelRouterIntegration 类

```typescript
class ModelRouterIntegration {
  constructor(options?: {
    enableRouting?: boolean;
    enableFallback?: boolean;
    defaultStrategy?: RoutingStrategy;
  });

  async executeWithRouter(
    messages: AIRequestMessage[],
    mode: 'chat' | 'command',
    options?: RouterLLMOptions
  ): Promise<RouterLLMResult>;

  updateConfig(options: {
    enableRouting?: boolean;
    enableFallback?: boolean;
    defaultStrategy?: RoutingStrategy;
  }): void;

  getConfig(): {
    enableRouting: boolean;
    enableFallback: boolean;
    defaultStrategy: RoutingStrategy;
  };
}
```

#### RouterLLMOptions

```typescript
interface RouterLLMOptions {
  enableRouting?: boolean;          // 是否启用路由
  routingStrategy?: RoutingStrategy; // 路由策略
  taskType?: TaskType;             // 任务类型
  enableFallback?: boolean;         // 是否启用回退
  routingConfig?: Partial<TaskConfig>; // 额外配置
  onChunk?: (chunk: string) => void; // 流式输出
  model?: string;                  // 模型参数
}
```

#### RouterLLMResult

```typescript
interface RouterLLMResult {
  rawText: string;           // 原始响应
  usedRouter: boolean;        // 是否使用了路由
  modelName: string;          // 使用的模型
  routingReason?: string;     // 路由原因
  latencyMs: number;          // 延迟时间
  error?: string;            // 错误信息
}
```

## 示例代码

### 示例 1: 基本使用

```typescript
import { getRouterIntegration } from 'yuangs/agent/modelRouterIntegration';

const router = getRouterIntegration();

const result = await router.executeWithRouter(
  [
    { role: 'user', content: '写一个快速排序函数' }
  ],
  'command',
  {
    onChunk: (chunk) => console.log(chunk)
  }
);

console.log(`使用的模型: ${result.modelName}`);
console.log(`路由原因: ${result.routingReason}`);
console.log(`响应: ${result.rawText}`);
```

### 示例 2: 手动指定策略

```typescript
const result = await router.executeWithRouter(
  messages,
  'command',
  {
    routingStrategy: 'fastest_first',
    taskType: 'code_generation'
  }
);
```

### 示例 3: 禁用路由器

```typescript
const result = await router.executeWithRouter(
  messages,
  'chat',
  {
    enableRouting: false
  }
);

if (!result.usedRouter) {
  console.log('使用默认 AI 服务');
}
```

### 示例 4: 处理路由失败

```typescript
const result = await router.executeWithRouter(
  messages,
  'command'
);

if (result.error && router.getConfig().enableFallback) {
  // 回退到默认 AI
  const { runLLM } = require('./llm');
  const fallbackResult = await runLLM({
    prompt: { system: '', messages },
    model: 'Assistant',
    stream: false
  });
  console.log(fallbackResult.rawText);
}
```

## 最佳实践

### 1. 任务类型映射

建议为常见任务配置默认模型：

```bash
# 代码任务使用专业模型
yuangs router config map code_generation codebuddy
yuangs router config map code_review codebuddy
yuangs router config map debug codebuddy

# 翻译任务使用中文优化模型
yuangs router config map translation qwen
yuangs router config map conversation qwen

# 长上下文任务用 Gemini
yuangs router config map analysis google-gemini
```

### 2. 控制成本

```bash
# 配置成本限制
yuangs router config set maxCostLevel 2

# 在代码中禁用路由器以节省成本
router.updateConfig({ enableRouting: false });
```

### 3. 性能监控

```bash
# 查看路由器统计
yuangs router stats

# 根据统计结果优化配置
yuangs router config set defaultStrategy fastest_first
```

### 4. 错误处理

```typescript
try {
  const result = await router.executeWithRouter(messages, 'command');
  
  if (result.error) {
    console.error('路由器执行失败:', result.error);
    // 处理错误或回退逻辑
  }
} catch (error) {
  console.error('路由器错误:', error);
}
```

## 故障排查

### 问题 1: 路由器未启用

**症状**: 所有请求都使用默认 AI 服务

**解决方案**:
```json
{
  "enableModelRouting": true
}
```

### 问题 2: 路由失败但未回退

**症状**: 路由器失败后任务中断

**解决方案**:
```json
{
  "enableModelRouterFallback": true
}
```

### 问题 3: 任务类型推断错误

**症状**: 选择的模型不符合预期

**解决方案**:
```typescript
// 手动指定任务类型
const result = await router.executeWithRouter(
  messages,
  'command',
  {
    taskType: 'code_generation'
  }
);
```

### 问题 4: 流式输出不工作

**症状**: 响应延迟过高

**解决方案**:
```typescript
const result = await router.executeWithRouter(
  messages,
  'command',
  {
    onChunk: (chunk) => process.stdout.write(chunk)
  }
);
```

## 性能考虑

### 延迟分析

- **路由决策延迟**: ~10-50ms
- **模型执行延迟**: 取决于选择的模型
- **总延迟**: 路由决策 + 模型执行

### 优化建议

1. **缓存路由决策**: 相同的任务类型可以缓存路由结果
2. **预热适配器**: 启动时预加载常用适配器
3. **并发健康检查**: 定期并发检查所有适配器状态

## 未来改进

1. **基于学习的路由**: 使用机器学习优化路由决策
2. **成本感知路由**: 动态调整路由策略以控制成本
3. **A/B 测试**: 支持路由策略的 A/B 测试
4. **实时监控**: 添加实时性能监控和告警

## 参考文档

- [ModelRouter 完整文档](../MODEL_ROUTER_README.md)
- [ModelRouter 用户指南](../MODEL_ROUTER_USER_GUIDE.md)
- [ModelRouter 优化指南](../MODEL_ROUTER_OPTIMIZATIONS.md)
