# yuangs AI 交互优化 · 第 13 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 13 轮
- **主题**：消除 cli.ts「ai」命令里两分支重复的「流式 + 持久化」代码块（第 12 轮遗留的去重）
- **范围**：`src/cli.ts`
- **性质**：纯重构，行为不变

## 背景

第 10 轮给 AgentRuntime 路径、第 12 轮给 DualAgentRuntime 路径各加了一段「TTY 流式渲染 + 捕获回答 + `addToConversationHistory` 持久化」的逻辑。两段几乎逐字相同（~25 行），唯一差异是 `runtime.run(...)` 的调用签名：

```ts
// AgentRuntime 路径
runtime.run(question, 'chat', onChunk, model, renderer)
// DualAgentRuntime 路径
runtime.run(question, onChunk, model, 'chat', renderer)
```

重复的风险：以后改一处（如持久化策略、错误处理、spinner 文案）很容易漏掉另一处，两条路径悄悄分叉。

## 修复

抽出模块级公共函数 `streamAndPersist(question, runFn)`，封装「创建 renderer → 流式执行 → 捕获 `renderer.finish()` → 持久化到对话历史 → try/catch 友好报错」；两条路径各自只传一个 `runFn(onChunk, renderer)` 回调来屏蔽 `run()` 签名差异：

```ts
// DualAgentRuntime 分支
await streamAndPersist(question || '', (onChunk, renderer) =>
    runtime.run(question || '', onChunk, model, 'chat', renderer));

// AgentRuntime 分支
await streamAndPersist(question || '', (onChunk, renderer) =>
    runtime.run(question || '', 'chat', onChunk, model, renderer));
```

## 涉及文件

- `src/cli.ts`：新增 `streamAndPersist` 公共函数；两分支各自从 ~25 行缩到 ~3 行调用。

## 验证

- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
- `node dist/cli.js --version`：正常加载。
- `test/__tests__/agent`：**157 测试全绿**。
- 纯重构、行为不变（流式渲染、捕获、持久化、错误处理逻辑全部原样搬进公共函数）。

## 状态

改动（`src/cli.ts`）在工作区，**尚未提交**。

## 后续可选

1. 6 处 workflow/git 预存测试失败（非 AI 交互；PlanWorkflow capability estimation 返回 `undefined` 疑似真 bug）。
2. 长答案增量 markdown 渲染（彻底去掉 finish 重绘，而非视口守卫）—— 仍是最有分量的功能性缺口，但实现复杂、盲改风险高。
3. 模型透明度：响应页脚显示实际使用的模型（路由器路径已打 adapter，非路由路径未显示）。
