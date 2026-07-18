# yuangs AI 交互优化 · 第 12 轮（默认路径收尾）

- **日期**：2026-07-18
- **轮次**：/loop 第 12 轮
- **主题**：默认路径（DualAgentRuntime）的两个关联缺口——模式与持久化/流式
- **范围**：`src/agent/DualAgentRuntime.ts`、`src/cli.ts`

承接第 11 轮发现的默认路径问题，本轮把第 11 轮记录的两个关联缺口修掉。

## Gap #1：默认 fast path 硬编码 `'command'` 模式

`runFastPath` 原本 `runtime.run(userInput, 'command', ...)`。而 `AgentRuntime.run` 在 command 模式下**拒绝直接回答、强制推向工具调用**（见其「在命令执行模式下，请直接使用工具」分支）。结果：默认路径上问「解释一下闭包」这类纯对话问题，会被错误地逼去调工具，而不是直接回答。

**修复**：
- `DualAgentRuntime.run` / `runFastPath` 新增 `mode` 参数（默认 `'chat'`），传给 `AgentRuntime.run`。
- `cli.ts` 按 `--exec` 决定：`runtime.run(question, undefined, model, options.exec ? 'command' : 'chat')`。
- 即默认对话助手用 chat 模式（直接回答，必要时仍可调工具）；只有显式 `--exec` 才走命令执行模式。

## Gap #2：默认路径不持久化、不流式

`cli.ts` 的 DualAgentRuntime 分支原是 `runtime.run(question, undefined, model)`——`onChunk` 为 `undefined`（不流式），且无 `addToConversationHistory`（不持久化）。后果：
- 默认路径在 TTY 终端里**不流式**（与第 4 轮给 AgentRuntime 路径加的流式不一致）。
- 连续 `yuangs ai` 默认路径调用之间**不累积**记忆（第 10 轮只覆盖了 AgentRuntime 路径）。

**修复**：
- `DualAgentRuntime.run` / `runFastPath` 新增 `renderer` 参数，透传给 `AgentRuntime.run`（用于流式渲染 + 捕获完整回答）。
- `cli.ts` DualAgentRuntime 分支与 AgentRuntime 分支对齐：TTY 且非 `--exec` 时创建 `StreamMarkdownRenderer`、流式执行、`renderer.finish()` 捕获完整回答并 `addToConversationHistory` 持久化；管道/非 TTY 走原路径，保持无状态、不污染历史。

## 涉及文件

- `src/agent/DualAgentRuntime.ts`：`run` / `runFastPath` 加 `mode` + `renderer` 参数并透传。
- `src/cli.ts`：DualAgentRuntime 分支加 TTY 流式 + 捕获 + 持久化。

## 验证

- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
- `node dist/cli.js --version`：正常加载。
- `test/__tests__/agent`：**157 测试全绿**，无回归。

## 默认路径（多数用户）至此完整具备

| 能力 | 来源 |
|---|---|
| 多轮记忆（会话内 + 跨调用读） | 第 8/9/11 轮 |
| 跨调用写（持久化） | 第 10 轮（AgentRuntime 路径）+ 本轮 Gap #2（DualAgentRuntime 路径） |
| 对话模式（直接回答，非强制工具） | 本轮 Gap #1 |
| TTY 流式 | 第 4 轮（AgentRuntime 路径）+ 本轮 Gap #2（DualAgentRuntime 路径） |

## 状态与备注

改动（`DualAgentRuntime.ts` + `cli.ts`）在工作区，**尚未提交**。
注：`cli.ts` 的 AgentRuntime 分支（第 10 轮）与 DualAgentRuntime 分支（本轮）的「流式 + 持久化」代码块高度相似（~25 行），本轮为降低对已发布代码的风险暂未抽取公共函数，留作后续清理。

## 后续可选

1. 抽取 cli.ts 两分支的「流式 + 持久化」公共逻辑（去重）。
2. 6 处 workflow/git 预存测试失败。
3. 长答案增量 markdown 渲染。
