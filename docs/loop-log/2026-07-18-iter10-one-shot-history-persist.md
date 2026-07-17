# yuangs AI 交互优化 · 第 10 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 10 轮
- **主题**：补齐单轮 `yuangs ai` 的对话历史持久化，闭合跨调用多轮记忆
- **范围**：`src/cli.ts`

## 背景

第 8、9 轮修复了多轮对话记忆：会话内（`buildConversationRecap`）+ 跨调用（`ContextManager` 构造函数加载 `getConversationHistory()`）。但通读 `cli.ts` 发现一个缺口：

**单轮 `yuangs ai "问题"` 从来不把问答写回对话历史。**

- `cli.ts` 全文只有 `getConversationHistory()`（读），**没有** `addToConversationHistory`（写）。
- 交互模式 `handleAIChat` 每轮都会 `addToConversationHistory('user'...)` + `('assistant'...)`，单轮模式却没有。
- 后果：第 9 轮给单轮加载了历史，但单轮自己不写 → 连续的 `yuangs ai "q1"` / `yuangs ai "接着说"` 之间**无法累积**（单轮的 Q&A 没进历史）。跨调用记忆对「连续单轮」场景形同虚设，只有先开过交互模式才有效。

## 修复（`src/cli.ts` 单轮流式分支）

TTY 流式分支现在捕获完整回答并写回历史（与交互模式一致）：

```ts
let fullResponse = '';
try {
  await runtime.run(question || '', 'chat', onChunk, model, renderer);
  fullResponse = renderer.finish();
} catch (err) {
  renderer.finish();
  console.log(chalk.red(`\n❌ AI 响应失败: ${...}`));
}

// 持久化到全局对话历史，让后续 yuangs ai 调用能接上（跨调用多轮记忆）。
// 仅 TTY 交互终端的一次性提问；管道/脚本走非流式分支，保持无状态、不污染历史。
if (fullResponse) {
  const { addToConversationHistory } = await import('./ai/client');
  addToConversationHistory('user', question || '');
  addToConversationHistory('assistant', fullResponse);
}
```

设计要点：
- **仅 TTY 流式分支写历史**：终端里连续 `yuangs ai` 现在能接上前一次（闭合跨调用记忆）。管道/脚本走非流式分支，**保持无状态**——不污染历史（脚本调用不应留下对话痕迹）。
- **仅在有回答时写**：失败/空响应不写，避免存下孤立的用户问题。
- **顺带**：原单轮无 try/catch（异常裸抛），现改为 finish 收尾 + 友好报错，与交互模式一致。

未覆盖：`--planner`（DualAgentRuntime）路径同样不写历史，但属较少用的双 Agent 模式，本轮不动。

## 验证

- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
- `node dist/cli.js --version`：正常加载。
- 属 commander action 内的接线（与第 4 轮单轮流式同类），无可独立单测的纯逻辑；沿用已验证的 `handleAIChat` 同款 `addToConversationHistory` 模式。

## 状态

改动在工作区，**尚未提交**。至此跨调用多轮记忆完整闭环：读（第 9 轮，所有路径）+ 写（交互模式 + 单轮 TTY）。

## 后续可选

1. `--planner`（DualAgentRuntime）路径也可补历史持久化。
2. 6 处 workflow/git 预存测试失败（第 5 轮显性化，非 AI 交互）。
3. 长答案增量 markdown 渲染。
