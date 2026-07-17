# yuangs AI 交互优化 · 第 7 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 7 轮
- **主题**：多轮 chat 流程的轮次标记清理 + 本轮探索结论
- **范围**：`src/agent/AgentRuntime.ts`

## 本轮探索（多数为死胡同，如实记录）

第 1–6 轮已覆盖主要交互面，本轮深挖了几个候选，结论：

1. **每轮 system prompt 体量**：chat protocol ≈ 781 tok，整体偏精简，不值得冒险裁剪。
2. **`GovernanceService.getPolicyManual()` 返回空**：不是 bug——`loadPolicy()` 只在存在 `policy.yaml` 时加载规则，本项目无该文件，故 `rules=[]` 属设计。`adjudicate` 仍用 riskModel/ledger 正常工作。
3. **`getEnhancedContext` 每 turn 调 `loadPersistedContext()`（磁盘读 `loadContext`）**：确实每轮一次磁盘 IO，但每轮被 LLM 调用（秒级）门控，磁盘读（~1ms）相对可忽略；且会话中途用户可能新增上下文（`@file`/`#dir`），缓存有「会话级陈旧」风险。**不值得缓存**。

## 实际修复：多轮流式的轮次标记污染

`AgentRuntime.run` 每个 turn（第 2 轮起）用 `console.log(chalk.blue('\n--- Turn N ---'))` 直接打到 stdout：

```ts
if (currentTurn > 1) {
  console.log(chalk.blue(`\n--- Turn ${currentTurn} ---`));
}
```

两个问题：
- **UX 噪声**：chat 模式下用户看到内部 `--- Turn 2 ---` 之类的调试标记，干扰阅读。
- **破坏流式渲染**：这条 `console.log` 不经过 `StreamMarkdownRenderer`，而 `finish()` 的「按行擦除重绘」只按 renderer 自己 buffer 的行数计算——中间穿插的 `--- Turn N ---` 行没被计入，多轮流程里容易造成重绘错位/残留。

改为 `log.debug`（默认静默，`YUANGS_LOG_LEVEL=debug` 可见）：

```ts
if (currentTurn > 1) {
  log.debug(`--- Turn ${currentTurn} ---`, { turn: currentTurn });
}
```

保留 line 135 的 `⚠️ Max turns reached`（这是面向用户的重要反馈，仍走 `console.log`）。

## 验证

- `npx tsc --noEmit`：通过。
- `test/__tests__/agent`：**147 测试全绿**，无回归。
- `chalk` 仍被 AgentRuntime 使用（max-turns 警告、agent banner），import 未成孤儿。

## 状态

改动在工作区，**尚未提交**。

## 后续可选（仍非阻塞）

1. 6 处 workflow/git 预存测试失败（第 5 轮显性化，非 AI 交互；PlanWorkflow capability estimation 返回 `undefined` 疑似真 bug）。
2. 长答案增量 markdown 渲染（彻底去掉 finish 重绘）。
3. 代码块超宽行终端换行/截断。

## 观察

经 7 轮迭代，`yuangs ai 交互`的主要优化点（流式、工具结果展示、renderer 稳定性、单轮流式、测试解阻塞、动态上下文缓存、轮次标记）已基本覆盖，边际收益递减。若要继续，建议转向：上述 workflow/git 测试债务、或用户指定的具体交互痛点。
