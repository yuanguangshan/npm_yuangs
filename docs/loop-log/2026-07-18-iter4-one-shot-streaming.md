# yuangs AI 交互优化 · 第 4 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 4 轮（第 1–3 轮的既定目标已全部完成，本轮找新机会）
- **主题**：单轮 `yuangs ai <question>` 补齐流式输出
- **范围**：`src/cli.ts`

## 问题

第 1 轮已让**交互模式**（`handleAIChat`，`yuangs ai` 无参数进入）流式输出回答正文。但**单轮模式**（`yuangs ai "问题"`）一直没接流式：

```ts
// cli.ts:160（改前）
await runtime.run(question || '', options.exec ? 'command' : 'chat', undefined, model);
//                                                        ^^^^^^^^^ onChunk = undefined → 不流式
```

结果：终端里跑 `yuangs ai "帮我详细介绍 Linux"` 时，用户要干等到整篇长文生成完才一次性出现，期间无任何反馈——而交互模式早已是逐字流出。

## 修复（`src/cli.ts`）

在单轮 chat 分支接入 `StreamMarkdownRenderer`，复用与 `handleAIChat` 完全一致的流式模式（spinner + onChunk + finish）。关键：**只在交互式终端、且非 `--exec` 时启用**：

```ts
const useStream = process.stdout.isTTY && !options.exec;
if (useStream) {
  // 流式：逐字显示，与交互模式一致
  const renderer = new StreamMarkdownRenderer(' 🤖 AI  ', spinner, true);
  try {
    await runtime.run(question || '', 'chat', (chunk) => renderer.onChunk(chunk), model, renderer);
  } finally {
    renderer.finish();
  }
} else {
  // 管道 / 非 TTY / --exec：保持原样（marked 一次性输出），避免 ANSI 擦行重绘污染管道
  await runtime.run(question || '', options.exec ? 'command' : 'chat', undefined, model);
}
```

设计要点：
- **TTY 守卫**：`process.stdout.isTTY` —— 管道（`yuangs ai q | cat`、脚本捕获）下走原路径，输出干净，不被流式的 `\x1b[A` 擦行重绘破坏。
- **排除 `--exec`**：命令模式主要是工具/命令执行（无 content 正文可流），保持原行为。
- **`try/finally` + `renderer.finish()`**：无论 run 是否抛错，都停止 spinner 并渲染 buffer，不残留转动图标。
- 流式正文提取复用第 1 轮的 `extractStreamableContent`（只下发 content 正文，不吐 JSON 语法）。

## 验证

- `npx tsc --noEmit`：通过。
- `npm run build`：通过（确认新增的动态 import `./utils/renderer`、`ora` 解析正常）。
- `node dist/cli.js --version`：CLI 正常加载（入口未被破坏）。
- 未触发真实 API 调用（需用户密钥、有成本）；流式分支与已验证的 `handleAIChat` 逐字同构，置信度高。

## 状态

改动在工作区，**尚未提交**。第 1–4 轮 AI 交互相关改动累积未提交（等用户确认是否 commit）。

## 后续可选（仍非阻塞）

1. p-limit v7 ESM 与 jest 不兼容（4 个 suite）——需 babel-jest 或降级 p-limit。
2. 长答案增量 markdown 渲染（彻底去掉 finish 重绘）。
3. 单轮模式也可考虑加 `handleAIChat` 那样的失败重试（maxRetries）。
