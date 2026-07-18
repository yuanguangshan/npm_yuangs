# 模型透明度：响应页脚显示实际使用的模型

- **日期**：2026-07-18
- **背景**：AI 交互优化 loop（13 轮）结束后，用户选择的下一个改进点
- **范围**：`src/utils/renderer.ts`、`src/agent/AgentRuntime.ts`、`test/__tests__/utils/renderer.test.ts`

## 问题

之前用户看不到「这次回答到底是哪个模型出的」：
- 路由器路径会在响应**前**打印 `📡 [Router] 任务路由成功 -> <适配器>`，但那是适配器名、且只在路由成功时才有。
- 非路由路径（显式 `-m`、或路由回退到默认 `Assistant`）完全不显示模型。
- 响应页脚只有 `(耗时: X.XXs)`，没有模型信息。

## 修复

让响应**页脚**统一展示实际模型：

1. **`StreamMarkdownRenderer`**（`src/utils/renderer.ts`）：
   - 新增字段 `private modelUsed?: string` + 方法 `setModelUsed(name)`。
   - `finish()` 页脚追加 ` · 模型: <name>`（未设置则不追加）：
     ```
     ──────────────────── (耗时: 1.23s · 模型: gemini-2.5-flash) ────────────────────
     ```

2. **`AgentRuntime.run`**（`src/agent/AgentRuntime.ts`）：每次 LLM 调用拿到 `thought` 后，`agentRenderer?.setModelUsed(thought.modelName)`。多轮流程里多次调用以最后一次为准（即最终回答的模型）。

## 覆盖的路径

`thought.modelName` 来自 `LLMAdapter`（`result.modelName || finalModel`），覆盖所有情况：
- 路由成功：路由器选的模型（与响应前的 `📡 [Router]` 打印一致，页脚再确认一次）。
- 显式 `-m`：用户指定的模型。
- 路由回退 / 默认：`Assistant`。

只在**流式路径**（TTY 有 renderer）显示页脚；非流式（管道/非 TTY、`marked` 一次性输出）本就无页脚，不受影响。

## 涉及文件

- `src/utils/renderer.ts`：`modelUsed` 字段 + `setModelUsed` + 页脚。
- `src/agent/AgentRuntime.ts`：拿到 thought 后调 `setModelUsed`。
- `test/__tests__/utils/renderer.test.ts`：新增 2 个用例（设置后页脚含模型 / 未设置不含）。

## 验证

- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
- `agent + utils`：**176 测试全绿**（含新增 2 个页脚用例）。

## 状态

改动在工作区，**尚未提交**。
