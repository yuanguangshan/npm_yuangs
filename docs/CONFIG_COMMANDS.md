# 配置管理命令使用指南

## 概述

yuangs 现在提供了完整的命令行配置管理系统，让你可以方便地管理 AI 模型和其他配置项，无需手动编辑配置文件。

## 快速开始

```bash
# 查看当前默认模型
yuangs config model

# 列出所有可用模型
yuangs config model list

# 设置默认模型
yuangs config model set gemini-2.5-flash

# 查看所有配置
yuangs config list
```

---

## 模型管理命令

### 1. 查看当前默认模型

```bash
yuangs config model
# 或
yuangs config model get
```

**输出示例：**
```
🤖 当前默认模型

  Model: gemini-2.5-flash
  Provider: Google
  Description: Google 的快速响应模型
  Source: ~/.yuangs.json
```

---

### 2. 列出所有可用模型

```bash
yuangs config model list
```

**输出示例：**
```
🤖 可用 AI 模型

OpenAI:
  * gpt-4o                    OpenAI 最先进的 GPT-4 模型 ⭐ 推荐
    gpt-4o-mini               GPT-4o 的轻量版本
    gpt-4-turbo               GPT-4 的快速版本

Anthropic:
    claude-3.5-sonnet         Anthropic 的高性能模型
    claude-3.5-haiku          Claude 的快速响应模型

Google:
    gemini-2.5-flash          Google 的快速响应模型
    gemini-2.5-flash-lite     Gemini 2.5 的超轻量版本
    gemini-3-flash-preview    Gemini 3 预览版
    gemini-2.5-pro            Google 的高性能模型
    gemini-2.5-pro            Gemini 1.5 高性能模型
    gemini-2.5-flash          Gemini 1.5 快速响应模型

Legacy:
    Assistant                 默认助手模型
```

---

### 3. 设置默认模型

```bash
yuangs config model set <模型名称>
```

**示例：**

```bash
# 设置为 Gemini 2.5 Flash
yuangs config model set gemini-2.5-flash

# 设置为 GPT-4o
yuangs config model set gpt-4o

# 设置为 Claude 3.5 Sonnet
yuangs config model set claude-3.5-sonnet
```

**输出示例：**
```
✔ 默认模型已更新

  旧模型: Assistant
  新模型: gemini-2.5-flash
  配置文件: ~/.yuangs.json

✅ 设置已生效，下次 AI 调用将使用新模型

Google - Google 的快速响应模型
```

**如果模型不存在：**

```bash
yuangs config model set gpt-9-super
```

**输出示例：**
```
❌ 不支持的模型: gpt-9-super

🤖 可用 AI 模型
...
```

---

### 4. 重置为系统默认模型

```bash
yuangs config model reset
```

**输出示例：**
```
✔ 默认模型已重置

  旧模型: gemini-2.5-flash
  新模型: gemini-2.5-flash-lite (系统默认)
  配置文件: ~/.yuangs.json

✅ 设置已生效，下次 AI 调用将使用系统默认模型
```

---

## 通用配置命令

### 1. 列出所有配置

```bash
yuangs config list
```

**输出示例：**
```
⚙️  当前配置 (~/.yuangs.json)

AI 配置:
  defaultModel: gemini-2.5-flash
  aiProxyUrl: https://aiproxy.want.biz/v1/chat/completions

账户配置:
  accountType: paid

上下文配置:
  contextWindow: 8000
  maxFileTokens: 20000
  maxTotalTokens: 200000
```

---

### 2. 读取配置项

```bash
yuangs config get <key>
```

**示例：**

```bash
# 读取默认模型
yuangs config get defaultModel

# 读取 API 地址
yuangs config get aiProxyUrl

# 读取账户类型
yuangs config get accountType
```

**如果配置项不存在：**
```
⚠️  配置项 "unknownKey" 不存在

使用 "yuangs config list" 查看所有配置项
```

---

### 3. 设置配置项

```bash
yuangs config set <key> <value>
```

**示例：**

```bash
# 设置默认模型
yuangs config set defaultModel gemini-2.5-flash

# 设置账户类型
yuangs config set accountType paid

# 设置上下文窗口大小
yuangs config set contextWindow 8000

# 设置 API 地址
yuangs config set aiProxyUrl "https://aiproxy.want.biz/v1/chat/completions"
```

**输出示例：**
```
✔ 配置已更新

  配置项: defaultModel
  旧值: Assistant
  新值: gemini-2.5-flash
  文件: ~/.yuangs.json

✅ 设置已立即生效
```

---

## 单次命令指定模型

除了设置默认模型，你还可以在单次命令中指定模型：

```bash
# 使用指定模型询问
yuangs ai "解释这段代码" --model gpt-4o

# 使用 Claude 3.5 Sonnet
yuangs ai "写一个 Python 脚本" --model claude-3.5-sonnet

# 使用 Gemini Pro
yuangs ai "分析这个问题" --model gemini-2.5-pro
```

**注意：** 使用 `--model` 参数只会影响当前命令，不会修改默认配置。

---

## 支持的模型列表

### OpenAI 模型
- `gpt-4o` - 最先进的 GPT-4 模型 ⭐ 推荐
- `gpt-4o-mini` - GPT-4o 的轻量版本
- `gpt-4-turbo` - GPT-4 的快速版本

### Anthropic 模型
- `claude-3.5-sonnet` - 高性能模型
- `claude-3.5-haiku` - 快速响应模型

### Google 模型
- `gemini-2.5-flash` - 快速响应模型
- `gemini-2.5-flash-lite` - 超轻量版本 ⭐ 系统默认
- `gemini-3-flash-preview` - Gemini 3 预览版
- `gemini-2.5-pro` - 高性能模型
- `gemini-2.5-pro` - Gemini 1.5 高性能模型
- `gemini-2.5-flash` - Gemini 1.5 快速响应模型

### Legacy 模型
- `Assistant` - 默认助手模型

---

## 常见问题

### Q: 设置模型后如何验证是否生效？

A: 使用 `yuangs config model` 查看当前配置，然后询问 AI 它正在使用的模型：

```bash
yuangs ai "你现在使用的是什么模型？"
```

### Q: 如何切换回之前的模型？

A: 模型配置会显示旧模型和新模型，你可以：

1. 记住旧模型名称，再次设置回去
2. 使用 `yuangs config model reset` 重置为系统默认

### Q: 支持的模型会更新吗？

A: 是的，模型列表会定期更新。使用 `yuangs config model list` 查看最新列表。

### Q: 配置文件在哪里？

A: 配置文件位于 `~/.yuangs.json`，你可以手动编辑，但推荐使用命令行命令管理。

### Q: 如何在多个环境间切换配置？

A: 你可以创建多个配置文件并使用环境变量切换：

```bash
# 创建不同的配置文件
cp ~/.yuangs.json ~/.yuangs.work.json
cp ~/.yuangs.json ~/.yuangs.personal.json

# 切换配置
export YUANGS_CONFIG=~/.yuangs.work.json
```

---

## 最佳实践

### 1. 选择合适的模型

**日常使用：**
- `gemini-2.5-flash-lite` - 快速、成本低（推荐）
- `gemini-2.5-flash` - 平衡性能和速度

**复杂任务：**
- `gpt-4o` - 最强推理能力
- `gemini-2.5-pro` - 高性能、长上下文
- `claude-3.5-sonnet` - 适合代码分析

**快速响应：**
- `gemini-2.5-flash-lite` - 最快响应
- `claude-3.5-haiku` - Claude 系列最快

### 2. 根据任务切换模型

```bash
# 默认使用快速模型
yuangs config model set gemini-2.5-flash-lite

# 复杂任务临时切换
yuangs ai "分析这个复杂的架构设计" --model gpt-4o

# 代码生成
yuangs ai "写一个完整的 CRUD API" --model gemini-2.5-pro
```

### 3. 定期检查配置

```bash
# 查看当前配置
yuangs config list

# 确认模型设置
yuangs config model
```

---

## 技术细节

### 配置文件结构

```json
{
  "defaultModel": "gemini-2.5-flash",
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "accountType": "paid",
  "contextWindow": 8000,
  "maxFileTokens": 20000,
  "maxTotalTokens": 200000
}
```

### 配置验证

所有配置在保存前都会通过 Zod schema 验证，确保配置的正确性和类型安全。

### 错误处理

- 模型名称错误会显示可用模型列表
- 配置验证失败会显示详细错误信息
- 不存在的配置项会给出友好提示

---

## 相关命令

- `yuangs ai` - 向 AI 提问（使用当前默认模型）
- `yuangs config list` - 查看所有配置
- `yuangs help` - 显示帮助信息

---

## 更新日志

### v3.45.0 (2026-01-25)
- ✅ 新增 `yuangs config model` 系列命令
- ✅ 新增 `yuangs config list` 命令
- ✅ 新增 `yuangs config get/set` 命令
- ✅ 支持模型元数据展示
- ✅ 支持模型验证和推荐标记
- ✅ 改进配置文件格式化和分组显示

---

## 反馈和贡献

如果你有任何问题或建议，请：
- 提交 Issue: https://github.com/yuanguangshan/npm_yuangs/issues
- 查看 GitHub: https://github.com/yuanguangshan/npm_yuangs
