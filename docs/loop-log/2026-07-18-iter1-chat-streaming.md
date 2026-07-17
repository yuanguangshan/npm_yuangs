# yuangs AI 交互优化 · 第 1 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 1 轮（每 30 分钟）
- **主题**：修复 chat 模式流式输出把原始 JSON 打到终端的 bug
- **范围**：`src/agent/` chat 模式 agent 交互

## 问题现象

`yuangs ai` 交互模式（`handleAIChat`）下，AI 回答时终端**逐字流出原始 JSON 语法**：

```
{ "action_type": "answer", "content": "Linux 是一个开源的操作系统……
```

而不是干净的回答正文。回答结束后还可能出现重绘错位 / 残留鬼影。

## 根因分析

追踪完整链路：

1. **入口**：`src/cli.ts` 的 `yuangs ai [question...]`；交互模式走 `src/commands/handleAIChat.ts`，单轮走 `AgentRuntime.run`。
2. **协议**：`src/agent/protocolV2_2.ts` 的 `buildChatProtocolPrompt()` 要求模型输出**单个 JSON 对象** `{"action_type":"answer","content":"…"}`。
3. **流式下发**：`handleAIChat` 把 `chunk => renderer.onChunk(chunk)` 作为 `onChunk` 传入；`StreamMarkdownRenderer.onChunk` 把每个 chunk **原样写终端**，只在 `finish()` 时用 `extractContentFromJSON` 二次提取重渲染。
4. **致命点**：`src/agent/llm.ts` 的 `runLLM` 流式分支把**原始 chunk 直接 `onChunk?.(chunk, 'thought')` 下发**——即原始 JSON。其中的 `currentBlockType`/`buffer` 是声明了却从未使用的死代码（半成品实现）。
5. **路由放大问题**：ModelRouter 默认开启（`enableRouting ?? true`），典型 chat 走 `runLLM → callLLMWithRouter → core/modelRouter → adapter.execute(onChunk)`，路由路径同样透传原始 JSON。
6. **副作用**：`renderer.finish()` 返回的是原始 buffer（JSON 信封），被 `addToConversationHistory('assistant', …)` 当作助手历史塞回对话上下文，污染后续轮次。

## 修复方案（`src/agent/llm.ts`，+85/−12）

### 1. 新增 `extractStreamableContent(raw)`（导出）

从流式累积的 Agent JSON 中增量提取正文：

- 依次尝试字段名 `"content"` / `"final_answer"` / `"text"`（兼容弱模型字段名偏差）。
- 定位到字段后，按 JSON 规则解码转义（`\n` `\t` `\"` `\\` `\uXXXX` 等）。
- **边界安全**：遇到尚未到达的转义序列（含截断的 `\uXXXX`）或闭合引号时停下，等下一批 chunk 到达后重新扫描补齐——保证不会吐出半截转义或闭合引号。
- 找不到正文字段时返回 `null`（调用方保持等待态 / spinner）。

### 2. `runLLM` 内包一层 `wrappedOnChunk`

- 累积原始流到 `streamRaw`，调用 `extractStreamableContent` 取正文，仅把**增量**（`content.slice(streamEmitted)`）下发。
- 路由路径（`callLLMWithRouter`）与直连路径（`callAI_Stream`）**共用同一个包装**，一处修复覆盖两条路径。
- 非 JSON（不以 `{` 或 ` ``` ` 开头）的流式输出按纯文本直通，兼容不守协议的 adapter。
- 路由失败回退到直连时，重置 `streamRaw`/`streamEmitted`，避免两段输出拼接。

### 3. 顺带修复

- **finish 重绘错位**：渲染器 buffer 现在是干净正文，与实时流出的内容一致，擦行行数准确。
- **上下文污染**：`renderer.finish()` 返回干净正文，`addToConversationHistory` 不再把 JSON 信封存为助手历史。
- 删除死变量 `currentBlockType` / `buffer`。

## 涉及文件

- `src/agent/llm.ts`：新增 `extractStreamableContent` + `wrappedOnChunk` 包装，删除死代码。
- `test/__tests__/agent/extractStreamableContent.test.ts`：新增 10 个单测。

## 验证

- `npx tsc --noEmit`：通过。
- 新增单测 `extractStreamableContent`：**10/10 通过**（覆盖完整 JSON、字段未到达返回 null、冒号后等待引号返回空串、非字符串值跳过、逐批 token 单调增长、转义解码、转义截断边界与 `\uXXXX` 补齐、多字段优先级、代码块包裹、多行换行保留）。
- 回归：流式相关套件（`utils/renderer`、`agent/llmAdapter.parseThought`）全绿。
- `riskDisclosure` / `errorHandling` / `dualAgentRuntime` 共 9 个失败：经 `git stash` 比对确认是**预存失败，与本次改动无关**。

## 状态

- 已在工作区修改，**尚未提交**（等用户确认）。

## 后续待办（按价值排序，留给后续轮次）

1. `ExecutionCompleter.handleReadOnlyTool`（`src/agent/ExecutionCompleter.ts:93`）：chat 模式 `read_file` 结果硬截断 1000 字符显示，对「读文件」类请求过小。
2. `ExecutionHandler.handleAnswer`（`src/agent/ExecutionHandler.ts:156-160`）：`agentRenderer` 已设、`externalRenderer` 未设时，把完整答案按 10 字符「假流式」重放，多余延迟。
3. `StreamMarkdownRenderer.finish()` 的「擦行重绘」在 markdown 渲染换行数 ≠ 纯文本换行数时仍可能残留鬼影；可考虑增量 markdown 渲染彻底去掉重绘。
4. `ExecutionCompleter.ts:78` 的 `requiresWrite` 正则有重复 `改成|改成`。
5. 预存的 9 个失败测试可顺手修。
