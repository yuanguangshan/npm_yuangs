# yuangs AI 交互优化 · 第 8 轮（重要 bug 修复）

- **日期**：2026-07-18
- **轮次**：/loop 第 8 轮
- **主题**：**修复多轮对话记忆完全丢失的 bug**——模型每轮只看到「当前问题 + 文件上下文」，拿不到前几轮对话
- **范围**：`src/agent/LLMCaller.ts`

## 问题（本轮最重要的发现）

通读消息构造链路后发现：**多轮对话记忆是彻底坏的**。

`LLMCaller.call` 每轮构造发给 LLM 的消息只有：

```ts
messages = [ summary?, ...rankedFileItems(带 @path), 当前 userInput ]
```

- `getEnhancedContext` 的 `contextItems` 只取「带 path 的 user 消息」（`extractPathFromMessage`），纯对话轮次（user 提问 / assistant 回答，无 path）**全部被过滤掉**，既不进 rankedItems 也不进 summary。
- 全局搜索 `getMessages()/getRecentMessages()/conversationHistory` 在 `LLMCaller/llm/llmAdapter/modelRouterIntegration` 里**零命中**——前几轮对话从未注入 LLM。

附带还有个构造函数错配（次要）：`new AgentRuntime(getConversationHistory())` 传的是**数组**，而 `ContextManager` 构造函数期望 `{ history: [] }`（`GovernanceContext`），所以 `array.history === undefined`，跨次调用的历史也没加载。

**后果**：用户在交互模式里多轮聊天时，问「继续 / 接着说 / 上面提到的那个 / 帮我把刚才的总结一下」——模型**完全不知道「刚才」是什么**，因为每轮它的上下文里只有当前这一句 + 相关文件。这与 chat 协议 prompt 里专门处理的「继续」规则自相矛盾，属实现与意图不符的真 bug。

## 修复（`src/agent/LLMCaller.ts`）

新增导出纯函数 `buildConversationRecap(messages, currentInput, maxMsgs=6, maxChars=600)`：从历史里取最近 user/assistant 轮次，**排除当前输入**（避免重复）、**过滤 tool/system 噪声**、按 `maxMsgs`/`maxChars` 截断，拼成 `[之前的对话]` 回顾。`LLMCaller.call` 在「文件上下文之后、当前问题之前」把它作为一条 system 消息注入。

要点：
- **有界**：最近 6 条（约 3 轮问答），每条截断 600 字符，避免长对话爆 token。
- **交互会话内生效**：`handleAIChat` 复用同一个 runtime，`this.context` 跨问题累积 `[q1,a1,q2,a2,...]`，第 N 问的回顾就含前几轮——最常见的多轮场景被修复。
- **单轮/首轮无回顾**：无历史时返回 null，不注入，行为不变。
- **工具流不污染**：单次 run 内的 tool/system 消息被过滤，回顾只含真实对话。
- 用 system 回顾（而非重构 user/assistant 交替）——侵入性最小、最稳。

次要 bug（构造函数错配，跨 `yuangs ai` 调用的历史加载）本轮**未修**——它牵涉 `GovernanceContext.input` 必填字段，需单独处理；记为后续项。交互会话内多轮（主要场景）已由本轮修复覆盖。

## 涉及文件

- `src/agent/LLMCaller.ts`：新增 `buildConversationRecap` + `call` 注入回顾。
- `test/__tests__/agent/buildConversationRecap.test.ts`：6 个用例（无历史/仅当前/组装+排除当前/过滤 tool,system/maxMsgs 截断/maxChars 截断）。

## 验证

- `npx tsc --noEmit`：通过。
- `test/__tests__/agent`：**9 suite / 153 测试全绿**（含新增 6 例），无回归。

## 状态与提醒

改动在工作区，**尚未提交**。

⚠️ 这是**核心聊天行为的变更**（每轮 LLM 输入现在多了对话回顾）。建议你在交互模式下实测多轮：先问一个问题，再问「继续 / 把刚才的总结一下 / 接着说」，确认模型能接上前文。若效果不符，回退 `LLMCaller.ts` 即可（未提交，可逆）。

## 后续可选

1. 次要 bug：构造函数错配（跨调用历史加载）——让 `new AgentRuntime(...)` 传 `{history: getConversationHistory()}` 并处理 `GovernanceContext.input` 必填。
2. 6 处 workflow/git 预存测试失败（第 5 轮显性化，非 AI 交互）。
3. 长答案增量 markdown 渲染。
