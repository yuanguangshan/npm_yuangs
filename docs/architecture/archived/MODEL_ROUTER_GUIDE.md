# 🚀 多模型路由系统使用指南

## 概述

多模型路由系统允许你整合多个 AI CLI 工具（如 Google CLI、Qwen CLI、Codebuddy CLI 等），并根据任务特性自动路由到最合适的模型执行。

### 核心特性

- ✅ **智能路由**: 根据任务类型、性能需求、成本预算自动选择最佳模型
- ✅ **多种策略**: 支持自动选择、轮询、最快优先、最低成本等多种路由策略
- ✅ **可扩展**: 轻松添加新的模型适配器
- ✅ **统计监控**: 实时追踪各模型的使用情况和性能表现
- ✅ **灵活配置**: 支持任务类型到模型的映射配置

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────┐
│                   yuangs CLI                        │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │         Model Router                      │    │
│  │  ┌─────────────┐  ┌─────────────┐       │    │
│  │  │  Routing    │  │  Statistics │       │    │
│  │  │  Engine     │  │  Tracker    │       │    │
│  │  └─────────────┘  └─────────────┘       │    │
│  └───────────────────────────────────────────┘    │
│                      │                             │
│         ┌────────────┼────────────┐               │
│         ▼            ▼            ▼               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Google  │ │   Qwen   │ │Codebuddy │          │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │          │
│  └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────┘
         │            │            │
         ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ gcloud │  │  qwen  │  │codebuddy│
    │  CLI   │  │  CLI   │  │  CLI   │
    └────────┘  └────────┘  └────────┘
```

---

## 📦 安装和配置

### 1. 安装依赖的 CLI 工具

根据你想使用的模型，安装对应的 CLI 工具：

#### Google Gemini (gcloud)
```bash
# 安装 Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 初始化和认证
gcloud init
gcloud auth login
```

#### Qwen (通义千问)
```bash
# 安装 Qwen CLI（假设通过 pip）
pip install qwen-cli

# 配置 API Key
qwen config set api-key YOUR_API_KEY
```

#### Codebuddy
```bash
# 安装 Codebuddy CLI
npm install -g codebuddy-cli

# 或使用其他安装方式
curl -fsSL https://codebuddy.io/install.sh | sh
```

### 2. 初始化路由器配置

```bash
# 查看当前配置
yuangs router config show

# 启用需要的适配器
yuangs router config enable google-gemini
yuangs router config enable qwen
yuangs router config enable codebuddy

# 设置默认路由策略
yuangs router config set defaultStrategy auto

# 设置最大响应时间（毫秒）
yuangs router config set maxResponseTime 30000

# 设置最大成本等级（1-5）
yuangs router config set maxCostLevel 3
```

---

## 🎯 使用方法

### 1. 查看已注册的模型

```bash
yuangs router list
```

输出示例：
```
🤖 已注册的模型适配器

✓ google-gemini (Google)
   版本: 1.0.0
   状态: 可用
   支持的任务: code_generation, code_review, conversation, ...
   上下文窗口: 1000000
   平均响应时间: 2000ms
   成本等级: 2/5
   特殊能力: long-context, multimodal

✓ qwen (Alibaba)
   版本: 1.0.0
   状态: 可用
   支持的任务: code_generation, conversation, translation, ...
   上下文窗口: 32000
   平均响应时间: 1500ms
   成本等级: 2/5
   特殊能力: chinese-optimized, code-specialized

✗ codebuddy (Codebuddy)
   版本: 1.0.0
   状态: 不可用
   支持的任务: code_generation, code_review, debug, analysis
   上下文窗口: 100000
   平均响应时间: 3000ms
   成本等级: 3/5
   特殊能力: code-expert, repository-aware
```

### 2. 执行任务

#### 基本用法（自动路由）

```bash
# 系统会根据任务类型自动选择最合适的模型
yuangs router exec "写一个快速排序算法" -t code_generation
```

#### 指定路由策略

```bash
# 使用最快响应的模型
yuangs router exec "翻译这段文字" -t translation -s fastest_first

# 使用成本最低的模型
yuangs router exec "总结这篇文章" -t summarization -s cheapest_first

# 使用质量最好的模型
yuangs router exec "审查这段代码" -t code_review -s best_quality
```

#### 手动指定模型

```bash
# 强制使用特定模型
yuangs router exec "分析这个错误" -t debug -m codebuddy
```

### 3. 查看使用统计

```bash
# 查看所有模型的统计信息
yuangs router stats

# 查看特定模型的统计
yuangs router stats google-gemini
```

输出示例：
```
📊 模型使用统计

google-gemini
  总请求数: 45
  成功: 43 | 失败: 2
  成功率: 95.6%
  平均响应时间: 2134ms
  总 tokens: 125340
  最后使用: 2026-01-27 10:30:45

qwen
  总请求数: 28
  成功: 28 | 失败: 0
  成功率: 100.0%
  平均响应时间: 1456ms
  总 tokens: 67890
  最后使用: 2026-01-27 10:25:12
```

### 4. 测试适配器

```bash
# 测试特定适配器是否正常工作
yuangs router test google-gemini

# 使用自定义测试提示词
yuangs router test qwen -p "用中文介绍一下自己"
```

---

## ⚙️ 高级配置

### 任务类型映射

你可以为特定的任务类型指定默认使用的模型：

```bash
# 代码生成任务总是使用 Codebuddy
yuangs router config map code_generation codebuddy

# 翻译任务总是使用 Qwen
yuangs router config map translation qwen

# 查看所有映射
yuangs router config show

# 移除映射
yuangs router config unmap code_generation
```

### 配置文件

配置文件位于 `~/.yuangs-router.json`：

```json
{
  "defaultStrategy": "auto",
  "maxResponseTime": 30000,
  "maxCostLevel": 3,
  "enableFallback": true,
  "enabledAdapters": [
    "google-gemini",
    "qwen",
    "codebuddy"
  ],
  "taskTypeMapping": {
    "code_generation": "codebuddy",
    "translation": "qwen"
  },
  "adapterConfigs": {
    "google-gemini": {
      "preferredModel": "gemini-2.5-pro"
    }
  }
}
```

---

## 🔧 自定义适配器

如果你想添加新的模型适配器，可以参考以下步骤：

### 1. 创建适配器类

```typescript
// src/core/modelRouter/adapters/MyAdapter.ts
import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult, TaskType } from '../types';

export class MyAdapter extends BaseAdapter {
  name = 'my-model';
  version = '1.0.0';
  provider = 'MyProvider';

  capabilities: ModelCapabilities = {
    supportedTaskTypes: [TaskType.CONVERSATION],
    maxContextWindow: 8000,
    avgResponseTime: 1000,
    costLevel: 1,
    supportsStreaming: true,
  };

  async healthCheck(): Promise<boolean> {
    try {
      await this.checkCommand('my-cli');
      return true;
    } catch {
      return false;
    }
  }

  async execute(
    prompt: string,
    config: TaskConfig,
    onChunk?: (chunk: string) => void
  ): Promise<ModelExecutionResult> {
    const { result, executionTime } = await this.measureExecutionTime(async () => {
      const { stdout } = await this.runCommand(`my-cli ask "${prompt}"`);
      return stdout;
    });

    return this.createSuccessResult(result, executionTime);
  }
}
```

### 2. 注册适配器

在 `src/core/modelRouter/index.ts` 中注册你的适配器：

```typescript
import { MyAdapter } from './adapters/MyAdapter';

export function createRouter(): ModelRouter {
  const router = new ModelRouter();
  const config = loadConfig();

  // ... 现有适配器注册 ...

  if (config.enabledAdapters.includes('my-model')) {
    router.registerAdapter(new MyAdapter());
  }

  return router;
}
```

---

## 📊 路由策略详解

### AUTO (自动选择)

基于多个维度评分选择最佳模型：

- **任务类型匹配** (40%): 模型是否支持该任务类型
- **上下文窗口** (20%): 是否满足上下文大小需求
- **响应时间** (20%): 是否满足响应时间要求
- **成本** (10%): 是否在成本预算内
- **历史表现** (10%): 过去的成功率

### ROUND_ROBIN (轮询)

按顺序轮流使用各个可用模型，适合负载均衡。

### FASTEST_FIRST (最快优先)

选择平均响应时间最短的模型。

### CHEAPEST_FIRST (最低成本)

选择成本等级最低的模型。

### BEST_QUALITY (最佳质量)

为代码相关任务选择专业的代码模型，其他任务选择成本最高（通常质量最好）的模型。

### MANUAL (手动)

手动指定使用的模型，不进行自动选择。

---

## 🎨 任务类型说明

| 任务类型 | 说明 | 推荐模型 |
|---------|------|---------|
| `code_generation` | 代码生成 | Codebuddy, Google Gemini |
| `code_review` | 代码审查 | Codebuddy, Google Gemini |
| `conversation` | 对话交流 | Qwen, Google Gemini |
| `translation` | 翻译 | Qwen |
| `summarization` | 摘要总结 | Google Gemini, Qwen |
| `analysis` | 分析 | Google Gemini, Codebuddy |
| `command_generation` | 命令生成 | Qwen |
| `debug` | 调试 | Codebuddy |
| `general` | 通用任务 | 自动选择 |

---

## 💡 最佳实践

### 1. 为不同任务配置专用模型

```bash
# 代码任务使用 Codebuddy
yuangs router config map code_generation codebuddy
yuangs router config map code_review codebuddy
yuangs router config map debug codebuddy

# 对话和翻译使用 Qwen
yuangs router config map conversation qwen
yuangs router config map translation qwen

# 长上下文任务使用 Google Gemini
yuangs router config map analysis google-gemini
```

### 2. 根据网络状况调整超时

```bash
# 网络较慢时增加超时时间
yuangs router config set maxResponseTime 60000
```

### 3. 控制成本

```bash
# 限制最大成本等级，避免使用昂贵的模型
yuangs router config set maxCostLevel 2
```

### 4. 定期查看统计信息

```bash
# 每周查看统计，优化配置
yuangs router stats

# 根据成功率和响应时间调整策略
```

### 5. 测试新适配器

```bash
# 启用新适配器前先测试
yuangs router test new-adapter

# 测试通过后再启用
yuangs router config enable new-adapter
```

---

## 🐛 故障排查

### 适配器显示"不可用"

1. 检查 CLI 工具是否已安装：
   ```bash
   command -v gcloud
   command -v qwen
   command -v codebuddy
   ```

2. 检查认证状态：
   ```bash
   gcloud auth list
   qwen config show
   ```

3. 手动测试适配器：
   ```bash
   yuangs router test <adapter-name>
   ```

### 任务执行失败

1. 查看详细错误信息
2. 检查网络连接
3. 尝试手动指定其他模型
4. 查看适配器统计，确认模型是否稳定

### 配置未生效

```bash
# 重置配置
yuangs router config reset

# 重新配置
yuangs router config show
```

---

## 📚 API 使用（编程接口）

如果你想在代码中使用路由系统：

```typescript
import { executeTask, TaskType, RoutingStrategy } from './core/modelRouter';

// 执行任务
const result = await executeTask(
  '写一个二分搜索算法',
  {
    type: TaskType.CODE_GENERATION,
    description: '生成二分搜索代码',
    priority: Priority.HIGH,
  },
  {
    strategy: RoutingStrategy.BEST_QUALITY,
    maxResponseTime: 10000,
  },
  (chunk) => {
    console.log('接收到内容:', chunk);
  }
);

if (result.success) {
  console.log('结果:', result.content);
  console.log('执行时间:', result.executionTime, 'ms');
} else {
  console.error('错误:', result.error);
}
```

---

## 🔐 安全和隐私

- 所有 CLI 工具的认证信息都存储在各自的配置文件中
- yuangs 不会存储或传输任何认证凭据
- 所有请求都通过官方 CLI 工具发送，遵循各平台的安全策略

---

## 🤝 贡献

欢迎贡献新的适配器或改进现有功能！请查看项目的 CONTRIBUTING.md。

---

## 📄 许可证

ISC License - 详见 LICENSE 文件
