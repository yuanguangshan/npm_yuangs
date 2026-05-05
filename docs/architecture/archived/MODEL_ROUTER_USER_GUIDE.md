# 模型路由系统 - 用户使用报告

## 1. 概述

yuangs 多模型路由系统是一个智能的 AI 模型管理工具,能够根据任务特性自动选择最合适的 AI 模型。系统支持多个主流 AI 服务商(Google、阿里云、Codebuddy),并提供灵活的路由策略和配置选项。

**主要优势:**
- 🎯 智能模型选择:根据任务类型自动选择最匹配的模型
- ⚡ 多种路由策略:均衡、成本优先、速度优先、质量优先
- 🔧 灵活配置:支持 CLI 命令和配置文件两种管理方式
- 📊 实时统计:监控模型使用情况和性能指标
- 🛡️ 故障保护:自动熔断和恢复机制

---

## 2. 快速开始

### 2.1 环境准备

在使用前,需要安装对应的 CLI 工具:

```bash
# Google Gemini
gcloud init
gcloud auth login

# 阿里通义千问
pip install qwen-cli
qwen config set api-key YOUR_API_KEY

# Codebuddy
npm install -g codebuddy-cli
codebuddy login
```

### 2.2 基本使用

```bash
# 查看所有可用模型
yuangs router list

# 执行代码生成任务(自动选择)
yuangs router exec "用 Python 写一个快速排序函数" -t code_generation

# 查看统计信息
yuangs router stats

# 测试模型是否可用
yuangs router test google-gemini
```

---

## 3. 功能详解

### 3.1 路由策略

系统提供 6 种路由策略:

| 策略 | 命令参数 | 适用场景 | 权重配置 |
|------|---------|---------|---------|
| **均衡策略** | `auto` 或 `balanced` | 日常任务,综合考量 | taskMatch: 0.4, context: 0.2, latency: 0.2, cost: 0.1, history: 0.1 |
| **成本优先** | `cheapest_first` 或 `cost-saving` | 预算有限,控制成本 | cost: 0.7, taskMatch: 0.2, history: 0.1 |
| **速度优先** | `fastest_first` 或 `latency-critical` | 对响应时间敏感 | latency: 0.7, taskMatch: 0.2, history: 0.1 |
| **质量优先** | `best_quality` 或 `quality-first` | 代码任务,要求高质量 | quality: 0.6, history: 0.2, taskMatch: 0.2 |
| **轮询** | `round_robin` | 负载均衡 | N/A |
| **手动** | `manual` | 明确指定模型 | N/A |

**使用示例:**

```bash
# 成本优先模式
yuangs router exec "翻译这段文字" -t translation -s cheapest_first

# 速度优先模式
yuangs router exec "简单问答" -t conversation -s fastest_first

# 质量优先模式
yuangs router exec "审查这段代码" -t code_review -s best_quality

# 手动指定模型
yuangs router exec "生成代码" -m codebuddy
```

### 3.2 任务类型

系统支持 9 种任务类型,每种类型对应不同的模型选择偏好:

- `code_generation` - 代码生成
- `code_review` - 代码审查
- `conversation` - 对话
- `translation` - 翻译
- `summarization` - 摘要
- `analysis` - 分析
- `command_generation` - 命令生成
- `debug` - 调试
- `general` - 通用

**任务类型映射配置:**

```bash
# 将特定任务类型绑定到固定模型
yuangs router config map code_generation codebuddy
yuangs router config map translation qwen
yuangs router config map analysis google-gemini

# 查看当前映射
yuangs router config show

# 移除映射
yuangs router config unmap code_generation
```

### 3.3 探索机制

系统支持两种探索策略,用于在运行时主动尝试不同的模型:

#### ε-greedy 策略

```bash
# 设置 epsilon=0.1,即 10% 概率随机探索
yuangs router exploration set epsilon_greedy -e 0.1
```

**工作原理:** 有 `epsilon` 的概率随机选择一个非最佳候选模型,有助于发现更好的选择。

#### UCB1 策略

```bash
# 使用 UCB1 算法自动探索
yuangs router exploration set ucb1
```

**工作原理:** 基于置信区间的探索,平衡利用和探索,优先选择未充分使用的模型。

### 3.4 统计和监控

```bash
# 查看所有模型统计
yuangs router stats

# 查看特定模型统计
yuangs router stats google-gemini
```

**统计指标包括:**
- 总请求数
- 成功/失败次数
- 成功率
- 平均响应时间
- 总 tokens 使用量
- 最后使用时间
- EMA(指数移动平均)指标

### 3.5 系统健康检查

```bash
# 执行完整系统自检
yuangs router doctor

# 执行混沌测试(模拟故障场景)
yuangs router doctor --chaos
```

---

## 4. 配置管理

### 4.1 配置文件

配置文件位置: `~/.yuangs-router.json`

**默认配置:**

```json
{
  "defaultStrategy": "auto",
  "maxResponseTime": 30000,
  "maxCostLevel": 5,
  "enableFallback": true,
  "enabledAdapters": [
    "google-gemini",
    "qwen",
    "codebuddy"
  ],
  "taskTypeMapping": {},
  "adapterConfigs": {},
  "exploration": {
    "strategy": "none",
    "epsilon": 0.1
  }
}
```

### 4.2 CLI 配置命令

```bash
# 查看配置
yuangs router config show

# 修改配置项
yuangs router config set maxResponseTime 60000
yuangs router config set defaultStrategy cheapest_first

# 重置配置
yuangs router config reset
```

### 4.3 适配器管理

```bash
# 启用适配器
yuangs router config enable google-gemini

# 禁用适配器
yuangs router config disable qwen
```

### 4.4 策略管理

```bash
# 列出所有可用策略
yuangs router policy list

# 设置默认策略
yuangs router policy set balanced
yuangs router policy set cost-saving
yuangs router policy set latency-critical
yuangs router policy set quality-first
```

---

## 5. 实战场景

### 5.1 场景 1: 代码开发

```bash
# 使用质量优先策略进行代码审查
yuangs router exec "审查这段代码的性能问题" \
  -t code_review \
  -s best_quality

# 针对代码生成任务固定使用 Codebuddy
yuangs router config map code_generation codebuddy
yuangs router exec "实现一个二叉搜索树" -t code_generation
```

### 5.2 场景 2: 成本控制

```bash
# 设置全局成本优先策略
yuangs router policy set cost-saving

# 限制最大成本等级
yuangs router config set maxCostLevel 2

# 禁用高成本模型
yuangs router config disable codebuddy
```

### 5.3 场景 3: 高并发场景

```bash
# 使用轮询策略进行负载均衡
yuangs router exec "批量处理任务" -s round_robin

# 启用探索机制
yuangs router exploration set epsilon_greedy -e 0.05
```

### 5.4 场景 4: 长上下文任务

```bash
# 大上下文分析任务
yuangs router exec "分析这个大型项目的架构设计" \
  -t analysis \
  -s best_quality \
  --context-size 200000
```

---

## 6. 最佳实践

### 6.1 根据业务场景选择策略

```bash
# 日常开发 - 均衡策略
yuangs router policy set balanced

# 预算受限 - 成本优先
yuangs router policy set cost-saving

# 生产环境 - 质量优先
yuangs router policy set quality-first

# 测试环境 - 速度优先
yuangs router policy set latency-critical
```

### 6.2 定期监控和优化

```bash
# 每周查看统计
yuangs router stats

# 根据表现调整任务映射
# 如果某个模型成功率低,考虑换用其他模型
yuangs router config map code_generation qwen
```

### 6.3 使用探索机制

```bash
# 在非关键任务上启用探索,发现更好的选择
yuangs router exploration set epsilon_greedy -e 0.1
```

### 6.4 故障预防

```bash
# 定期执行健康检查
yuangs router doctor

# 查看适配器状态
yuangs router list
```

---

## 7. 故障排查

### 7.1 模型显示"不可用"

**可能原因:**
1. CLI 工具未安装
2. 未配置认证
3. 网络连接问题

**解决方案:**

```bash
# 检查 CLI 是否安装
command -v gemini
command -v qwen
command -v codebuddy

# 检查认证状态
gcloud auth list
qwen config show

# 手动测试
yuangs router test google-gemini
```

### 7.2 任务执行超时

**解决方案:**

```bash
# 增加超时时间
yuangs router config set maxResponseTime 60000

# 查看统计,选择更快的模型
yuangs router stats
yuangs router exec "任务" -s fastest_first
```

### 7.3 配置未生效

**解决方案:**

```bash
# 查看当前配置
yuangs router config show

# 重置并重新配置
yuangs router config reset
yuangs router policy set balanced
```

---

## 8. 总结

yuangs 多模型路由系统为 AI 模型管理提供了灵活、智能的解决方案。通过合理配置路由策略、任务类型映射和探索机制,可以:

1. **优化成本**: 根据任务类型和优先级选择性价比最高的模型
2. **提升性能**: 在关键时刻选择最快速或最优质的模型
3. **增强可靠性**: 通过熔断机制和统计监控保证系统稳定性
4. **简化管理**: 统一的 CLI 接口和配置文件降低使用门槛

建议在实际使用中:
- 根据业务场景选择合适的路由策略
- 定期查看统计信息并优化配置
- 在非关键任务上启用探索机制
- 保持监控和健康检查,及时发现和解决问题
