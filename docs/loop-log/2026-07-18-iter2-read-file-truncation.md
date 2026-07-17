# yuangs AI 交互优化 · 第 2 轮

- **日期**：2026-07-18
- **轮次**：/loop 第 2 轮（每 30 分钟）
- **主题**：chat 模式只读工具（read_file 等）结果展示从「1000 字符硬截断」改为「行级自适应截断」
- **范围**：`src/agent/` chat 模式工具结果展示

## 问题现象

chat 模式下用户请求「读一下某文件」时，`read_file` 等只读工具的结果在 `ExecutionCompleter.handleReadOnlyTool` 里被硬截断到 **1000 字符**：

```ts
const displayOutput = result.output.length > 1000
  ? result.output.slice(0, 1000) + '\n...(内容已截断)'
  : result.output;
```

两个问题：
1. **1000 字符太小**：典型源文件 2000–10000+ 字符，用户只能看到约 15 行，远不够。
2. **按 UTF-16 码元 slice**：`slice(0, 1000)` 在含中文/emoji 的内容上可能切断代理对，产生乱码尾字符。
3. **提示信息单薄**：只说「内容已截断」，不告知总量、也不引导如何继续查看。

## 根因

`src/agent/ExecutionCompleter.ts` 的 `handleReadOnlyTool`，chat 分支对 `read_file / read_file_lines / read_file_lines_from_end / search_in_files / file_info` 这些工具走「直接展示工具结果」的快速路径（不经 LLM 二次总结，设计如此——避免多余往返）。展示前的截断逻辑过于粗暴。

展示链路：`renderAndFinish` → 把 `displayOutput` 写入 renderer buffer + quietMode → `finish()` 一次性 markdown 渲染输出（quietMode 路径不擦行重绘，无鬼影风险）。因此放宽截断是安全的。

## 修复方案

### 1. 新增纯函数 `truncateToolOutputForChat`（`src/agent/ExecutionStabilizer.ts`）

- **按整行截断**（`split('\n')` → `slice(0, limit)` → `join('\n')`），永不切断多字节字符。
- **maxLines 默认按终端高度自适应**：`Math.max(40, (process.stdout.rows || 24) * 2)`，约 2 屏、下限 40 行。远优于 1000 字符；大终端自动放宽，无终端时回落 24 行。
- **可操作提示**：`(已截断，共 N 行，已显示前 M 行；可要求继续读取后续内容)`，与项目既有 `已截断，共 N 行` 风格一致（见 `handleAIChat` 的 `truncateContent`）。
- 放在「纯函数、零状态依赖」的 `ExecutionStabilizer` 文件中，便于单测。

### 2. `ExecutionCompleter` 接入

- 导入并在 chat 自动展示分支用 `truncateToolOutputForChat(result.output)` 替换原硬截断。
- 顺手清理同函数的重复正则：`requiresWrite` 里 `改成|改成|改为` → `改成|改为`（去掉重复的 `改成`）。

## 涉及文件

- `src/agent/ExecutionStabilizer.ts`：新增导出函数 `truncateToolOutputForChat`。
- `src/agent/ExecutionCompleter.ts`：接入新函数；清理重复正则。
- `test/__tests__/agent/truncateToolOutputForChat.test.ts`：新增 5 个单测。

## 验证

- `npx tsc --noEmit`：通过。
- 新增单测 `truncateToolOutputForChat`：**5/5 通过**（短输出原样返回、超限按行截断且提示含总行数/已显示行数、不切断 emoji 代理对、边界等于限制不截断、默认自适应）。
- 回归：第 1 轮的 `extractStreamableContent`（10/10）仍全绿；流式相关套件无影响。

## 状态

- 已在工作区修改，**尚未提交**（等用户确认）。

## 后续待办（剩余目标，留给后续轮次）

1. `ExecutionHandler.handleAnswer`（`src/agent/ExecutionHandler.ts:156-160`）：`agentRenderer` 已设、`externalRenderer` 未设时，把完整答案按 10 字符「假流式」重放，多余延迟。
2. `StreamMarkdownRenderer.finish()` 的「擦行重绘」在 markdown 渲染换行数 ≠ 纯文本换行数时仍可能残留鬼影；可考虑增量 markdown 渲染彻底去掉重绘。
3. read_file 展示经 markdown 渲染会部分破坏代码原貌（`#` 注释变标题、缩进变代码块等）；可按文件类型包裹 code fence 原样展示（注意区分 read_file / search_in_files / file_info 的输出形态）。
4. 预存的 9 个失败测试（`riskDisclosure`/`errorHandling`/`dualAgentRuntime`）可顺手修。
