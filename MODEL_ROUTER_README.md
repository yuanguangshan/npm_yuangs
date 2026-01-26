# 🚀 多模型路由系统

## 快速开始

多模型路由系统已经集成到 yuangs CLI 中，让你可以统一管理和使用多个 AI 模型。

### 基本命令

```bash
# 查看所有可用的模型
yuangs router list

# 执行任务（自动选择最合适的模型）
yuangs router exec "写一个快速排序函数" -t code_generation

# 查看使用统计
yuangs router stats

# 测试模型是否可用
yuangs router test google-gemini
```

### 配置命令

```bash
# 查看配置
yuangs router config show

# 启用/禁用适配器
yuangs router config enable qwen
yuangs router config disable codebuddy

# 设置任务类型映射
yuangs router config map code_generation codebuddy
yuangs router config map translation qwen

# 重置配置
yuangs router config reset
```

---

## 核心概念

### 1. 适配器 (Adapter)

适配器是连接 yuangs 和外部 CLI 工具的桥梁。目前支持：

- **google-gemini**: Google Gemini 模型（通过 gcloud CLI）
- **qwen**: 阿里通义千问模型（通过 qwen CLI）
- **codebuddy**: Codebuddy 代码专家模型（通过 codebuddy CLI）

### 2. 路由策略 (Routing Strategy)

系统支持多种路由策略：

| 策略 | 说明 | 适用场景 |
|-----|------|---------|
| `auto` | 自动选择最佳模型 | 大多数情况 |
| `fastest_first` | 最快响应优先 | 对速度敏感的任务 |
| `cheapest_first` | 最低成本优先 | 预算有限 |
| `best_quality` | 最佳质量优先 | 对质量要求高的任务 |
| `round_robin` | 轮询 | 负载均衡 |
| `manual` | 手动指定 | 明确知道要用哪个模型 |

### 3. 任务类型 (Task Type)

根据任务类型选择最合适的模型：

- `code_generation` - 代码生成
- `code_review` - 代码审查
- `conversation` - 对话
- `translation` - 翻译
- `summarization` - 摘要
- `analysis` - 分析
- `command_generation` - 命令生成
- `debug` - 调试
- `general` - 通用

---

## 架构说明

### 文件结构

```
src/core/modelRouter/
├── types.ts                    # 类型定义
├── BaseAdapter.ts              # 适配器基类
├── ModelRouter.ts              # 路由引擎
├── config.ts                   # 配置管理
├── index.ts                    # 导出入口
└── adapters/
    ├── GoogleAdapter.ts        # Google Gemini 适配器
    ├── QwenAdapter.ts          # Qwen 适配器
    └── CodebuddyAdapter.ts     # Codebuddy 适配器
```

### 工作流程

```
1. 用户发起任务请求
   ↓
2. ModelRouter 根据配置和策略选择适配器
   ↓
3. 检查适配器可用性（healthCheck）
   ↓
4. 适配器执行任务（调用对应的 CLI）
   ↓
5. 返回结果并更新统计信息
```

---

## 使用示例

### 示例 1: 代码生成（自动路由）

```bash
yuangs router exec "用 Python 写一个二叉树遍历函数" \
  -t code_generation \
  -s auto
```

系统会自动选择最适合代码生成的模型（可能是 Codebuddy 或 Google Gemini）。

### 示例 2: 翻译（最快优先）

```bash
yuangs router exec "Translate: Hello World" \
  -t translation \
  -s fastest_first
```

选择响应最快的模型进行翻译。

### 示例 3: 代码审查（指定模型）

```bash
yuangs router exec "审查这段代码..." \
  -t code_review \
  -m codebuddy
```

明确使用 Codebuddy 进行代码审查。

### 示例 4: 查看统计和优化

```bash
# 查看所有模型的表现
yuangs router stats

# 根据统计结果，配置常用任务的默认模型
yuangs router config map code_generation codebuddy
yuangs router config map translation qwen
```

---

## 安装前置条件

### Google Gemini

```bash
# 1. 安装 gcloud CLI
curl https://sdk.cloud.google.com | bash

# 2. 初始化
gcloud init

# 3. 认证
gcloud auth login

# 4. 测试
yuangs router test google-gemini
```

### Qwen (通义千问)

```bash
# 1. 安装（假设通过 pip）
pip install qwen-cli

# 2. 配置 API Key
qwen config set api-key YOUR_API_KEY

# 3. 测试
yuangs router test qwen
```

### Codebuddy

```bash
# 1. 安装
npm install -g codebuddy-cli

# 2. 登录或配置
codebuddy login

# 3. 测试
yuangs router test codebuddy
```

---

## 配置文件

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
  }
}
```

---

## 编程接口

如果你想在代码中使用路由系统：

```typescript
import { executeTask, TaskType, RoutingStrategy } from 'yuangs/core/modelRouter';

const result = await executeTask(
  '你的提示词',
  {
    type: TaskType.CODE_GENERATION,
    description: '任务描述',
  },
  {
    strategy: RoutingStrategy.AUTO,
  }
);

console.log(result.content);
```

完整示例见 `examples/router-example.ts`。

---

## 自定义适配器

你可以为任何支持 CLI 的 AI 工具创建适配器：

```typescript
// 1. 创建适配器类
export class MyAdapter extends BaseAdapter {
  name = 'my-model';
  version = '1.0.0';
  provider = 'MyProvider';
  
  capabilities: ModelCapabilities = {
    // ... 配置能力
  };

  async healthCheck(): Promise<boolean> {
    // 检查 CLI 是否可用
  }

  async execute(prompt, config, onChunk): Promise<ModelExecutionResult> {
    // 调用 CLI 并返回结果
  }
}

// 2. 在 createRouter() 中注册
router.registerAdapter(new MyAdapter());

// 3. 启用适配器
yuangs router config enable my-model
```

---

## 最佳实践

### 1. 根据任务特性配置默认模型

```bash
# 代码相关任务用专业工具
yuangs router config map code_generation codebuddy
yuangs router config map code_review codebuddy
yuangs router config map debug codebuddy

# 对话和翻译用中文优化的模型
yuangs router config map conversation qwen
yuangs router config map translation qwen

# 长上下文任务用 Gemini
yuangs router config map analysis google-gemini
```

### 2. 控制成本

```bash
# 限制使用高成本模型
yuangs router config set maxCostLevel 2

# 优先使用低成本模型
yuangs router exec "..." -s cheapest_first
```

### 3. 监控和优化

```bash
# 定期查看统计
yuangs router stats

# 根据成功率调整配置
# 如果某个模型失败率高，考虑换用其他模型
```

### 4. 测试新适配器

```bash
# 先测试再启用
yuangs router test new-adapter
yuangs router config enable new-adapter
```

---

## 故障排查

### 问题：适配器显示"不可用"

**解决方案：**

1. 检查 CLI 是否已安装：
   ```bash
   command -v gcloud
   command -v qwen
   command -v codebuddy
   ```

2. 检查认证：
   ```bash
   gcloud auth list
   qwen config show
   ```

3. 手动测试：
   ```bash
   yuangs router test <adapter-name>
   ```

### 问题：任务执行超时

**解决方案：**

```bash
# 增加超时时间
yuangs router config set maxResponseTime 60000
```

### 问题：配置未生效

**解决方案：**

```bash
# 查看当前配置
yuangs router config show

# 重置并重新配置
yuangs router config reset
```

---

## 性能对比

根据实际测试（数据仅供参考）：

| 模型 | 平均响应时间 | 代码生成质量 | 中文理解 | 成本 |
|-----|------------|------------|---------|-----|
| Google Gemini | 2000ms | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💰💰 |
| Qwen | 1500ms | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰💰 |
| Codebuddy | 3000ms | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 💰💰💰 |

---

## 技术支持

- 📖 完整文档: [docs/MODEL_ROUTER_GUIDE.md](docs/MODEL_ROUTER_GUIDE.md)
- 💡 示例代码: [examples/router-example.ts](examples/router-example.ts)
- 🐛 问题反馈: GitHub Issues
- 💬 讨论: GitHub Discussions

---

## 贡献

欢迎贡献新的适配器或改进现有功能！

### 添加新适配器

1. 在 `src/core/modelRouter/adapters/` 创建适配器
2. 在 `src/core/modelRouter/index.ts` 注册
3. 添加文档和示例
4. 提交 PR

---

## 许可证

ISC License

---

## 更新日志

### v1.0.0 (2026-01-27)

- ✨ 初始发布
- ✅ 支持 Google Gemini、Qwen、Codebuddy
- ✅ 多种路由策略
- ✅ 完整的 CLI 接口
- ✅ 统计和监控功能
- ✅ 可扩展的适配器系统
