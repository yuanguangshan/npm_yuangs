# yuangs CLI API 参考

> AI-augmented Shell with Governance | 版本: 5.60.0 | 作者: 苑广山

## 架构概览

```
CLI Layer (cli.ts)
  └─ Command Handlers (handleAIChat, handleAICommand, git/*, config/*)
       ├─ Agent Layer (AgentRuntime, DualAgentRuntime, LLMCaller, executor)
       └─ Core Layer (ConfigService, ModelRouter, GitService, Capability)
```

## 核心模块

| 模块 | 路径 | 说明 |
|------|------|------|
| CLI 入口 | `src/cli.ts` | Commander.js 路由，~645 行 |
| AI 对话 | `src/commands/handleAIChat.ts` | 多轮对话与上下文管理，~819 行 |
| Agent 运行时 | `src/agent/AgentRuntime.ts` | Agent 执行循环，~167 行 |
| 双 Agent | `src/agent/DualAgentRuntime.ts` | Plan + Execute 模式，~366 行 |
| 工具注册 | `src/agent/tools/` | ReadFile, WriteFile, GitDiff, ShellCmd 等 17 个工具 |
| 模型路由 | `src/core/modelRouter/ModelRouter.ts` | 多模型自适应路由，~557 行 |
| 能力系统 | `src/core/capability/` | Pipeline, CostProfile, CapabilityLevel |
| Git 服务 | `src/core/git/GitService.ts` | 核心 Git 操作聚合，~571 行 |
| X-Resolver | `src/core/kernel/XResolver.ts` | 跨文件依赖解析，~251 行 |
| 治理系统 | `src/agent/governance/` | Safety, Risk Scoring, Sandbox |
| 审计回放 | `src/audit/` | Recorder, Replayer, Timeline |

## 工具列表

| 工具 | 功能 |
|------|------|
| `ReadFile` | 读取文件内容 |
| `WriteFile` | 写入/替换文件 |
| `AppendFile` | 追加内容到文件 |
| `ListDirectoryTree` | 树形目录列表 |
| `ListFiles` | 文件列表（glob） |
| `CodeDiff` | Git diff 分析 |
| `GitStatus` | 工作区状态 |
| `GitLog` | 提交历史 |
| `SearchInFiles` | 内容搜索 |
| `SearchSymbol` | 符号搜索 |
| `AnalyzeDependencies` | 依赖分析 |
| `ShellCmd` | Shell 命令执行 |
| `FileInfo` | 文件元信息 |
| `ContinueReading` | 续读文件 |
| `ReadFileLinesFromEnd` | 从末尾读取行 |

## 命令

详见 [commands-reference.md](../user-guide/commands-reference.md)。

## 配置

详见 [configuration.md](../user-guide/configuration.md)。
