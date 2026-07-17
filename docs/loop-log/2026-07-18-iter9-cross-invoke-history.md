# yuangs AI 交互优化 · 第 9 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 9 轮
- **主题**：补齐第 8 轮多轮对话记忆的次要 bug——跨调用历史加载（构造函数错配）
- **范围**：`src/agent/contextManager.ts`

## 背景

第 8 轮发现并修复了「交互会话内」多轮对话记忆丢失（`LLMCaller.call` 不注入前几轮对话）。当时还留了一个**次要 bug**：跨 `yuangs ai` 调用的历史没加载，根因是构造函数错配：

```ts
// 调用方（handleAIChat、cli.ts 单轮、DualAgentRuntime）
new AgentRuntime(getConversationHistory())   // getConversationHistory() 返回 AIRequestMessage[] 数组

// AgentRuntime / DualAgentRuntime 构造函数
this.context = new SmartContextManager(initialContext);  // initialContext 是数组

// ContextManager 构造函数（改前）
constructor(initialContext?: GovernanceContext) {
  if (initialContext?.history) { ... }   // 数组没有 .history → undefined → 不加载
  if (initialContext?.input)  { ... }    // 数组没有 .input  → undefined → 不加载
}
```

数组被当成 `GovernanceContext` 对象，`.history`/`.input` 都是 `undefined` → 历史被静默丢弃。

## 修复（`src/agent/contextManager.ts`）

让构造函数接受两种形态——`GovernanceContext` 对象**或**历史数组——并按 `Array.isArray` 分流：

```ts
constructor(initialContext?: GovernanceContext | GovernanceContext['history']) {
  if (Array.isArray(initialContext)) {
    this.messages = initialContext.map(msg => ({ ...msg, timestamp: Date.now() }));
  } else {
    if (initialContext?.history) { ... }
    if (initialContext?.input)  { ... }
  }
}
```

要点：
- **一处修复覆盖两条路径**：`AgentRuntime`（经 `SmartContextManager`）和 `DualAgentRuntime`（经 `ContextManager`）都受益——`SmartContextManager` 无自定义构造函数、继承基类。
- **向后兼容**：`GovernanceContext` 对象分支原样保留；无参数 / 空数组 → 空消息，行为不变。
- 与第 8 轮的 `buildConversationRecap` 配合：跨调用历史进入 `this.context.messages` 后，回顾函数取最近 6 条注入 → `yuangs ai "继续"` 能接上前一次调用的前文。
- 历史本身有界（`getConversationHistory` 内部按 20 条 + DB 截断；`ContextManager.maxHistorySize=50`），不会无限膨胀。

## 涉及文件

- `src/agent/contextManager.ts`：构造函数支持数组形态。
- `test/__tests__/agent/contextManager.test.ts`：4 个用例（无参空、数组加载、GovernanceContext 向后兼容、空数组）。

## 验证

- `npx tsc --noEmit`：通过。
- `test/__tests__/agent` + `src/__tests__/agent`（含 `SmartContextManager.integration`）：**11 suite / 164 测试全绿**，无回归（无参构造仍正常）。

## 状态

改动在工作区，**尚未提交**。多轮对话记忆至此完整：会话内（第 8 轮）+ 跨调用（第 9 轮）。建议实测：先 `yuangs ai "介绍下闭包"`，退出后再 `yuangs ai "给个例子"`，确认第二次能接上。

## 后续可选（仍非阻塞）

1. 6 处 workflow/git 预存测试失败（第 5 轮显性化，非 AI 交互；PlanWorkflow capability estimation 返回 `undefined` 疑似真 bug）。
2. 长答案增量 markdown 渲染（彻底去掉 finish 重绘）。
3. 代码块超宽行终端换行/截断。
