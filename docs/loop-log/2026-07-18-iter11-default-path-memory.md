# yuangs AI 交互优化 · 第 11 轮（重要：默认路径多轮记忆缺失）

- **日期**：2026-07-18
- **轮次**：/loop 第 11 轮
- **主题**：默认路径（DualAgentRuntime → runFastPath）此前用**空上下文**跑 AgentRuntime，多轮记忆全丢
- **范围**：`src/agent/DualAgentRuntime.ts`

## 问题（继第 8 轮之后的又一重大发现）

第 8/9/10 轮修了多轮对话记忆，但本轮发现：**那只覆盖了非默认的 `AgentRuntime` 路径，默认路径仍然没记忆。**

链路核实：
1. `autoConfirm` 默认 `false`（`preferences.ts:17`）→ `cli.ts` 的 `isPlannerEnabled` 默认 **true** → `yuangs ai` 默认走 **`DualAgentRuntime`**（不是 `AgentRuntime`）。
2. `DualAgentRuntime.run` 对绝大多数查询（无 planner 关键词）走 `runFastPath`。
3. `runFastPath` **原代码**：
   ```ts
   const runtime = new AgentRuntime({});   // ← 空上下文！丢掉了 DualAgentRuntime 已加载的历史
   this.context.addMessage('user', userInput);
   await runtime.run(userInput, 'command', onChunk, model);
   ```
4. 新建的 `AgentRuntime({})` 上下文为空 → 第 8 轮的 `buildConversationRecap` 没有任何历史可回顾 → **默认路径多轮记忆全丢**。

即：第 8/9/10 轮的记忆修复，对默认路径（多数用户）**不生效**。

## 修复（`src/agent/DualAgentRuntime.ts` runFastPath）

把 DualAgentRuntime 已加载的对话历史传给新建的 AgentRuntime：

```ts
const history = this.context.getMessages();   // 先取已加载历史（构造函数第 9 轮已加载）
this.context.addMessage('user', userInput);
const runtime = new AgentRuntime(history);    // 把历史带给 AgentRuntime
await runtime.run(userInput, 'command', onChunk, model);
```

- 在 `addMessage` **之前**取历史，避免把当前 `userInput` 重复带入（`run()` 内部会再 `addMessage` 一次）。
- 经第 9 轮修复，`new AgentRuntime(数组)` 能正确加载历史 → 第 8 轮 `buildConversationRecap` 生效 → 默认路径恢复多轮记忆。

## 涉及文件

- `src/agent/DualAgentRuntime.ts`：`runFastPath` 传递历史。

## 验证

- `npx tsc --noEmit`：通过。
- `test/__tests__/agent`（含 `dualAgentRuntime`）：**10 suite / 157 测试全绿**，无回归（fast-path 用例的历史为空数组，行为与原先等价）。

## 状态

改动在工作区，**尚未提交**。

## 顺带发现的关联缺口（本轮未修，记为后续）

1. **`runFastPath` 用 `'command'` 模式**：默认路径把普通聊天问题当命令执行（用 `buildV2_3ProtocolPrompt` 而非 `buildChatProtocolPrompt`）。对"解释一下闭包"这类纯对话，可能更该用 chat 模式。属设计选择，需谨慎评估。
2. **`cli.ts` 的 DualAgentRuntime 路径不持久化**：`runtime.run(question, undefined, model)` 后没有 `addToConversationHistory`（第 10 轮只覆盖了 AgentRuntime 路径）→ 连续默认单轮之间仍不累积（只有先有交互模式/AgentRuntime 路径写过历史才有效）。修需捕获响应文本。

## 后续可选

1. 上述两个关联缺口（command 模式、DualAgentRuntime 路径持久化）。
2. 6 处 workflow/git 预存测试失败。
3. 长答案增量 markdown 渲染。
