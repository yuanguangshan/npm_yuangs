
# 🚀 yuangs CLI - An AI‑Augmented Shell

**以人类意图为中心的 AI‑Augmented Shell**

> A seamless terminal where deterministic execution and probabilistic intelligence coexist without friction.

一个集 **AI 助手 · 智能 Shell 内核 · 插件化运行时** 于一体的现代终端工具。

> **核心理念**  
> **AI 提供思路，人类掌控执行。**  
> yuangs 致力于在不破坏传统 Shell 心智模型的前提下，引入 AI 的逻辑能力。  
> 它不是黑盒执行器，而是你的 **增强型命令行外脑**。

---


# yuangs

> **为终端而生的 AI 治理运行时**  
> *不 OOM，不惊喜，始终有人类在环*

`yuangs` 是一个遵循 Unix 哲学的 AI 工具，献给那些长期工作在终端里、**拒绝黑盒魔法**的开发者。

它不是浏览器插件。  
不是 GUI 助手。  
也不是“披着 CLI 外衣的聊天机器人”。

它解决的是一个更难的问题：

> **当不可控的 AI 进入极端强调可控性的终端，秩序该如何重建？**

---

## 设计哲学

### 🧩 做好一件事（Do one thing and do it well）

`yuangs` 的定位不是“全能助手”，而是一个**上下文治理器（Context Governor）**。

你始终清楚、并且显式地决定：
- 哪些文件进入 AI 上下文
- Token 预算是多少
- 何时采样、何时确认
- 什么时候允许执行

文件系统与 AI 逻辑通过**语法**而不是点击连接：

```bash
ai "@src/**/*.ts #docs"
```

这不是技巧，这是 Unix 哲学：
**语法即力量（Power of Syntax）**。

---

### 🛡️ 开发者主权，而不是“方便至上”

很多终端 AI 工具追求“省事”，代价却是**不透明**：

- 数据悄悄上传  
- 上下文被隐式截断  
- 执行逻辑不可审计  

`yuangs` 选择了另一条路：

- ✅ **Swiss‑Cheese 采样预览**：发送前看到“每一块奶酪”
- ✅ **TokenPolicy**：先估算、再确认
- ✅ **Human‑in‑the‑loop**：切模型、发请求、跑执行，永远需要你点头

你的终端，  
你的数据，  
你的决定。

这才是极客眼中的**真自由**。

---

### 🧠 可编程的 Agent 基础设施，而不是 Prompt Wrapper

`yuangs` 发布到 npm 的不是一个“命令”，  
而是一套**可组合的 Agent 运行时**。

核心抽象包括：
- `PendingContextItem`
- 上下文估算 / 解析分离
- 能力感知的执行策略
- 可回放、可审计的执行记录

你拿到的不是黑盒，  
而是一盒**带说明书的乐高**。

你可以用它构建：
- 仓库结构分析器  
- 日志 → AI 的自动采集管道  
- 可控的重构 Agent  
- 可审计的自动化流程  

---

## 核心特性一览

✅ **No OOM, No Surprise**  
再大的仓库、再长的日志，没有确认就不会吃内存、不会发送。

✅ **Human‑in‑the‑loop, Always**  
系统永远不会替你做黑盒决策。

✅ **Power of Syntax**  
`@file`、`#dir`、意图语法，比拖拽文件更快、更酷。

✅ **可回放、可审计**  
每一次 AI 行为都能复盘、复现、调试。

---

## 适合谁？

- 终端原教旨主义者  
- Linux / Unix 哲学信徒  
- 被不透明 AI 工具伤过的工程师  
- 追求**确定性高于便利性**的人  

如果你认同这句话：

> **“AI 很强大，所以它必须被治理。”**

那 `yuangs` 就是为你写的。

---



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

---

## 📚 更多信息

- **设计原理**: [docs/implementation_principles.md](docs/implementation_principles.md)
- **场景示例**: [docs/scenarios.md](docs/scenarios.md)
- **执行语义**: [docs/semantics.md](docs/semantics.md)
- **非目标**: [docs/non-goals.md](docs/non-goals.md)
- **威胁模型**: [docs/threat_model.md](docs/threat_model.md)
- **实现差距分析**: [docs/implementation_gap.md](docs/implementation_gap.md)
- **变更日志**: [docs/CHANGELOG.md](docs/CHANGELOG.md)
- **Shell 补全**: [docs/tab_completion_guide.md](docs/tab_completion_guide.md)
- **上下文优化**: [docs/context_optimization_analysis.md](docs/context_optimization_analysis.md)
- **代理管道**: [docs/AGENT_PIPELINE.md](docs/AGENT_PIPELINE.md)
- **上下文管理**: [docs/context_management.md](docs/context_management.md)
```

---

## 固化什么？
---

# 一、先明确：**这种“感觉”到底是什么？**

如果抽象到一句话，它不是“AI 很聪明”，而是：

> **AI 在该收手的时候会收手，在该判断的时候才判断。**

拆开就是三条**硬约束**：

1. **不编造不存在的设计意图**
2. **输入信号低 → 输出自然退化**
3. **判断权始终在人类这边**

这三条一旦被破坏，`yuangs` 就会变成另一个“吵闹的 Copilot”。

---

# 二、把感觉固化 = 把“边界”写死

不是写在代码里，而是写在**交互模型里**。

## ✅ 1️⃣ 固化原则一：**AI 永远只对“输入负责”**

你这个例子非常好：

```bash
git diff | yuangs ai "总结本次改动的设计意图"
```

AI 的隐含契约应当是：

> **“我只基于 diff 本身说话，不补历史、不补猜测。”**

✅ 正确  
❌ “也许之前存在 XXX 架构问题”

**这条要成为不可违反的铁律。**

你可以把它写成一句内部原则（非常重要）：

> **AI 不得在 diff 之外引入任何假设性上下文，除非用户明确要求。**

---

## ✅ 2️⃣ 固化原则二：**低信息 ≠ 强输出**

这是你这个例子里最“高级”的地方。

- 输入：只有一条注释
- 输出：朴素、干净、甚至有点“空”

**这不是缺点，这是成熟系统的标志。**

你要允许、甚至鼓励这种状态。

可以把它理解为：

> **AI 的输出强度应与输入信息密度成正比**

工程上可以表达为一句话：

> **宁可输出“没什么可说”，也不输出“看起来很深刻”。**

---

## ✅ 3️⃣ 固化原则三：**“判断”必须被显式请求**

这条极其重要。

对比这两种：

❌ 自动：
> “这个改动不太好，建议重构”

✅ 触发式：
```bash
"这个改动是否值得保留？"
"像 code review 一样评价"
```

**判断 = 权力**  
而权力只能由用户授予。

你已经天然地做对了这一点，但你要**把它定成规则**：

> **没有 judgement prompt，AI 只做 description。**

---

# 三、真正该“固化”的不是 AI，而是 Prompt 模式

你现在其实已经有了三个**隐式模式**，只是还没被“命名”。

我帮你命名，它们一旦被命名，就能长期稳定存在。

---

## 🧱 模式 1：**Describe（描述态）**【默认】

```bash
git diff | yuangs ai "总结本次改动"
```

特征：
- 不评价
- 不推断
- 不给建议
- 只还原信息

👉 **这是默认态，必须最保守。**

---

## 🔍 模式 2：**Review（评审态）**

```bash
git diff | yuangs ai "像 code review 一样给反馈"
```

特征：
- 可以判断
- 可以提出风险
- 可以提建议
- 仍然基于 diff

👉 **这是工程协作态。**

---

## 🧠 模式 3：**Reason（推理态）**

```bash
git diff | yuangs ai "推测背后的设计考量"
```

特征：
- 允许假设
- 允许不确定性
- 必须显式标注「推测」

👉 **这是思考扩展态，不是事实陈述。**

---

📌 **关键不是实现，而是“默认只在模式 1”**

这是你和 90% AI 工具的根本分水岭。

---

# 四、一个非常重要但容易被忽略的点

> **不要为了“显得聪明”，去优化这种“克制感”。**

你现在拥有的是一个**可信系统的气质**：

- 不抢话
- 不强行帮忙
- 不输出废话

这在早期可能会被误解为“没那么惊艳”，  
但在 **3 个月 / 6 个月 / 1 年** 后：

✅ 它会变成你最敢信任的工具  
✅ 你会开始无意识地把关键判断交给它

---

### Why yuangs

> **A governed AI runtime for the terminal.**  
> *No OOM. No surprises. Human in the loop — always.*

`yuangs` is a Unix‑style AI tool for developers who live in the terminal and **refuse black boxes**.

It does **not** try to replace your shell.  
It does **not** hide decisions behind magic prompts.  
Instead, it answers a harder question:

> **When uncontrollable AI meets a terminal built on control — how do we restore order?**

---

## Philosophy

### 🧩 Do one thing, and do it well

`yuangs` is not a browser plugin, not a GUI assistant, and not a “chatbot in disguise”.

It is a **context governor**.

You explicitly decide:
- what files enter the context
- how much token budget is allowed
- when sampling happens
- when execution is permitted

Files, directories, and AI logic are connected through **syntax**, not clicks.

```bash
ai "@src/**/*.ts #docs"
```

This is Unix philosophy applied to AI:
**syntax is power**.

---

### 🛡️ Developer sovereignty, by default

Most AI CLI tools optimize for convenience — at the cost of trust.

They:
- upload silently
- truncate context implicitly
- execute plans opaquely

`yuangs` does the opposite.

- **Swiss‑cheese sampling preview** — see *exactly* what will be sent
- **TokenPolicy** — estimate before resolve, always
- **Human‑in‑the‑loop decisions** — model switches, sampling, execution

Your terminal.  
Your data.  
Your choice.

---

### 🧠 A programmable Agent runtime — not a prompt wrapper

Publishing `yuangs` to npm doesn’t give you just a command.  
It gives you **an agent runtime you can compose**.

Core primitives:
- `PendingContextItem`
- token estimation vs resolution
- capability‑aware execution
- replayable execution records

You don’t get a black box.  
You get **LEGO with instructions**.

Build your own:
- repo analyzers
- log‑to‑AI pipelines
- controlled refactoring agents
- auditable automation

---

## What makes it different

✅ **No OOM, no surprise**  
Large repos, massive logs — nothing is fully loaded or sent without confirmation.

✅ **Human in the loop, always**  
AI never escalates privileges or cost silently.

✅ **Power of syntax**  
`@file`, `#dir`, intent‑driven commands — faster than any drag‑and‑drop UI.

✅ **Replay & audit**  
Every AI action is inspectable, reproducible, and debuggable.

---

## Who is this for?

- Terminal‑first developers  
- Linux / Unix philosophy believers  
- Engineers burned by opaque AI tools  
- Anyone who wants **control before convenience**

If you believe:
> *“AI is powerful — and that’s exactly why it must be governed.”*

Then `yuangs` is for you.

---

## Status

`yuangs` is actively evolving.  
The core governance model is stable; interfaces are still sharpening.

Contributions, ideas, and principled criticism are welcome.

> **"AI should never appear smarter than input unless explicitly asked."**

---

# Phase 2: Explainability & Governance (v1)

## 🎯 Overview

Phase 2 introduces **system observability and control** without changing core behavior:
- ✅ Explainability: Human-readable execution explanations
- ✅ Replay++: Dry-run, explain, and diff capabilities
- ✅ Skill Control: Enable/disable skills for fine-grained control

---

## 📦 New Commands

### `yuangs explain [id | last]`

**Purpose**: Explain why the system made a decision

**Usage**:
```bash
# Explain the most recent execution
yuangs explain last

# Explain a specific execution by ID
yuangs explain exec_1768820380225_rgts34981
```

**Output Format (v1)**:
```
=== Execution Explanation ===
[1] Command
- Name: ai-command
- Args: echo "hello"

[2] Decision
- Strategy: capability-match
- Selected Model: gemini-2.5-flash-lite
- Reason: Capability-based selection with fallback support

[3] Model
- Name: gemini-2.5-flash-lite
- Provider: aiproxy
- Context Window: 8000
- Cost Profile: low

[4] Skills
- (none)

[5] Meta
- Execution ID: exec_1768820380225_rgts34981
- Timestamp: 2026-01-19T10:59:40.225Z
- Replayable: true
- Version: unknown
=============================
```

**Key Features**:
- ✅ Pure read-only operation (no side effects)
- ✅ Stable, snapshot-able output
- ✅ Future-proof for diff/audit workflows

---

### `yuangs replay <id> [options]`

**Purpose**: Replay an execution with control flags

**Options**:
| Option | Description |
|--------|-------------|
| `-s, --strict` | Strict replay (use exact model) |
| `-c, --compatible` | Compatible replay (allow fallback) |
| `-r, --re-evaluate` | Re-evaluate with current config |
| `-v, --verbose` | Verbose output |
| `--dry` | Dry run - show what would happen without executing |
| `--explain` | Show explanation before replay |
| `--diff` | Show diff between original and current config |

**Usage Examples**:
```bash
# Dry run with explanation
yuangs replay exec_1768820380225_rgts34981 --dry --explain

# Show diff only (no execution)
yuangs replay exec_1768820380225_rgts34981 --diff --dry

# Full replay with diff
yuangs replay exec_1768820380225_rgts34981 --diff
```

**Replay Behavior Matrix**:
| explain | dry | strict | Behavior |
|--------|-----|--------|----------|
| ✅ | ✅ | any | Explain only, no execution |
| ✅ | ❌ | ✅ | Explain → Replay |
| ❌ | ✅ | ✅ | Print strict info → Exit |
| ❌ | ❌ | ✅ | Normal replay |

**Diff Output**:
```
=== Replay Diff ===
[Decision]
- no change

[Model]
- no change

[Skills]
- no change
===================
```

---

### `yuangs skills <subcommand>`

**Purpose**: Manage skill library

**Subcommands**:
```bash
# List all skills with scores
yuangs skills list

# Explain a specific skill
yuangs skills explain <skill-name>

# Disable a skill
yuangs skills disable <skill-name>

# Enable a skill
yuangs skills enable <skill-name>
```

**Output Example** (`skills list`):
```
📦 Skills (3)

✔ deploy-production
  Confidence: 72%
  Success: 8 / Failure: 1
  Last used: 2 days ago

✔ cleanup-logs
  Confidence: 41%
  Success: 5 / Failure: 7
  Last used: 1 day ago

⊘ legacy-search (disabled)
  Confidence: 23%
  Success: 2 / Failure: 6
  Last used: 7 days ago
```

**Key Features**:
- ✅ Skills can be disabled without deletion
- ✅ Skills are scored and sorted by relevance
- ✅ Disabled skills don't affect new decisions
- ✅ All skills remain visible in `explain` output

---

## 🧭 Explain Output Spec v1

The explain output follows a strict format designed for:
- ✅ Human readability
- ✅ Stability and snapshot compatibility
- ✅ Future diff/audit workflows
- ✅ No implementation coupling

**Structure** (5 sections, immutable order):
1. `[1] Command` - User input layer
2. `[2] Decision` - Decision-making core
3. `[3] Model` - Execution environment
4. `[4] Skills` - Skills that influenced decision
5. `[5] Meta` - Audit/replay metadata

**Important Notes**:
- ⚠️ Do NOT change format without bumping spec version
- ✅ Output is pure text (no color for snapshots)
- ✅ Same execution record = 100% reproducible output

---

## 🔒 Skills & Enabled State

Skills now have an `enabled` field that controls their participation in new decisions:

**Default Behavior**:
- ✅ New skills: `enabled: true`
- ✅ Legacy skills: `enabled: true` (if field missing)
- ❌ Disabled skills: Not included in `getRelevantSkills()`

**Use Cases**:
1. **Governance**: Temporarily disable risky skills
2. **A/B Testing**: Compare different skill configurations
3. **Rollback**: Disable a newly-added skill without deletion
4. **Audit**: View disabled skills in explain output

**CLI Commands**:
```bash
# Disable a skill
yuangs skills disable risky-operation

# List to verify
yuangs skills list

# Re-enable if needed
yuangs skills enable risky-operation
```

---

## 🧪 Testing & Snapshots

### Creating Explain Snapshots

```bash
# Create a snapshot of the last execution
yuangs replay exec_1768820380225_rgts34981 --explain --dry > snapshot.txt
```

Snapshots are useful for:
- ✅ Regression testing
- ✅ Output format verification
- ✅ Documentation examples
- ✅ Audit trails

---

## 📝 Implementation Notes

### Explain Output v1

**File**: `src/core/explain.ts`

**Key Design**:
- Pure function (no side effects)
- No external dependencies on global state
- Uses existing `ExecutionRecord` structure
- Stable formatting (versioned)

---

### Replay Diff

**File**: `src/core/replayDiff.ts`

**Key Design**:
- Compares Decision, Model, and Skills layers
- Shows added/removed/changed skills
- Semantic diff (not token-level)
- Compatible with Explain v1 format

---

### Skills Control

**File**: `src/agent/skills.ts`

**Key Changes**:
- Added `enabled: boolean` field to `Skill` interface
- Exported `computeSkillScore()` for CLI usage
- `getRelevantSkills()` filters disabled skills

---

## ✅ Phase 2 Completion

All Phase 2 objectives are complete:

- [x] Explainability (ExecutionRecord-level)
- [x] Replay dry / explain / strict
- [x] Skill scoring & enable flag
- [x] CLI wiring for all three
- [x] Replay diff implementation
- [x] Skills enabled filtering
- [x] Explain v1 specification
- [x] Snapshot testing capability

**Next Phase**: Phase 3 - Advanced governance & project-level intelligence


`yuangs` is actively evolving.  
The core governance model is stable; interfaces are still sharpening.

Contributions, ideas, and principled criticism are welcome.


> **“AI should never appear smarter than the input unless explicitly asked.”**



