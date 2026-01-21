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
也不是"披着 CLI 外衣的聊天机器人"。

它解决的是一个更难的问题：

> **当不可控的 AI 进入极端强调可控性的终端，秩序该如何重建？**

---

## 设计哲学

### 🧩 做好一件事（Do one thing and do it well）

`yuangs` 的定位不是"全能助手"，而是一个**上下文治理器（Context Governor）**。

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

### 🛡️ 开发者主权，而不是"方便至上"

很多终端 AI 工具追求"省事"，代价却是**不透明**：
- 数据悄悄上传
- 上下文被隐式截断
- 执行逻辑不可审计

`yuangs` 选择了另一条路：
- ✅ **Swiss‑Cheese 采样预览**：发送前看到"每一块奶酪"
- ✅ **TokenPolicy**：先估算、再确认
- ✅ **Human‑in‑the‑loop**：切模型、发请求、跑执行，永远需要你点头

你的终端，
你的数据，
你的决定。

这才是极客眼中的**真自由**。

---

### 🧠 可编程的 Agent 基础设施，而不是 Prompt Wrapper

`yuangs` 发布到 npm 的不是一个"命令"，
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

✅ **可解释、可治理**  
通过 `explain` 和 `replay` 命令，理解系统决策过程。

---

## 适合谁？

- 终端原教旨主义者
- Linux / Unix 哲学信徒
- 被不透明 AI 工具伤过的工程师
- 追求**确定性高于便利性**的人

如果你认同这句话：

> **"AI 很强大，所以它必须被治理。"**

那 `yuangs` 就是为你写的。

---

## 📜 语法说明

yuangs 通过一套**显式的符号语法**，清晰界定"副作用"的来源，
确保每一条命令 **可理解、可确认、可审计**。

| 语法 | 行为逻辑 | 决策来源 | 适用场景 |
| :--- | :--- | :--- | :--- |
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

### 1.5 yuangs Zero-Mode (极简 Shell AI 增强)

如果你不想进入专门的交互模式，`yuangs` 提供了一个"零侵入"的集成方案，让你在原本的 Bash/Zsh 中保持心流：

#### 📦 安装与卸载

```bash
# 安装
bash ./scripts/yuangs-install.sh

# 卸载
bash ./scripts/yuangs-install.sh --uninstall
```
安装后请执行 `source ~/.zshrc` (或 `.bashrc`)。

#### 🚀 核心玩法

1. **`?? <问题>` (即时咨询)**
   在任何时候，只需输入 `??` 加空格，即可向 AI 提问。
   ```bash
   ?? 怎么解压一个 .tar.gz 文件到指定目录？
   ```

2. **回车即救急 (Failed-Command Help)**
   当你执行一个命令失败时（例如 `git push` 被拒绝），终端会提示：
   `↳ Need help? Press Enter`
   此时**直接按回车**，AI 会通过 `yuangs` 的上下文治理能力，自动分析错误原因并给出修复方案。

3. **开关自如**
   - `ai_off`: 临时禁用 AI 触发逻辑。
   - `ai_on`: 重新启用 AI 增强。

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

## 🔒 Phase 2: Explainability & Governance (v1)

### 🎯 概述

Phase 2 引入了**系统可观测性和控制能力**，但不改变核心行为：
- ✅ **Explainability**：人类可读的执行解释
- ✅ **Replay++**：Dry-run、explain 和 diff 能力
- ✅ **Skill Control**：启用/禁用技能以实现细粒度控制

---

## 📦 新命令

### `yuangs explain [id | last]`

**目的**：解释系统为什么做出某个决策

**用法**：
```bash
# 解释最近一次执行
yuangs explain last

# 解释指定 ID 的执行
yuangs explain exec_1768820380225_rgts34981
```

**输出格式（v1）**：
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

**关键特性**：
- ✅ 纯只读操作（无副作用）
- ✅ 稳定、可 snapshot 的输出
- ✅ 为未来的 diff/audit 工作流做好的准备

---

### `yuangs replay <id> [options]`

**目的**：使用控制标志重放执行

**选项**：
| 选项 | 描述 |
|--------|-------------|
| `-s, --strict` | 严格重放（使用精确模型） |
| `-c, --compatible` | 兼容重放（允许 fallback） |
| `-r, --re-evaluate` | 使用当前配置重新评估 |
| `-v, --verbose` | 详细输出 |
| `--dry` | Dry run - 显示将要发生的内容但不执行 |
| `--explain` | 在重放前显示解释 |
| `--diff` | 显示原始配置与当前配置的差异 |

**用法示例**：
```bash
# 使用解释进行 dry run
yuangs replay exec_1768820380225_rgts34981 --dry --explain

# 仅显示 diff（不执行）
yuangs replay exec_1768820380225_rgts34981 --diff --dry

# 带差异的完整重放
yuangs replay exec_1768820380225_rgts34981 --diff
```

**重放行为矩阵**：
| explain | dry | strict | 行为 |
|--------|-----|--------|----------|
| ✅ | ✅ | any | 仅解释，不执行 |
| ✅ | ❌ | ✅ | 解释 → 重放 |
| ❌ | ✅ | ✅ | 打印严格信息 → 退出 |
| ❌ | ❌ | ✅ | 正常重放 |

**差异输出**：
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

**目的**：管理技能库

**子命令**：
```bash
# 列出所有技能及其分数
yuangs skills list

# 解释特定技能
yuangs skills explain <skill-name>

# 禁用技能
yuangs skills disable <skill-name>

# 启用技能
yuangs skills enable <skill-name>
```

**输出示例**（`skills list`）：
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

**关键特性**：
- ✅ 技能可以被禁用而不删除
- ✅ 技能按相关性评分和排序
- ✅ 禁用的技能不影响新决策
- ✅ 所有技能在 `explain` 输出中仍然可见

---

## 🧭 Explain 输出规范 v1

explain 输出遵循严格格式，设计用于：
- ✅ 人类可读性
- ✅ 稳定性和 snapshot 兼容性
- ✅ 未来的 diff/audit 工作流
- ✅ 无实现耦合

**结构**（5 个部分，不可变顺序）：
1. `[1] Command` - 用户输入层
2. `[2] Decision` - 决策核心
3. `[3] Model` - 执行环境
4. `[4] Skills` - 影响决策的技能
5. `[5] Meta` - 审计/重放元数据

**重要提示**：
- ⚠️ 不要在升级规范版本时更改格式
- ✅ 输出是纯文本（snapshot 无颜色）
- ✅ 相同执行记录 = 100% 可重现输出

---

## 🔒 技能与启用状态

技能现在有一个 `enabled` 字段，控制它们在新决策中的参与：

**默认行为**：
- ✅ 新技能：`enabled: true`
- ✅ 旧技能：`enabled: true`（如果字段缺失）
- ❌ 禁用的技能：不包含在 `getRelevantSkills()` 中

**使用场景**：
1. **治理**：临时禁用有风险的技能
2. **A/B 测试**：比较不同的技能配置
3. **回滚**：禁用新添加的技能而不删除
4. **审计**：在 explain 输出中查看禁用的技能

**CLI 命令**：
```bash
# 禁用技能
yuangs skills disable risky-operation

# 列出以验证
yuangs skills list

# 如果需要，重新启用
yuangs skills enable risky-operation
```

---

## 🧪 测试与 Snapshots

### 创建 Explain Snapshots

```bash
# 创建最近一次执行的 snapshot
yuangs replay exec_1768820380225_rgts34981 --explain --dry > snapshot.txt
```

Snapshots 可用于：
- ✅ 回归测试
- ✅ 输出格式验证
- ✅ 文档示例
- ✅ 审计线索

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

## 📝 实现说明

### Explain Output v1

**文件**：`src/core/explain.ts`

**关键设计**：
- 纯函数（无副作用）
- 无全局状态的外部依赖
- 使用现有的 `ExecutionRecord` 结构
- 稳定格式（版本化）

---

### Replay Diff

**文件**：`src/core/replayDiff.ts`

**关键设计**：
- 比较 Decision、Model 和 Skills 层
- 显示 added/removed/changed 技能
- 语义 diff（非 token 级别）
- 与 Explain v1 格式兼容

---

### Skills Control

**文件**：`src/agent/skills.ts`

**关键变更**：
- 向 `Skill` 接口添加 `enabled: boolean` 字段
- 导出 `computeSkillScore()` 供 CLI 使用
- `getRelevantSkills()` 过滤禁用的技能

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

- **v2.40.0** (2026‑01‑20)
  - **Governance Refactor**: 实现三阶段执行模型（Pre-Exec 验证 -> Exec 提交 -> Post-Exec 报告）
  - **语义级事实源**: 确保 `Git Result` 与 `Snapshot Verification` 物理分区，消除语义歧义
  - **鲁棒性修复**: 修复了 Git 统计解析及暂存区变更检测失效的 Bug
- **v2.29.0** (2026‑01‑20)
  - 新增 Explainability 功能（`explain` 命令）
  - 新增 Replay++ 支持（`--dry`, `--explain`, `--diff`）
  - 新增 Skills 管理命令（`skills list/explain/disable/enable`）
  - 引入 Explain Output Spec v1 规范
  - 实现 Replay Diff 功能
- **v2.11.0** (2026‑01‑18)
  - 新增 40+ Shell 内置命令支持（cd, pwd, ls, git 等）
- **v2.10.0** (2026‑01‑18)
  - 引入 Shell 交互内核、Ghost Text 与插件系统
- **v1.3.67** (2026‑01‑17)
  - 新增 `@` 文件选择与 `#` 目录读取功能

---

## ✅ Phase 2 完成清单

所有 Phase 2 目标已完成：

- [x] Explainability（ExecutionRecord 级别）
- [x] Replay dry / explain / strict
- [x] Skill scoring & enable 标志
- [x] 所有三个功能的 CLI 集成
- [x] Replay diff 实现
- [x] Skills enabled 过滤
- [x] Explain v1 规范
- [x] Snapshot 测试能力

**下一阶段**：Phase 3 - 高级治理与项目级智能

---

## 📚 更多信息

- **设计原理**: [docs/implementation_principles.md](docs/implementation_principles.md)
- **场景示例**: [docs/scenarios.md](docs/scenarios.md)
- **执行语义**: [docs/semantics.md](docs/semantics.md)
- **非目标**: [docs/non-goals.md](docs/non-goals.md)
- **威胁模型**: [docs/threat_model.md](docs/threat_model.md)
- **变更日志**: [docs/CHANGELOG.md](docs/CHANGELOG.md)
- **Shell 补全**: [docs/tab_completion_guide.md](docs/tab_completion_guide.md)
- **上下文优化**: [docs/context_optimization_analysis.md](docs/context_optimization_analysis.md)
- **代理管道**: [docs/AGENT_PIPELINE.md](docs/AGENT_PIPELINE.md)
- **上下文管理**: [docs/context_management.md](docs/context_management.md)

---

## ⚖️ 维护者

**@yuanguangshan**

> **AI 提供思路，人类掌控执行。**
> 这不是妥协，而是对工程理性的尊重。

---

## 状态

`yuangs` 正在积极演进中。
核心治理模型已稳定；接口仍在优化中。

欢迎贡献、想法和有原则的批评。

> **"AI 除非被明确要求，否则不应该比输入看起来更聪明。"**

---

## 🔐 Code Change Governance System

The governance system provides safe, auditable code changes with human oversight. All features follow constitutional principles and have been fully verified.

### Key Features

- ✅ **Three-Phase Model**: 物理分区 Pre-Exec (验证), Exec (提交), Post-Exec (审计)
- ✅ **Proposal-First**: All changes start as proposals, no execution without review
- ✅ **Human-in-the-Loop**: Explicit approval with diff preview and risk assessment
- ✅ **Snapshot Safety**: Automatic rollback on failure
- ✅ **Strict Truth Sources**: 明确区分 Patch Truth, Snapshot Truth 与 Git Truth
- ✅ **Audit Trail**: Complete lifecycle tracking for every action

### Demo Summary

| Demo # | Feature | Status |
--------|---------|--------|
| 1 | Diff creation | ✅ Working |
| 2 | Proposal | ✅ Working |
| 3 | List actions | ✅ Working |
| 4 | Approval with review | ✅ Working |
| 5 | Execution with snapshot | ✅ Working |
| 6 | Failure and rollback | ✅ Working |
| 7 | Action status | ✅ Working |
| 8 | Full workflow | ✅ Working |
| 9 | State invariants | ✅ Working |
| 10 | Capability tokens | ✅ Working |
| 11 | Crash recovery | ✅ Working |
| 12 | Persistence audit | ✅ Working |
| 13 | Risk assessment | ✅ Working |

### Quick Start

```bash
# Propose a code change
yuangs diff-edit propose /path/to/patch.patch --rationale "Your rationale"

# List pending actions
yuangs diff-edit list

# Review and approve
yuangs diff-edit approve <action-id>

# Execute with safety
yuangs diff-edit exec <action-id>
```

### Documentation

- 📖 **Complete Demo Guide**: [DEMO.md](DEMO.md) - Detailed runnable examples for all features
- ✅ **Verification Report**: [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) - Implementation status confirmation

### Available Commands

```bash
yuangs diff-edit propose <file>     # Submit a diff for review
yuangs diff-edit list               # View all actions
yuangs diff-edit approve <id>       # Review and approve
yuangs diff-edit exec <id>          # Execute approved action
yuangs diff-edit status <id>        # Check action status
```

---

*此内容由插件自主更新*

diff-edit使本项目有了质的变化。^-^

