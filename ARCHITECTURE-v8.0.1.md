# yuangs CLI v8.0.1 架构分析

> 分析时间：2026-08-30 · 基线：`d32bfa1 (tag: v8.0.1)`
> 规模：src 272 文件 / 46,883 行 TypeScript，测试 76 文件

---

## 一、这到底是什么

对外叙事是 **AI-Augmented Shell**——"AI 提供思路，人类掌控执行"。去掉叙事，它实际是三件事的合体：

| 身份 | 说明 | 代码证据 |
|---|---|---|
| ① 终端 AI 问答器 | 管道喂数据 + `@文件`/`#目录` 精准投喂上下文 + 流式 Markdown | `handleAIChat.ts`(936)、`utils/syntax/`(1152) |
| ② Git 自动化工厂 | plan → auto/exec 自动改代码 → review 审查 → commit 生成 message | `core/git/`(4865)、`core/workflows/`(1512) |
| ③ Agent 治理运行时 | 危险命令拦截、风险分级、token 预算、全程审计可回放 | `agent/`(10020)、`audit/`(626)、`policy/token/`(410) |

核心主张是 **No OOM, No Surprise**——不发未经确认的大上下文、不执行未经确认的写操作。

---

## 二、分层架构

| 层 | 目录 | 行数 | 职责 |
|---|---|---|---|
| L1 命令入口 | `cli.ts` + `commands/` | 4,437 | Commander 注册 10 组命令 + 交互会话 + Zero-Mode |
| L2 运行时 | `agent/` 运行时部分 | — | 4 套并存的 Agent 执行引擎 |
| L3 治理风控 | `agent/governance`,`policy`,`security` | ~1,000 | 危险模式拦截、风险打分、人工确认 |
| L4 工具上下文 | `agent/tools`,`relevance`,`policy/token` | ~2,600 | 18 个工具、上下文相关性、token 预算 |
| L5 核心服务 | `core/` | 13,000 | ModelRouter、Capability 管线、Kernel、Git 域、Workflows |
| L6 基础设施 | `ai`,`audit`,`registry`,`ssh`,`utils` | ~3,500 | LLM 客户端、asciinema 审计、配置、渲染 |

---

## 三、L1 命令层全景

`cli.ts` 除 10 个 `registerXXXCommands(program)` 外，还直接注册了顶层命令：`ai` / `list` / `history` / `macros` / `save` / `run` / `completion` / `_complete` / `shici` / `dict` / `pong`，以及兜底的"应用名/宏名直通"。

| 命令组 | 子命令 | 解决什么 |
|---|---|---|
| `ai` | `-e -d -m -p -f -l -w --planner --context-strategy` | 多引擎问答，Pro/Flash/Lite 快捷档 |
| `git` | `commit review status branch plan exec auto diff-semantic resolve history-semantic smart-commit` | **Git 自动化主战场** |
| `router` | `list stats test doctor exec policy exploration config enable disable map unmap` | 多模型路由运维 |
| `ssh` | `ssh <conn> [--web]` | ssh2 + PTY，`--web` 起浏览器终端 |
| `capability` | `explain match list history replay` | 能力系统的配置溯源与匹配测试 |
| `registry` | `publish get list approve deprecate risk explain` | macro 注册表（draft→approved→deprecated 状态机） |
| `replay` / `explain` | `<id|last>` | 回放执行记录 / 解释为何选中该模型 |
| `skills` | `list explain disable enable prompt prompt-reload` | 记忆型技能 + `~/.yuangs/skills/*.md` 提示词技能 |
| `preferences` | `list get set reset show-prompt setup` | `autoConfirm`、`contextStrategy`、个性化 system prompt |
| `config` | `model get/set/reset`、`get set list` | `~/.yuangs.json`，模型限白名单 |

### 上下文语法（`utils/syntax/`，1,152 行）

| 语法 | 含义 |
|---|---|
| `@file` | 加文件；支持 `:10-50` 行号、`as` 别名、`@!` 立即执行脚本并回收输出 |
| `#dir` | 递归加目录 |
| `:ls` `:cat [i]` `:clear` `:exec` | 上下文管理命令 |
| `??` / `:ai` / 空行+Enter | Zero-Mode 触发（在原生 zsh 里免进入交互直接提问） |

`??` 有 glob 冲突风险（目录下存在两字符文件名会被 shell 展开），已内置 `wouldExpandAsGlob` 检测并告警。

---

## 四、L2 运行时：四套并存 ⚠️

| 运行时 | 触发条件 | 状态 |
|---|---|---|
| `DualAgentRuntime` | `yuangs ai` **默认**（`autoConfirm=false` → `isPlannerEnabled=true`） | Planner+Executor 外壳，实际多落入 `runFastPath` → `AgentRuntime` |
| `createEngineWithFallback` → **piSession** | `--no-planner`、交互式 chat | ✅ 新引擎，优先路径，失败降级 AgentRuntime |
| `AgentRuntime` | pi 降级、`-e` 命令模式 | 自研 ReAct，maxTurns=10 |
| `callAI_Stream` 裸调 | `--direct` | 无协议/无工具/无 policy |

**判断：这是一次未完成的迁移快照，不是架构选择。**
- 新栈 = `pi` 引擎 + 原生 `tool_calls` + `beforeToolCall` 钩子注入治理
- 旧栈 = 自研 ReAct + 18 工具 + JSON 协议 + 五层治理

`fallback` 的存在说明作者对 pi 的依赖形态（ESM-only / Node≥22.19 / optionalDependencies）不放心。

### AgentRuntime 主循环

```
buildPrompt → LLMAdapter.think → runLLM
  → ModelRouter（失败落 callAI_Stream）
  → parseThought（JSON5 解析）
  → PreFlightChecker（ACK 因果 / 治理 / 去重 / PolicyEngine / ErrorTracker）
  → ExecutionHandler（备份 → 执行 → 稳定检测 → 自动收尾 → 学习）
```

`llm.ts` 的 `extractStreamableContent` 解决"模型吐 JSON 协议、用户要看纯文本"的矛盾——流式增量剥离 JSON 信封。

### DualAgentRuntime 的问题 ⚠️

Planner 触发条件窄（命中 8 个中英关键词之一），命中后：出计划 → 打印 → 用户 y/N → for 循环逐步 `ToolExecutor.execute`。
- ❌ 不是 Plan-Execute-Replan 闭环，无 re-plan、无结果回灌
- ❌ **绕过 `PreFlightChecker` 与 `GovernanceService`**，只留 piAdapter 工具自带的 diff 确认

这意味着：用户输入命中"重构/批量/多步骤"等关键词时，写入类操作**不经过治理裁决**。

---

## 五、L3 治理与风控

### 风险打分（`governance/riskScoring.ts`，539 行）

5 因子加权 → 0-100，再减 `userTrust × 15`：

| 因子 | 权重 |
|---|---|
| base | 0.25 |
| destructive | 0.30 |
| path | 0.20 |
| contextual | 0.15 |
| complexity | 0.10 |

分级：**low <35 / medium <60 / high <80 / critical ≥80**
动作：≥90 deny；≥60 需 trust >0.8 否则 deny。
信任度可学习（成功 +0.05 / 拒绝 −0.02），按天衰减 5%。

### 真正的拦截层

| 组件 | 状态 |
|---|---|
| `security/dangerousPatterns.ts` 27 条正则 | ✅ **唯一权威源**，被 policy/engine、noDangerousShell、ssh、commandSemantics 四处复用 |
| `PolicyEngine`（`NoDangerousShellPolicy`、`WorkdirWritePolicy`） | ✅ 由 PreFlightChecker 首次使用时注册 |
| 受保护路径 + workdir 边界 | ✅ 生效 |
| `governance/core.ts` YAML policy | ⚠️ 从 `process.cwd()` 读 `policy.yaml`，**仓库内不存在**，rules 恒空 |
| WASM 沙箱（`core.as.ts`，33 行） | ❌ **死代码**：仅硬编码 `rm -rf /`、`sudo rm` 两条匹配；`build/release.wasm` 未提交、无 `asconfig.json` → `init()` 恒 false |

**结论：WASM 沙箱与 YAML policy 是架构声明，不是运行时保障。** 真正拦住危险操作的是 TS 正则 + 受保护路径 + 人工确认。
选 AssemblyScript 的理由不是性能，而是与 TS 代码库同构、零额外工具链，让"策略裁决跑在与 Node 内存隔离的沙箱里"这个叙事成立。

---

## 六、L4 工具与上下文

### 18 个工具（executor.ts 注册）

| 类别 | 工具 |
|---|---|
| 文件 | `read_file` `read_file_lines` `read_file_lines_from_end` `write_file` `append_file` `file_info` `continue_reading` |
| 检索 | `list_files` `list_directory_tree` `search_in_files`(ripgrep) `search_symbol` `analyze_dependencies` |
| Git | `git_status` `git_diff` `git_log` |
| 执行 | `shell_cmd` `code_diff` |

- **`toolCapability.ts`(678)**：工具元数据字典（CapabilityLevel 门槛 + JSON Schema + few-shot + riskLevel + 重试策略），既喂 LLM 也做执行准入
- **`relevance.ts`(613)**：完全不同的问题——"哪些文件进 prompt"，四维加权（关键词/路径/扩展名/时效）+ 意图自适应权重 + token 预算裁剪
- **权限**：CapabilityLevel 门槛默认 STRUCTURAL（形同虚设），**无 per-tool 权限矩阵**；真白名单只在 pi 路径的 `['read','ls','grep','find','bash','edit','write']`
- **`piAdapter.ts`(343)**：反向桥，把 pi 的 write/edit/grep 包成 yuangs Tool，附 `BackupManager` + `previewDiffAndConfirm`（彩色 diff + 行统计 + 确认）——**这是写入安全的真正增量**，原 `write_file` 全量覆盖零校验

### TokenPolicy（`policy/token/`，410 行）

`PendingContextItem` 延迟加载：`estimate()` 只 `stat` 取体积，`resolve()` 才读内容。四层拦截：

| 预算占用 | 动作 |
|---|---|
| ≤70% | 放行 |
| 70–80% | 警告 |
| 80–100% | 需确认（可切长文本模型 / head_tail 采样 / 终止） |
| >100% | 阻断 |

---

## 七、L5 核心服务

### Kernel（1,765 行）— 为"AI 安全改代码"预埋

用 **TypeScript Compiler API**（非 tree-sitter/Babel）：

| 文件 | 职责 |
|---|---|
| `ASTParser`(656) | 导出符号提取（函数/类/接口/类型/变量，含 JSDoc、泛型）+ SHA 哈希 |
| `FastScanner`(319) | ripgrep 加速找"引用某模块的所有消费者" |
| `XResolver`(251) | 跨文件影响分析：符号 → 消费者 → 代码片段 → `renderAsAIContext()` |
| `AtomicTransactionManager`(298) | 多文件原子事务：`.yuangs/snapshots` 快照，全提交或全回滚 |
| `PostCheckVerifier`(241) | 事后 `npx tsc --noEmit` 验证并结构化错误供 AI 修复 |

⚠️ **当前最孤立的子系统**：XResolver / AtomicTransactionManager / PostCheckVerifier / FastScanner 在 `src/` 内**无任何非测试消费者**，只有 ContextGatherer 复用 ASTParser。

### ModelRouter（2,674 行）— 治理面过设计于覆盖面

决策链：`MANUAL/ROUND_ROBIN 短路` → `ModelSupervisor.evaluate` 可 SWITCH_STRATEGY 干预 → 4 个 DSL 策略 → `gate()` 硬过滤 → `score()` 加权 → **熔断按 failureDomain 过滤** → ε-greedy/UCB1 探索 → 选最优。

| 策略 | 权重 |
|---|---|
| balanced | taskMatch .4 / context .2 / latency .2 / cost .1 / history .1 |
| cost-saving | cost .7 / taskMatch .2 / history .1 |
| latency-critical | latency .7 / taskMatch .2 / history .1 |
| quality-first | gate minContext 32000；quality .6 / history .2 / taskMatch .2 |

`AdaptiveWeights`(393) 是强化学习式反馈：lr=0.1、minSamples=10、window=100、decay=0.01。

**Adapters 4 个**，实现方式是 **spawn 本地 CLI**（非 HTTP SDK）：`google-gemini`(gemini-cli)、`qwen`(CLI)、`codebuddy`、`yuangs`(Internal，唯一走进程内 `ai/client`)。`isAvailable()` 用 `which` 探测。

⚠️ **架构最大的裂缝**：ModelRouter 只被 `commands/git/review.ts`、`auto.ts`、`branch.ts`、`commit.ts` 和 `routerCommands` 使用；而 `PlanWorkflow`、`AutoWorkflow`、`CommitMessageGenerator`、`SemanticCommitParser`、`ConflictResolver` **全部直连 `agent/llm` 的 `runLLM`**。即自适应权重/熔断/探索只覆盖 git review 一条链路，最重的 `git auto` 代码生成主流程完全绕过。

### Capability（1,214 行）

不是意图识别，是**能力等级 + 降级 + 阶段编排**。`CapabilityLevel` 5 级有序枚举（SEMANTIC 4 → STRUCTURAL 3 → LINE 2 → TEXT 1 → NONE 0）。`ThresholdDegradationPolicy`（耗时 >30s 或 confidence <0.7）沿严格单调递减的 fallbackChain 降级。

与 `agent/toolCapability.ts` **不重复**：后者 import 前者的枚举，是"等级定义"与"工具声明"的上下游关系。

### Git 域（4,865 行，最大模块）

| 文件 | 职责 |
|---|---|
| `GitService`(571) | 唯一 git 命令封装层 |
| `CodeReviewer`(513) | AI 审查编排：prompt → ModelRouter → JSON 解析 → 降级判定 |
| `ReviewCache`(439) | 内存 Map + `~/.yuangs/cache/review` 磁盘，LRU/LFU + TTL 7 天 + 100MB |
| `TodoManager`(415) | `todo.md` 解析：任务、依赖、优先级、环检测 |
| `CodeGenerator`(366) | 解析 LLM 输出为文件结构 + 落盘/备份/dry-run，1MB 上限 |
| `semantic/`(366) | SemanticDiffEngine（正则启发式分类变更类型）+ SemanticCommitParser |

**AI Code Review 链路**：输入 git diff → ⚠️ **无分块，整体 `substring(0, 15000)` 硬截断** → ModelRouter → 三级解析降级（```json 块 → `{...}` 正则 → 文本启发式）→ `ReviewResult`(score/issues/strengths/recommendations/confidence/degradation)。
⚠️ **缓存只对 `reviewFile()` 单文件生效，整体 `review()` 完全不查缓存**——这是明显遗漏。

### Workflows（1,512 行）

`PlanWorkflow`（架构师/审查者双模型多轮迭代出 todo.md）→ `AutoWorkflow`（逐任务：上下文采集 → 生成 → 备份 → 落盘 → 审查打分 → 低于 minScore 重试 → 可选自动提交）→ `ReviewWorkflow`。`GitWorkflowSession` 状态机 + `ConstraintEngine` 按阶段授权门禁。

---

## 八、L6 基础设施

| 模块 | 要点 |
|---|---|
| `ai/client`(231) | 单端点 OpenAI 兼容 SSE 代理；历史 = 内存最近 20 条 + SQLite `~/.yuangs_chat_history/history.db`（better-sqlite3 缺失回退 JSON） |
| `audit`(626) | `Recorder`（asciinema v2 NDJSON + 扩展 `g` 治理帧，落盘前脱敏）、`Replayer`（变速回放）、`AuditTimeline`（可导出 Markdown） |
| `ssh`(582) | ssh2 + PTY；`GovernedExecutor` 含 `USER→AWAITING_APPROVAL→PENDING_PWD→ROOT` 提权状态机，输密码期间不记审计；`--web` 懒加载 express+socket.io 起 PWA 终端 |
| `ConfigService`(399) | Zod 校验；优先级 `overrides > env(YUANGS_*) > user-global > project > built-in` |
| `utils/renderer`(550) | 自研遍历 markdown-it token（含表格）；`StreamMarkdownRenderer` 增量渲染 + 按屏宽计算可视行数做 ANSI 擦行重绘 |

---

## 九、工程化现状

| 项 | 状态 |
|---|---|
| 测试 | jest(ts-jest) `testMatch` 仅 `**/__tests__/**`；`src/__tests__` 10 个白盒单测 + `test/__tests__` 39 个行为测试 **会被执行**；`test/` 根目录 `test_*.js` **不在 jest 范围内**（手工脚本） |
| 覆盖率 | 阈值极低（分支 15%、函数/行/语句 20%）；现有 `coverage/` 仅 3 个文件的局部产物（stmt 77.45% / branch 58.46%） |
| `verify.sh` | 9 步发布门禁：清 dist → Node≥18 → `npm ci` → build → test → `npm pack` → 校验 tgz 含 `dist/cli.js` 且**不含 src/** → 冒烟 |
| `scripts/` | `yuangs-install.sh`（Zero-Mode 装卸）、`validate-gfm-compatibility.js`、`verify.tla`（TLA+ 形式化规约）、`yuangs.zsh` |
| 文档 | `docs/` 47 篇；架构类重点：`architecture/design-philosophy.md`、`features/security-governance.md`、`features/model-router.md`、`specs/VERIFICATION_GUIDE.md`。⚠️ `docs/README.md` 指向的 `user-guide/ai-interaction.md` **不存在（断链）** |

---

## 十、结论与风险清单

### 三个判断

1. **这是一次未完成的迁移**。旧栈（ReAct + 18 工具 + JSON 协议 + 五层治理）仍占默认路径，新栈（pi + 原生 tool_calls + beforeToolCall 钩子）只在新入口与降级链上。
2. **"AI 治理运行时"一半是叙事**。真正生效的拦截是纯 TS 正则 + 受保护路径 + 人工确认；WASM 沙箱与 YAML policy 在当前仓库状态下均不生效。
3. **每个补丁都对应一个线上 bug**：`approval.ts` 去重二次确认、`buildConversationRecap` 补多轮指代、`extractStreamableContent` 拆 JSON 信封、`truncateToolOutputForChat` 按行截断修中文乱码。注释记录的都是故障现场，而非设计权衡。

### 风险清单

| 级别 | 问题 | 位置 | 状态 |
|---|---|---|---|
| 🔴 高 | DualAgentRuntime 绕过治理链直接调 ToolExecutor——命中"重构/批量"关键词时写入操作不经 `GovernanceService.adjudicate` | `agent/DualAgentRuntime.ts` `runPlannedPath` | ✅ **已修复**：`executeStep` 现先经 `GovernanceService.adjudicate`，拒绝则中止步骤并返回失败；新增 2 个回归测试（拦截 + `governanceApproved` 透传） |
| 🟠 中 | `git auto` 主流程绕过 ModelRouter，自适应权重/熔断覆盖率极低 | `core/workflows/*` | ✅ **已修复**：移除 `PlanWorkflow` 4 处 `bypassRouter: true`，现走 `runLLM` 内置路由器（受 `enableRouting` 门控，失败时优雅回退）；`AutoWorkflow.generateCode` 本就未绕过 |
| 🟠 中 | 整体 `review()` 不查缓存、`substring(0,15000)` 硬截断代替分块 | `core/git/CodeReviewer.ts` | ✅ **已修复**：`review()` 接入 `ReviewCache`（含 `VERSION`）；新增 `splitDiffIntoChunks`（按整行切分，零截断丢失）+ `aggregateReviewResults` 聚合，`reviewFile`/`reviewCommit` 同样复用；移除硬截断 |
| 🟠 中 | Kernel 的 XResolver / 事务 / PostCheck 无生产消费者 | `core/kernel/*` | ✅ **已接线 + 验证**：`WriteFile` 接入 `PostCheckVerifier`（`YUANGS_POST_TYPECHECK=1` 可选、非致命）；`AtomicTransactionManager`+`PostCheckVerifier` 补充单元测试（快照/提交/回滚、类型检查 pass/fail）证明可用 |
| 🟡 低 | WASM 沙箱死代码（产物未提交，无 asconfig） | `agent/governance/sandbox/` | ✅ **显式降级**：`WasmGovernanceBridge.init()` 缺失 `build/release.wasm` 时打印明确回退日志，不再静默 |
| 🟡 低 | YAML policy 从 cwd 读取且文件不存在 | `agent/governance/core.ts` | ✅ **显式降级**：`loadPolicy()` 无 `policy.yaml` 时打印回退日志，错误分支不再被吞掉 |
| 🟡 低 | 两套测试目录 + 根目录 `test_*.js` 游离于 jest 之外 | `test/` | ⚠️ **待你确认**：`test/` 根约 40 个 `test_*.js` 游离于 jest `testMatch`（`**/__tests__/**`）之外，未删除（需你授权）；`src/__tests__` 与 `test/__tests__` 并存均可用 |
| 🟡 低 | 文档索引断链 | `docs/README.md` | ✅ **已修复**：`ai-interaction.md` 不存在，改指向 `overview.md` |

### 值得肯定的设计

- **`PendingContextItem` 的 estimate/resolve 分离**——把"估算成本"和"支付成本"分成两个动作，是 No OOM 承诺的真正落点
- **confidence 作为全局货币**——ContextMeta 产出、CapabilityPipeline 聚合、DegradationPolicy 消费触发降级、ReviewCache 按内容哈希消费
- **asciinema 扩展 `g` 治理帧**——把治理决策打进终端录像时间轴，`replay` 能还原"当时为什么被拦"
- **`verify.sh` 校验 tgz 不含 src/**——发布门禁很扎实

---

*本文档由架构只读分析生成；随后基于「风险清单」执行了一轮优化（P0 治理绕过、P1 缓存/分块/路由、Kernel 接线、死代码显式降级、文档断链），全部改动通过 `tsc` 类型检查与既有/新增测试回归。*
