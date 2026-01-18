
# 🚀 yuangs CLI

**以人类意图为中心的 AI‑Augmented Shell**

一个集 **AI 助手 · 智能 Shell 内核 · 插件化运行时** 于一体的现代终端工具。

> **核心理念**  
> **AI 提供思路，人类掌控执行。**  
> yuangs 致力于在不破坏传统 Shell 心智模型的前提下，引入 AI 的逻辑能力。  
> 它不是黑盒执行器，而是你的 **增强型命令行外脑**。

---

## 🏗️ 执行语义规范（Execution Semantics）

yuangs 通过一套**显式的符号语法**，清晰界定“副作用”的来源，  
确保每一条命令 **可理解、可确认、可审计**。

| 语法 | 行为逻辑 | 决策来源 | 适用场景 |
|---|---|---|---|
| `ls -la` | 直接运行命令（fish-style） | 用户 | 传统 Shell 操作 |
| `@path[:line]` | 引用文件 / 行号上下文 | 用户 | 代码审计、报错分析 |
| `#dir` | 批量引入目录上下文 | 用户 | 项目结构理解 |
| `ai "msg"` | 纯自然语言对话 | AI | 方案讨论、知识查询 |
| `ai -e` | 生成**建议**命令 | AI → 用户 | 复杂命令辅助 |
| `:exec` | 绕过 AI 的原子执行 | 用户 | 确定性脚本 |

---

## 🌟 核心功能

### 1. 智能 Shell 内核（v2.10.0+）

进入交互式 AI‑Augmented Shell：

```bash
yuangs ai
```

特性包括：

- **模式自动路由**  
  无需切换模式：
  - 输入 `git status` → 直接执行  
  - 输入「解释这段代码」→ 进入对话

- **👻 Ghost Text（幽灵建议）**  
  根据历史记录与插件预测输入  
  例如输入 `npm r`，灰色显示 `un dev`，按 `Tab` 采纳

- **⚡ 补全增强**
  - **PATH 扫描**：自动补全 40+ 常用系统命令  
  - **精准行号**：支持 `@src/index.ts:10-50`  
  - **项目感知**：提升 `src/`、`packages/` 等目录权重

---

### 2. 精准上下文管理（ContextBuffer）

#### 管道模式（Pipe Mode）

```bash
cat error.log | yuangs "解释这个报错"
git diff | yuangs -w "Review 变更逻辑"
```

#### `-w` 智能读取

- 自动解析管道中的文件路径
- 只读取**被显式引用**的文件内容
- 不进行隐式文件系统扫描

---

### 3. 插件系统（Plugins）

在 `.shell/plugins/` 下放置自定义脚本，  
扩展特定工具的补全与推理能力（如 `docker`、`kubectl`）。

示例：

```ts
// .shell/plugins/docker.ts
module.exports = {
  command: 'docker',
  complete(args) {
    return ['ps', 'run', 'build', 'exec'];
  }
};
```

---

## 📜 设计宣言（Design Philosophy / Manifesto）

### 工程理性 vs. AI 狂热

yuangs 并不是一个试图“替你完成任务”的工具。  
它诞生于一个更克制的问题：

> **在 AI 能力爆炸的时代，命令行该如何进化，而不背叛工程理性？**

---

### 为什么 yuangs 不是 Autonomous Agent？

Autonomous Agent 承诺：  
给 AI 一个目标，让它自行规划、执行、修正。

但在真实工程环境中，这种模式存在根本缺陷：

> **执行权与责任归属是模糊的。**

因此，在 yuangs 中，我们**明确拒绝**让 AI 拥有：

- 自动执行系统命令的权力  
- 隐式修改文件或运行环境的权力  
- 在未确认的情况下产生任何副作用的权力  

---

## 🔒 行为边界（Agent Boundaries）

yuangs 严格遵循以下边界，以确保长期工程可靠性：

- **非自治性（Human‑in‑the‑loop）**  
  AI 负责推理与建议，人类始终是最终决策者与执行者。

- **副作用隔离（Side‑effect Isolation）**  
  AI 不具备系统写权限。  
  所有建议必须转化为**用户可见的 Action**并经确认后执行。

- **显式上下文（Explicit Context）**  
  除显式输入外，yuangs 不会在后台扫描文件系统。

- **可回溯性（Auditable Records）**  
  所有 AI 建议、命令生成与执行结果均被记录，  
  确保完整决策链条可追溯、可审计。

---

## 💡 使用场景示例

### 场景 A：智能调试

```bash
@!build.sh
# 系统返回报错…

上面的错误是什么意思？
```

AI 将结合 **build.sh 内容 + 实际输出** 进行分析。

---

### 场景 B：命令生成

```bash
ai -e "查找当前目录下大于 100M 的文件"
```

AI 生成建议命令（如 `find . -type f -size +100M`），  
**存入剪贴板，等待你确认执行。**

---

### 场景 C：项目审计

```bash
#src/
分析这些模块的功能
```

AI 在**显式授权**下读取目录内容并生成结构分析。

---

## 📦 安装与配置

```bash
npm install -g yuangs
```

常用配置：

```bash
yuangs config defaultModel Assistant
yuangs config accountType pro
```

---

## 🗓️ 近期更新（Changelog）

- **v2.11.0** (2026‑01‑18)  
  新增 40+ Shell 内置命令支持（cd, pwd, ls, git 等）

- **v2.10.0** (2026‑01‑18)  
  引入 Shell 交互内核、Ghost Text 与插件系统

- **v1.3.67** (2026‑01‑17)  
  新增 `@` 文件选择与 `#` 目录读取功能

---

## ⚖️ 维护者

**@yuanguangshan**

> **AI 提供思路，人类掌控执行。**  
> 这不是妥协，而是对工程理性的尊重。
```

---

### 一句工程师之间的实话

这份 README **已经不是“产品介绍”**了，  
它是一个 **Runtime 的宪法文本**。

