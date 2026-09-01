# yuangs CLI 架构说明

> 对齐版本：**v8.0.11**（2026-09-01 发布）
> 本文基于源码现状撰写。v8.0.1 及更早的架构与当前有重大差异，关键变化见「四、L2 运行时」。

## 一、这到底是什么

yuangs 是个人 CLI 工具集，核心是**终端里的 AI 助手**（`yuangs ai`），外围附带 Git 自动化、
宏/命令管理、诗词字典等小工具。

| 项 | 现状 |
|---|---|
| 源码规模 | `src/` 约 **44,700 行** TypeScript |
| 发布范围 | `files: ["dist", "public"]`——**`src/` 不进 npm 包**（解包后约 4.45 MB） |
| 运行要求 | **`engines.node >= 22.19`**（v8.1.0 起收紧，此前为 `>= 18`）；agent 能力还需装 pi（见「四」） |

## 二、分层架构

| 层 | 职责 | 主要位置 |
|---|---|---|
| L1 命令层 | 命令注册、参数解析、上下文语法 | `cli.ts`（698 行）、`commands/`（7,684 行） |
| L2 运行时 | AI 引擎：pi agent / direct 直连 | `agent/piSession.ts`（626 行）、`commands/handleAIChat.ts`（1,080 行） |
| L3 治理风控 | 风险打分、审批、拦截 | `agent/governance/`（771 行）、`risk/`（283 行）、`policy/`（578 行） |
| L4 工具与上下文 | 工具注册、上下文取舍、Token 策略 | `agent/tools/`（469 行）、`policy/token/` |
| L5 核心服务 | 配置、Kernel、ModelRouter、Git、Workflows | `core/`（17,858 行） |
| L6 基础设施 | 日志、DB、错误处理、渲染 | `utils/`（2,394 行）、`core/db.ts`、`core/observability/` |

## 三、L1 命令层

11 个顶层命令：

| 命令 | 用途 |
|---|---|
| `ai [question...]` | AI 交互 / 单次问答（核心） |
| `list` / `history` | 命令与历史查看 |
| `macros` / `save` / `run` | 宏的管理与执行 |
| `completion` / `_complete` | shell 补全 |
| `shici` / `dict` / `pong` | 小工具（诗词 / 字典 / 连通性） |

上下文语法（`utils/syntax/`，1,152 行）支持 `@file`、`#symbol` 等引用，在进入引擎前展开为上下文。

## 四、L2 运行时：单 pi 引擎 + direct 降级

### 4.1 历史包袱已清理

v8.0.1 时曾**四套运行时并存**：`AgentRuntime`、`DualAgentRuntime`、`piSession`、`direct`。
其中双 Agent 方案依赖「让模型输出 JSON 协议、再从文本里抠出来」的脆弱路径。

**v8.0.9 起收敛为一套 pi 引擎**：删除 `AgentRuntime.ts`、`DualAgentRuntime.ts`、
`PreFlightChecker.ts`、`ExecutionHandler.ts`、16 个被 pi 内置覆盖的工具，以及 `piAdapter.ts`
适配层，净减约 2,500 行。

### 4.2 当前两条路径

| 路径 | 触发方式 | 能力 | 依赖 |
|---|---|---|---|
| **pi 引擎** | `yuangs ai`（默认） | 原生 `tool_calls`；read/ls/grep/edit/bash 由 pi 内置提供，仅 `analyze_dependencies` 为自有工具 | `@earendil-works/pi-coding-agent`（`optionalDependencies`）+ Node ≥ 22.19 |
| **direct 直连** | `yuangs ai -d`，或 pi 不可用时自动降级 | 纯文本问答，无 JSON 协议 / 无工具 / 无 policy | 无额外依赖 |

### 4.3 降级规则（v8.0.11 修复）

此前 `handleAIChat` 在 direct 判定**之前**就无条件创建 pi 引擎，导致未装 pi 时**连 `-d` 直连也会挂**，
违背「跳过 agent 引擎」的语义。现在改为条件创建：

- `-d` → **完全不加载 pi**
- 不带 `-d` → 尝试 pi；失败（SDK 未安装 / Node < 22.19 / 启动失败）则打印提示并**降级为 direct**

`cli.ts` 的单次问答分支同样处理，抽出 `runDirectOnce()` 供 `--direct` 与降级路径复用。

> ⚠️ **依赖矩阵**（v8.1.0 起）：`engines` 已收紧为 **`node >= 22.19`**，与 pi 引擎要求对齐，
> 低于该版本的 Node 将无法安装。Node 满足要求后，完整 agent 能力还需
> `npm i -g @earendil-works/pi-coding-agent`；未安装时 `yuangs ai` 会降级为 direct 纯文本模式。
>
> 历史背景：v8.0.11 及更早 `engines` 声明 `>= 18`，但 pi 要求 `>= 22.19`，
> 导致 Node 18 ~ 22.18 用户虽能安装、却只能静默使用无工具的 direct 模式。收紧 engines 后该落差消失。

## 五、direct 通道的请求弹性（v8.0.10 ~ v8.0.11）

**问题**：direct 模式每轮把完整渲染输出（含底部引用列表）原样写入对话历史，第二轮连同历史一起回传，
请求体不断膨胀；上游代理在转发前即返回 **502 Bad Gateway**（请求未到达模型后端）。

**机制**（`src/commands/handleAIChat.ts`，已抽为模块级导出函数便于单测）：

| 机制 | 说明 | 常量 / 函数 |
|---|---|---|
| 存储截断 | assistant 回复写入历史前硬截断（终端展示仍完整，仅压缩记忆） | `MAX_ASSISTANT_STORE = 4000` |
| 发送裁剪 | 单条超 cap 截断；总长超预算则从最旧消息开始丢弃（始终保留最后一条 user） | `buildSendMessages()`、`CONTEXT_BUDGET`（normal 18k / 单条 4k，aggressive 6k / 2k） |
| 5xx 重试 | 捕获 5xx 后 sleep 1.5s，以 aggressive 档精简上下文重试一次 | `isServerError()` |
| 空响应兜底 | 流式返回空时自动降级为非流式重试 | `runStream()` |

对应单元测试：`test/__tests__/commands/directContextBudget.test.ts`（12 个用例）。

> 注：以上均为客户端兜底。502 的终极根因在代理侧的上下文 / 请求体上限，需结合代理日志定位。

## 六、L3 治理与风控

| 模块 | 行数 | 说明 |
|---|---|---|
| `agent/governance/` | 771 | 治理链路：bridge / core / ledger / sandbox |
| `agent/governance/riskScoring.ts` | 539 | 风险打分 |
| `policy/` | 578 | 策略与审批（含 `policy/token/`） |
| `risk/` | 283 | 独立风险模块 |

## 七、L4 工具与上下文

- **自有工具只剩 1 个**：`analyze_dependencies`（`agent/tools/`，469 行）。
  其余 read/ls/grep/edit/bash 等由 pi 引擎内置提供——这正是 8.0.9 能删掉 16 个工具的前提。
- 上下文取舍：`agent/contextManager.ts`、`smartContextManager.ts`、`relevance.ts`
- Token 策略：`policy/token/`

## 八、L5 核心服务（`core/`，17,858 行）

| 模块 | 行数 | 说明 |
|---|---|---|
| `git/` | 5,197 | 最大模块：GitService 等 |
| `modelRouter/` | 3,569 | 模型路由与适配器 |
| `workflows/` | 2,493 | 工作流编排 |
| `kernel/` | 1,765 | AST 解析等内核能力 |
| `ConfigService.ts` | — | 配置分层与加载 |

### 配置分层（ConfigService）

优先级从低到高：

```
defaults < project < user (~/.yuangs.json) < env (process.env) < overrides
```

隐藏开关 `YUANGS_UNLOCK`（值 `1 / true / yes / on`）会注入内置端点。**v8.0.8 起改为条件注入**：
用户已显式配置 `aiProxyUrl` / `defaultModel` 时不再覆盖，避免顶掉自建端点（此前会导致自建端点
被静默替换、进而鉴权失败 401）。

## 九、工程化现状

| 项 | 现状 |
|---|---|
| 测试 | `npx jest` **46 suites / 529 passed** |
| CI | 仅 `v*` tag 触发：TLA+ 校验 → `npm ci` → `build` → `test:coverage` → `npm publish --provenance` |
| 推送 tag | 本仓库 `git push --follow-tags` 不可靠，须显式 `git push origin v<版本>` |
| dist | 已加入 `.gitignore`，由 CI 构建；仓库只维护 `src/` |
| 已知告警 | CI 有 Node 20 弃用告警（actions/cache·checkout·setup-java·setup-node v4），可升级到 v5 |

## 十、当前风险与待办

1. **pi 为可选依赖**：默认 `npm i -g yuangs` 不会安装 pi，主功能会降级为 direct（无工具能力）。
   若希望默认即完整体验，需权衡是否将 pi 改为常规依赖（代价：包体积与 Node 版本门槛上升）。
2. **pi 仍为可选依赖**：即便 Node 满足 `>= 22.19`，默认 `npm i -g yuangs` 也不会安装 pi，
   `yuangs ai` 会降级为 direct（无工具能力）。若希望开箱即完整体验，需将 pi 改为常规依赖
   （代价：包体积上升）。降级时的提示文案已说明如何启用。
3. **502 未根治**：客户端弹性仅为兜底，代理侧的上下文 / 请求体上限待结合日志确认。
4. **`modelRouter/` 规模偏大**（3,569 行）：适配器数量多，可考虑按 provider 进一步拆分。
