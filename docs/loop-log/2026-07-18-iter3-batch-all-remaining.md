# yuangs AI 交互优化 · 第 3 轮（批量收尾）

- **日期**：2026-07-18
- **轮次**：用户要求「一次全修了吧」——批量处理第 1/2 轮遗留的全部剩余目标
- **主题**：handleAnswer 假流式、renderer 重绘鬼影、read_file 代码被 markdown 破坏、以及预存失败测试
- **范围**：`src/agent/`、`src/utils/renderer.ts`、测试

## 修复一览

### ① handleAnswer 的 10 字符「假流式」（`src/agent/ExecutionHandler.ts`）

`handleAnswer` 在「有 agentRenderer、无 externalRenderer」时，把**已经完整**的答案按 10 字符一段循环 `onChunk` 重放——纯属人为延迟。改为一次性 `onChunk(result.output)` 后 `finish()`。（该分支当前实际不可达：所有调用方要么都传 renderer+onChunk，要么都不传，但代码语义仍应正确。）

### ② 流式 finish() 重绘鬼影 + JSON 误抽取（`src/utils/renderer.ts`）

两个问题：

1. **重绘鬼影**：`finish()` 用 `\x1b[A` 向上擦行重写 markdown，但内容超出一屏（顶部滚出视口）时，光标回不到滚走的行 → 残留鬼影。加**视口守卫**：仅当 `lineCount <= process.stdout.rows` 才擦行重绘；超出则保留已流式内容、仅换行收尾（无鬼影、无重复）。

2. **`extractContentFromJSON` 过度贪婪**：旧实现对任何含 `{...}` 的文本都尝试抓取并抽 `content`/`text` 字段——读一个含 `"content"` 的 JSON 文件会被抽走内部字段。改为**只对真正的 Agent 动作信封**（以 `{` 开头、`}` 结尾、含 `action_type`）解包，其余原样返回。这也让「代码块包裹」生效（围栏不再被剥掉）。

### ③ read_file 等工具结果被 markdown 破坏（`src/agent/ExecutionStabilizer.ts` + `ExecutionCompleter.ts`）

chat 模式展示 `read_file` 等工具结果时走 markdown 渲染，代码被破坏（`#` 注释变标题、缩进变代码块、`*` 变列表）。新增纯函数 `wrapAsCodeFence(content)`（自适应围栏长度，避免内容里的 ``` 截断围栏），在 `ExecutionCompleter` 的只读工具展示分支把（已截断的）结果包裹为代码块原样展示。

### ④ 预存失败测试（3 个 suite，共 9 处失败 → 全绿）

- **`errorHandling`**：
  - `isRetryableError` 形参从 `RetryConfig` 收窄为 `Pick<RetryConfig,'retryableErrors'>`（函数只用到该字段，旧签名过严）。
  - 「跨策略累加重试」用例改用可重试错误（含 `network`），否则 `withRetry` 首次失败即 break，验证不到累加。
- **`riskDisclosure`**：测试 fixture 的 `level: 'low'` 被推断为 `string`，与 `RiskLevel` 字面量类型不兼容。给三处 level 字面量加 `as const`（不触碰带额外字段的 fixture，避免多余属性检查）。
- **`dualAgentRuntime`**（9 处，根因是早先 planner 重构后测试未同步）：
  - **mock 泄漏**：`respect planner disabled config` 用例设的 `getUserConfig.mockReturnValue({disablePlanner:true})` 不会被 `clearAllMocks` 重置，污染后续所有 planner 用例误走 quick path。`beforeEach` 显式重置 `getUserConfig` 为 `{}`。
  - **关键词不触发**：7 个用例输入（`Execute two steps`/`Try to plan`/`Track state` 等）不含 planner 关键词 → 走 quick path。给输入加上关键词。
  - **空 steps mock**：refactor / cancel 用例 mock 返回 `steps:[]` 却期望执行/确认。补 1 步计划。
  - **陈旧断言文案**：确认提示从 `[y] 继续执行` 改为 `Proceed with this plan?`；且该 prompt 经 readline.question 发出（mock 不回显），改为断言 question mock 被以该 prompt 调用。
  - **运行时真 bug（顺带修）**：(a) 用户中途停止后仍打印「🎉 All tasks completed!」——加 `stopped` 标志，仅全部跑完才宣告完成；(b) planner 出错只进 `log.error`（用户看不到）——补一行用户可见的 `console.log`；(c) 空计划（如 planner 出错兜底）仍询问「是否继续」——空 steps 时直接收尾。
  - **executionStore mock 不往返**：`loadExecutionRecord` 返回写死旧记录，`learnSkillFromRecord` 拿不到本次执行的 goal。改为回放最近一次 save 的记录。
  - **update skill 用例计划不一致**：原计划 1 步却 mock 两次执行并期望失败。补成 2 步（第 2 步匹配技能名并失败）。

## 涉及文件

源码：`src/utils/renderer.ts`、`src/agent/ExecutionHandler.ts`、`src/agent/ExecutionStabilizer.ts`、`src/agent/ExecutionCompleter.ts`、`src/agent/errorHandling.ts`、`src/agent/DualAgentRuntime.ts`
测试：`test/__tests__/agent/{dualAgentRuntime,errorHandling,riskDisclosure,truncateToolOutputForChat}.test.ts`

## 验证

- `npx tsc --noEmit`：通过。
- `npx jest test/__tests__/agent test/__tests__/utils`：**10 suite / 160 测试全绿**（含本轮新增 `wrapAsCodeFence` 3 例）。
- `npx jest`（全量）：503 通过 / 4 失败。

## 仍存在的失败（预存、与本轮无关，已定位根因）

全量 jest 仍有 4 个 suite 失败：`PlanWorkflow`、`GitWorkflowSession`、`commands/pipeline`、`core/git/ContextGatherer`。

根因：`p-limit` v7 是纯 ESM，其 `index.js` `import 'yocto-queue'`（也是 ESM），而本项目 jest 用 ts-jest、`transformIgnorePatterns` 只放行 `ora|marked|marked-terminal` → 解析 `p-limit` 时报 `Cannot use import statement outside a module` / `Unexpected token 'export'`。这些 suite 经 `handleAIChat → fileReader → p-limit` 链受牵连。

尝试过把 `p-limit` 加入放行名单，但会变成 `Unexpected token 'export'`（ts-jest 未把 p-limit 的 ESM `export` 转 CJS）——彻底修复需要 babel-jest + 转模块插件、或降级 p-limit v6，超出本轮范围，已回滚 jest 配置保持原状。`jest.config.js` 与 `fileReader.ts` 均未改动（`git diff` 确认）。

## 状态

本轮所有改动仍在工作区，**尚未提交**（等用户确认）。至此第 1/2/3 轮列出的 AI 交互优化目标全部完成。

## 后续可选

1. p-limit ESM 与 jest 的彻底兼容（babel-jest 或降级 p-limit）——会让剩余 4 个 suite 转绿。
2. 长答案的增量 markdown 渲染（彻底去掉 finish 重绘，而非视口守卫）。
3. 代码块长行在终端的换行/截断展示（read_file 超宽行）。
