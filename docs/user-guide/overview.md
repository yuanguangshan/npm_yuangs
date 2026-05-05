这是一份基于你提供的源代码（v3.47.0）和现有文档碎片整理而成的**完整用户使用说明文档**。

这份文档旨在将 `yuangs` 定义为一个**生产力工具**，而非简单的聊天机器人。它强调了项目的核心哲学：“**AI 提供思路，人类掌控执行**”。

---

# yuangs CLI 用户使用手册

> **版本**: 3.47.0
> **核心理念**: AI 提供思路，人类掌控执行 (AI provides ideas, Humans control execution)

## 📖 1. 简介

**yuangs** 是一个遵循 Unix 哲学的 AI 增强型终端工具。它不是一个试图接管你电脑的“黑盒代理”，而是一个透明、可审计、可治理的 **智能 Shell 伴侣**。

它解决了传统终端 AI 工具的痛点：
*   ❌ 盲目执行危险命令 (`rm -rf`)
*   ❌ 上下文丢失
*   ❌ 无法审计 AI 的决策过程

**yuangs 的能力：**
*   **全域感知**：理解文件、目录、Git 状态。
*   **安全治理**：所有高风险操作均需人类确认，并受 WASM 策略引擎保护。
*   **双引擎驱动**：简单任务极速响应，复杂任务自动规划 (Planner)。
*   **可解释性**：每一条命令的生成原因都可以被追溯和重放。

---

## 🚀 2. 安装与配置

### 安装
确保 Node.js >= 18。

```bash
npm install -g yuangs
```

### 初始化配置
配置你的 AI 模型首选项（推荐使用 Gemini 2.5 Flash Lite 以获得最佳速度/成本比）。

```bash
# 查看当前配置
yuangs config list

# 设置默认模型
yuangs config model set gemini-2.5-flash-lite

# 设置 API 代理地址 (如有需要)
yuangs config set aiProxyUrl "https://your.proxy/v1/chat/completions"
```

### 安装 Shell 补全 (强烈推荐)
支持 Bash 和 Zsh，提供命令和文件路径的智能补全。

```bash
# Zsh 用户
yuangs completion zsh
source ~/.zshrc

# Bash 用户
yuangs completion bash
source ~/.bashrc
```

---

## 🎮 3. 核心交互模式

### 3.1 交互式 Chat 模式 (REPL)
这是最常用的模式，支持多轮对话和上下文记忆。

```bash
yuangs ai
```
进入后，你可以像在 Shell 中一样打字，但拥有了 AI 超能力。

### 3.2 单次命令模式 (One-shot)
快速获取答案或生成命令，无需进入交互界面。

```bash
# 纯问答
yuangs ai "如何解压 tar.gz 文件？"

# 生成并执行命令 (带风险评估)
yuangs ai -e "查找当前目录下大于 100M 的文件"
```

### 3.3 Zero-Mode (极简模式)
*需运行安装脚本 `scripts/yuangs-install.sh`*

在你的原生 Shell (Zsh/Bash) 中直接触发 AI，无需输入 `yuangs` 前缀：

*   **`?? <问题>`**: 直接提问。
    *   *示例*: `?? 怎么查看端口占用`
*   **空行 + Enter**: 在交互模式下直接唤起 AI。

---

## 🧠 4. 上下文管理 (Context)

这是 `yuangs` 最强大的功能。你可以显式地将文件系统的状态“喂”给 AI。

| 语法 | 功能描述 | 示例 |
| :--- | :--- | :--- |
| **`@文件`** | 读取文件内容加入上下文 | `@package.json` |
| **`@文件:行号`** | **精准读取**：只读取指定行范围 | `@src/app.ts:10-50` |
| **`#目录`** | **目录扫描**：递归读取目录下所有文件 | `#src/utils` |
| **`@!脚本`** | **执行并分析**：运行脚本，将**源码+输出+报错**打包给 AI | `@!test.sh` (用于修 Bug 神器) |
| **Git 自动感知** | 自动读取当前仓库的 `diff` 信息 | (无需操作，自动生效) |

**交互式管理命令：**
*   `:ls`: 列出当前 AI 记住的所有上下文。
*   `:cat [id]`: 查看某条上下文的具体内容。
*   `:clear`: 清空所有上下文记忆。

---

## 🛠 5. 执行与治理 (Execution & Governance)

`yuangs` 不会偷偷执行命令。所有操作遵循 **Proposal (提议) -> Governance (治理) -> Execution (执行)** 的流程。

### 5.1 智能执行
当 AI 建议执行命令时（如 `shell_cmd` 或 `tool_call`）：

1.  **低风险 (Low)**: 自动执行（如 `ls`, `cat`）。
2.  **中/高风险 (Medium/High)**: 弹出 **风险告知书**，需用户输入 `y` 确认。
    *   *风险告知书内容*：操作描述、潜在问题、推荐行动、回滚检查点。

### 5.2 原子执行 (`:exec`)
在交互模式下，如果你想绕过 AI 直接运行系统命令（例如 `cd`, `vim`），使用 `:exec`。

```bash
# 不经过 AI 思考，直接运行
:exec ls -la
:exec vim config.json
```

### 5.3 双 Agent 规划 (Dual Agent)
当你输入复杂指令（包含“重构”、“批量”、“优化”等关键词）时，系统会自动启动 **Planner (规划者)**。

1.  **Planner**: 生成分步执行计划。
2.  **User**: 确认计划。
3.  **Executor**: 逐个步骤执行，每一步都受到治理监控。

---

## ⚡ 6. 高级功能

### 6.1 技能学习 (Skills)
系统会自动从成功的交互中学习。
*   如果你教会了 AI 怎么部署你的项目，它会将其存为技能。
*   **管理命令**: `yuangs skills list`, `yuangs skills disable <name>`.

### 6.2 宏 (Macros)
将常用的复杂指令保存为快捷方式。

```bash
# 保存上一条 AI 生成的命令为 'deploy'，并添加到系统 Alias
yuangs save deploy -l -g

# 之后直接运行
yuangs run deploy
# 或者 (如果加了 -g)
deploy
```

### 6.3 审计与重放 (Audit & Replay)
每一次执行都会生成唯一的 `ExecutionRecord`。

```bash
# 解释刚才发生了什么
yuangs explain last

# 重放某次历史操作 (用于调试或复现)
yuangs replay <execution_id>
```

---

## ❓ 7. 常见问题 (FAQ)

**Q: 为什么输入 `:cat` 没反应？**
A: 请确保在 `yuangs ai` 的交互模式下使用。`:cat` 用于查看 AI 当前持有的上下文内容。

**Q: 如何处理 "500 Error"？**
A: 通常是模型配置问题。尝试切换模型：`yuangs config model set gemini-2.5-flash-lite`。

**Q: Git Diff 是怎么工作的？**
A: 只要你在 Git 仓库中运行 `yuangs ai`，它会自动检测 `git diff` (未暂存) 和 `git diff --staged` (已暂存) 的内容，并将其作为 System Prompt 的一部分。

**Q: 为什么有时候会显示 "Refactor" 模式？**
A: 这是 Dual Agent 引擎。当系统检测到任务复杂度较高（如修改多个文件），会自动切换到规划模式，以确保安全和准确。

---

> **结语**
> yuangs 的设计初衷是让开发者在使用 AI 时保持**尊严**和**控制权**。我们相信代码的最终责任人永远是人类，AI 是最强大的副驾驶。