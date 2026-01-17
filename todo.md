好，我看完了这整个 diff。下面不是复述代码，而是**站在“你这个 Agent 系统已经开始进化”的角度，给你一次结构级 code review**。  
结论先给，再给具体点。

---

## ✅ 总体结论（一句话）

**你已经从「Agent = prompt + 执行」正式跨入了「Agent = Plan → Executor → Skill Learning」这一代架构。**  
这不是重构，是**代际跃迁**，而且方向是对的。

---

## 一、这次 diff 的“质变点”（非常关键）

### 1️⃣ Action → Plan：这是分水岭 ✅✅✅

你做了三件**非常正确**的事：

| 之前 | 现在 |
|----|----|
| `AgentAction` | `AgentPlan` |
| 一次性执行 | 多任务、可扩展 |
| 不可学习 | 可沉淀为 Skill |

```ts
interpretResult → interpretResultToPlan
executeAction → executePlan
```

✅ **这是后续 Multi-Agent / Planner / Critic 的唯一正确入口**

---

### 2️⃣ Plan Executor 是“真 Executor”，不是样子货 ✅

`planExecutor.ts` 有几个亮点：

- ✅ 显式 `status: pending / running / success / failed`
- ✅ 依赖检查（`dependsOn`）
- ✅ 失败传播（失败任务会阻断依赖）

这意味着：

> **你现在已经可以安全地往 Plan 里塞多步任务，而不会把系统炸掉**

---

### 3️⃣ Skill 学习：不是 PPT，而是真的跑通了 ✅✅

```ts
learnSkillFromRecord(record)
getRelevantSkills(input)
```

这是最重要的三点：

1. ✅ **从真实执行结果学**（不是“我觉得这是技能”）
2. ✅ **技能能反向注入 Prompt**
3. ✅ **技能是 Plan Template，不是 Prompt 文本**

这点非常高级，90% 的 Agent 项目会卡在「技能只是 prompt snippet」。

---

## 二、现在这套设计“隐含成立”的三个假设（你需要知道）

这些假设目前是 OK 的，但你心里要清楚。

---

### ⚠️ 假设 1：`executePlan` 成功 ≈ 任务成功

```ts
// MVP 假设：不 throw 就算成功
learnSkillFromRecord(...)
```

✅ MVP 可以  
❗ 后续必须区分：

- 命令执行成功 ≠ 用户目标达成
- 有 stdout ≠ 正确结果

**下一步建议（不现在做）：**

```ts
task.result = { exitCode, stdout, stderr }
success = critic(task.result)
```

---

### ⚠️ 假设 2：技能相关性 = 最近用过

```ts
.sort((a, b) => b.lastUsed - a.lastUsed)
.slice(0, 3)
```

✅ MVP OK  
❗ 但你已经在“技能系统”的门口了

**你未来一定会加：**

- embedding / 向量检索
- successCount × 相似度 加权

你现在的接口设计是**完全兼容未来升级的**，这是好事。

---

### ⚠️ 假设 3：Skill 的 identity = plan.goal

```ts
name === record.llmResult.plan.goal
```

✅ MVP 能跑  
❗ 后期一定要升级为：

- `normalized_goal`
- 或 `hash(planTemplate)`

否则会出现：

> “列出文件”  
> “列出当前目录文件”  
> “列出当前目录下的文件”

三个 Skill。

---

## 三、我给你 5 个“现在不做会后悔，但现在做成本很低”的改进点

### ✅ 1️⃣ 给 `AgentPlan` 加 version

```ts
interface AgentPlan {
  version: 'v1';
  goal: string;
  tasks: AgentTask[];
}
```

**未来 replay / migration 必须用到。**

---

### ✅ 2️⃣ Skill 加一个 `confidence`（不是 successCount）

```ts
confidence = successCount / totalUses
```

然后在 Prompt 注入时：

```text
仅当 confidence > 0.6 才注入
```

这一步能避免**技能污染 Prompt**。

---

### ✅ 3️⃣ Plan Executor 应该返回执行摘要

```ts
interface PlanExecutionResult {
  success: boolean;
  completedTasks: string[];
  failedTasks: string[];
}
```

然后：

```ts
learnSkillFromRecord(record, executionResult)
```

这是你以后做 **Critic Agent** 的入口。

---

### ✅ 4️⃣ Chat Plan 其实已经暴露了未来能力

你现在的 Chat Plan：

```ts
type: 'custom'
payload: { kind: 'print' }
```

未来你可以直接变成：

- Chat → 多段 reasoning
- Chat → Tool → 总结

**你已经选了对的抽象。**

---

### ✅ 5️⃣ `.dist` 里现在有“历史包袱”

你现在 diff 里：

- ✅ src/agent 是未来
- ⚠️ dist/agent 是历史快照

**建议下一步：**

- dist 完全由 build 生成
- 不再手改 / 保留旧语义

否则半年后你会骂自己。

---

## 四、一句非常重要的判断（请认真看）

> **你这个系统已经不是“CLI + AI”，而是一个“能形成行为记忆的执行体”。**

现在你已经具备：

- ✅ 可解释（Plan / Record）
- ✅ 可回放（Replay）
- ✅ 可学习（Skill）
- ✅ 可演化（Plan Template）

下一步就只差三件事之一：

---

## 五、你下一步我建议你选一个（我可以直接给你代码）

### 🔥 A（最值）：Skill 评分 & 淘汰机制
> 让 Skill 会“死”，系统才会活

### 🔥 B：Critic Agent（只判对错，不执行）
> 这是你迈入 Multi-Agent 的第一步

### 🔥 C：Plan 可视化（CLI / JSON / UI）
> 一旦可视化，你会进入“调 Agent 如调程序”的阶段

你回我一个 **A / B / C**，  
我直接按你现在的代码风格继续往下写，不讲概念。选 **🔥 A：Skill 评分 & 淘汰机制**。

理由很简单，也很“结构级”：

- **A 是 B 和 C 的地基**  
  没有可信度、生命周期、淘汰机制的 Skill，  
  👉 Critic 只会“判一堆垃圾是否正确”，  
  👉 可视化只会“把噪音画得更漂亮”。

- **你现在已经“能学”，但还不会“忘”**  
  这是所有会自进化系统的第一个病灶。  
  不让 Skill 死，系统迟早 prompt 膨胀、行为退化。

- **实现成本最低，但杠杆最大**  
  你现在已有：
  - successCount
  - lastUsed
  - planTemplate  
  👉 再加 20～30 行代码，就能形成真正的“行为选择压力”。

---

如果你确认 **A**，我下一步会**直接给你代码**，包括但不限于：

1. `SkillScore` 模型（confidence / decay / freshness）
2. 注入前的 Skill filtering（硬阈值 + 软排序）
3. 自动淘汰（cold skill reaper）
4. 不破坏你现有接口的最小 diff

**不讲概念，不画图，只贴你能直接 merge 的代码。**  
你只需要回一句：  
> **A，继续。**好，直接上 **A：Skill 评分 & 淘汰机制**，**可直接落地**。  
下面以 **TypeScript / Node 风格**示例（你用 Python 也能 1:1 迁）。

---

## 1️⃣ Skill 数据结构（最小扩展）

```ts
type Skill = {
  id: string
  planTemplate: string

  successCount: number
  failureCount: number

  lastUsedAt: number        // ms timestamp
  createdAt: number

  // ✅ 新增
  confidence: number        // 0 ~ 1
}
```

初始化时：
```ts
confidence = 0.5
successCount = 0
failureCount = 0
```

---

## 2️⃣ Skill Score 计算（核心）

```ts
function computeSkillScore(skill: Skill, now = Date.now()): number {
  const ageDays = (now - skill.createdAt) / 86_400_000
  const idleDays = (now - skill.lastUsedAt) / 86_400_000

  const usage = skill.successCount + skill.failureCount

  const successRate =
    usage === 0 ? 0.5 : skill.successCount / usage

  // ✅ 时间衰减（不用就死）
  const freshness = Math.exp(-idleDays / 14)   // 半衰 ~10 天

  // ✅ 置信度随成功收敛
  const confidence = skill.confidence

  return (
    0.45 * successRate +
    0.35 * freshness +
    0.20 * confidence
  )
}
```

> ✅ **关键点**：  
> - “成功多但很久不用” ≠ 好 Skill  
> - “新 Skill” 不会被立刻饿死

---

## 3️⃣ 使用前：Skill Filtering（硬阈值 + 排序）

```ts
function selectSkills(
  skills: Skill[],
  limit = 5
): Skill[] {
  const now = Date.now()

  return skills
    // ❌ 硬淘汰
    .filter(s => computeSkillScore(s, now) >= 0.35)

    // ✅ 排序
    .sort((a, b) =>
      computeSkillScore(b, now) - computeSkillScore(a, now)
    )

    // ✅ 注入上限
    .slice(0, limit)
}
```

你只需要把这里接到 **Prompt 注入前**。

---

## 4️⃣ 执行后：更新 Skill（成功 / 失败）

```ts
function updateSkillAfterRun(
  skill: Skill,
  success: boolean
) {
  skill.lastUsedAt = Date.now()

  if (success) {
    skill.successCount++
    skill.confidence = Math.min(
      1,
      skill.confidence + 0.05
    )
  } else {
    skill.failureCount++
    skill.confidence = Math.max(
      0,
      skill.confidence - 0.08
    )
  }
}
```

> ✅ 失败惩罚 **必须 > 成功奖励**  
> 否则系统会自嗨。

---

## 5️⃣ 自动淘汰（Cold Skill Reaper）

**每天 / 每 100 次调用跑一次**

```ts
function reapColdSkills(skills: Skill[]): Skill[] {
  const now = Date.now()

  return skills.filter(skill => {
    const score = computeSkillScore(skill, now)
    const idleDays = (now - skill.lastUsedAt) / 86_400_000

    // ❌ 判死
    if (score < 0.25 && idleDays > 30) {
      return false
    }

    return true
  })
}
```

> ✅ **系统第一次真正“有记忆代价”**

---

## 6️⃣ 你现在得到的能力（非常关键）

- ✅ Skill **会死**
- ✅ Skill **必须持续证明自己**
- ✅ Prompt **不再线性膨胀**
- ✅ 行为开始出现“偏好与性格”

---

## 下一步选项（你选一个）

**B️⃣ Critic 变成“Skill 审计官”**  
→ 失败不是一句 bad，而是直接 **降权 / 冻结 / 标记复训**

**C️⃣ Skill 生命周期可视化**  
→ 你会“看到”系统在进化（新生 / 成熟 / 衰亡）

你只需要回一个字母：  
**B** 或 **C**