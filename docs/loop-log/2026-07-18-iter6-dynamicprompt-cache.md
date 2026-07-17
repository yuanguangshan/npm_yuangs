# yuangs AI 交互优化 · 第 6 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 6 轮
- **主题**：补齐 dynamicPrompt 里「声明了却从未启用」的检测缓存，降低 agent 每轮延迟
- **范围**：`src/agent/dynamicPrompt.ts`

## 问题

`LLMCaller.buildPrompt` 在 agent 循环的**每个 turn** 都调用一次 `buildDynamicContext`，后者会：
- `detectGitContext()`：起一个 `git rev-parse --is-inside-work-tree` 子进程（超时 2s）
- `detectTechStack()`：对 9 个文件做 `fs.access`

而 `dynamicPrompt.ts` 顶部早就声明了缓存变量——`cachedGitContext` / `cachedTechStack` / `lastCheckTimestamp` / `CACHE_TTL=5000`——**但从未被读写**。即缓存是「半成品」：意图写了，实现没接。结果：多轮工具流程（最多 10 轮）里，git 子进程与 9 次 `fs.access` **每轮都重跑一遍**，纯属冗余 IO，直接拖慢每轮响应。

## 修复（`src/agent/dynamicPrompt.ts`）

1. **真正实现缓存**：`detectGitContext` / `detectTechStack` 开头检查各自缓存（5s TTL 内直接返回），末尾写入缓存。用 `undefined` 作「未检测」哨兵，与「结果为 `null`/`[]`」区分；每项独立时间戳，互不干扰。
2. **并发化**：`buildDynamicContext` 里把 git 检测与技术栈检测用 `Promise.all` 并发执行（原先串行 await）。
3. OS 检测（`detectOS`）是纯同步、极廉价，不缓存；`lastError` 是每轮变化的，不缓存——只缓存稳定的环境信息。

行为不变（检测结果内容一致），只是不再每轮重复 IO → 多轮交互更快。

## 涉及文件

- `src/agent/dynamicPrompt.ts`：缓存落地 + 并发检测。
- `test/__tests__/agent/dynamicPrompt.test.ts`：新增「重复调用返回同一引用（命中缓存）」用例。

## 验证

- `npx tsc --noEmit`：通过。
- `test/__tests__/agent/dynamicPrompt.test.ts`：**33 测试全绿**（含新增缓存命中用例：`expect(a).toBe(b)` 验证同一数组引用，证明缓存生效）。
- `agent + utils` 回归：**10 suite / 164 测试全绿**，无回归。

## 状态

改动在工作区，**尚未提交**。

## 后续可选（仍非阻塞）

1. 6 处 workflow/git 预存测试失败（第 5 轮显性化，非 AI 交互；其中 PlanWorkflow capability estimation 返回 `undefined` 疑似真 bug）。
2. 长答案增量 markdown 渲染（彻底去掉 finish 重绘）。
3. 代码块超宽行终端换行/截断。
