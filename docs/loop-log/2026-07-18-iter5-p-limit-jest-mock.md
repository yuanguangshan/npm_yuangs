# yuangs AI 交互优化 · 第 5 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 5 轮
- **主题**：修复 p-limit v7 ESM 导致 jest 加载失败的阻塞，让 AI 交互相关测试套件转绿
- **范围**：测试基础设施（`jest.config.js` + 新增 mock）

## 问题

`p-limit` v7 是纯 ESM（`package.json` 里 `"type":"module"`），而本项目用 ts-jest，无法加载 `node_modules` 里的 ESM。`handleAIChat → fileReader → p-limit`（以及 `ContextGatherer` / `git review` / `git resolve`）这条链让 **4 个测试套件直接 fail-to-run**：

- `test/__tests__/commands/pipeline.test.ts`（**AI 聊天管道 `|` 流程**，属 AI 交互范畴）
- `test/__tests__/core/git/ContextGatherer.test.ts`
- `src/core/workflows/__tests__/PlanWorkflow.test.ts`
- `src/core/workflows/__tests__/GitWorkflowSession.test.ts`

第 3 轮试过把 `p-limit` 加进 `transformIgnorePatterns` 放行名单，但 ts-jest 仍无法把它的 `export` 转 CJS（报 `Unexpected token 'export'`）——彻底修需 babel-jest 或降级 p-limit v3（最后一个 CJS 大版本，过旧）。两者都偏重或偏退化。

## 修复（测试专用 mock，不动生产依赖）

确认没有任何测试依赖 p-limit 的**真实并发限制语义**（grep `concurrency/pLimit/pendingCount` 在测试里无命中）。于是加一个同 API 的直通桩：

```js
// test/__mocks__/p-limit.js
function pLimit() {
  return (fn) => Promise.resolve().then(fn);  // 立即执行 fn，返回其结果的 Promise（不真正限流）
}
module.exports = pLimit;
module.exports.default = pLimit;
```

并在 `jest.config.js` 的 `moduleNameMapper` 加一行 `'^p-limit$': '<rootDir>/test/__mocks__/p-limit.js'`。

要点：
- **仅用于 jest**：生产运行时仍用真实 p-limit v7（Node 原生支持其 ESM），不动 `package.json` 依赖、不降级、不引入 babel。
- API 兼容：`pLimit(n)` → `limit(fn)` → `Promise<fn()>`，与真实 p-limit 一致；只是不限流（测试不需要）。

## 验证

- `npx tsc --noEmit`：通过。
- AI 交互相关套件 + pipeline：`agent + utils + commands/pipeline` **11 suite / 167 测试全绿**。
- `pipeline.test.ts`（AI 聊天管道）由 fail-to-run 转为**全绿**——这是本轮的核心收益。
- 全量 jest：`40 passed / 3 failed`（之前 `39 passed / 4 failed-to-run`）。

## 副作用：暴露 3 个 suite 的预存失败（非本轮范围）

p-limit 解除加载阻塞后，另外 3 个原本「fail-to-run」的 suite 现在能加载了，从而**显露出它们各自既有的测试失败**（之前被加载错误掩盖，并非本轮引入）。共 6 处，均在 **git/workflow 子系统**（非 AI 交互范畴）：

- `ContextGatherer`（core/git）2 处：`relevantFiles` 相关过滤与预期不符。
- `PlanWorkflow`（core/workflows）3 处：capability estimation 返回 `undefined`（疑似真 bug）、多 agent 协作、scope 判定。
- `GitWorkflowSession`（core/workflows）1 处：错误文案从 `Cannot proceed` 改成了 `Auto requires completed planning phase`（陈旧断言）。

本轮**未修**这 6 处——偏离「AI 交互」重点。已记录，可后续单独处理（capability estimation 返回 `undefined` 那个值得查是否真 bug）。

## 状态

改动（`jest.config.js` + `test/__mocks__/p-limit.js`）在工作区，**尚未提交**。

## 后续可选

1. 上述 6 处 workflow/git 预存测试失败（非 AI 交互）。
2. 长答案增量 markdown 渲染（彻底去掉 finish 重绘）。
3. 代码块超宽行终端换行/截断。
