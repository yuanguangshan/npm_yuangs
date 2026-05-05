# 代码变更治理形式化验证指引

本目录包含 `yuangs` 核心治理逻辑的 TLA+ 规约，用于在代码变更前**数学地证明安全性**。

## 快速开始

1. 安装 [VS Code](https://code.visualstudio.com/) 及插件 **TLA+** (`alygin.vscode-tlaplus`)。
2. 在 VS Code 中打开 `docs/specs/CodeChangeGovernanceV2.tla`。
3. 按 `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)，输入 **`TLA+: Check model with TLC`**。
4. 等待输出 `Success`（约 10‑30 秒）。若失败，TLC 会给出**反例轨迹**。

> **命令行方式**（用于 CI）：
> `java -jar tla2tools.jar -workers auto docs/specs/CodeChangeGovernanceV2.tla`
>
> 前置要求：JRE/JDK ≥ 11，且项目根目录存在 `tla2tools.jar`。

## 架构概览

### 治理流程状态机

```
DRAFT → PROPOSED → APPROVED → EXECUTED → OBSERVED → VERIFIED
                   ↘ REJECTED ←────── (任意非终态阶段)
                   ↗ (可从 REJECTED 重新 Propose)
```

- 一个动作只能从 `DRAFT` 或 `REJECTED` 发起新提案。
- 执行前必须经过 `APPROVED`，且必须持有**有效能力令牌**。
- 验证通过（`VERIFIED`）要求观察到的变更与声明变更一致。
- 任何阶段均可 `REJECTED`，之后可重新 `Propose`。

### 令牌生命周期

```
IssueCap → cap 加入 caps (有效集)
RevokeCap → cap 从 caps 移入 revokedCaps (失效集)
Execute 要求 ∃ cap ∈ (caps \ revokedCaps) 且 CapabilityGrant(cap, "execute")
已撤销令牌不可重新签发（IssueCap 守卫 cap ∉ revokedCaps）
```

> **核心约束**：`caps ∩ revokedCaps = {}`（令牌不能同时有效和已撤销）。

## 安全性质（Invariant）

| 性质 | 含义 | 违反后果 |
|------|------|----------|
| **TypeOk** | 所有变量始终在有效范围内，令牌集互斥 | 系统内部状态矛盾 |
| **P1** `ExecutionRequiresApproval` | 执行前必须经过审批 | 可绕过审批直接执行 |
| **P2** `CapabilityRequired` | 执行时必须持有有效能力令牌 | 无权限也可执行危险操作 |
| **P3** `NoExtraChanges` | 验证通过 → 观察到的变更 = 声明变更 | 实际改动了未声明的文件 |
| **P4** `NoExecuteAfterRevocation` | 令牌撤销后不得执行 | 吊销令牌后仍可操作 |
| **P5** `NoDoubleExecute` | 同一动作不得重复执行 | 无限循环/重复修改 |

---

## 代码映射关系（规约 ↔ TypeScript）

| TLA+ 性质 | TypeScript 对应 | 映射强度 | 说明 |
|-----------|----------------|---------|------|
| `TypeOk` | `CapabilityLevel.ts` + `PolicyEngine` 策略约束 | 概念对应 | TLA+ 的状态类型约束在代码中体现为能力等级枚举和策略框架的类型安全保证。 |
| `ExecutionRequiresApproval` | `GovernanceService.adjudicate()` → `evaluateProposal()` + `PreFlightChecker.passGovernance()` | **直接对应** | 审批是显式的、有完整策略引擎支撑。 |
| `CapabilityRequired` | `ToolExecutor.checkToolCapability()` → `canExecuteTool()` | **直接对应** | 工具执行前检查 `CapabilityLevel` 是否满足，不满足直接拒绝。 |
| `NoExtraChanges` | `ExecutionCompleter` + `ExecutionStabilizer` | 设计意图对应 | TLA+ 中 `observations == declaredChanges` 是理想约束。代码通过输出稳定和自动完成近似实现，但未做精确比对。 |
| `NoExecuteAfterRevocation` | `CapabilityLevel` 降级链 + `errorTracker.shouldBlockExecution()` | 概念对应 | 能力降级使工具不可用，错误追踪在连续失败后阻止执行，但机制不同于令牌撤销。 |
| `NoDoubleExecute` | `ExecutionHandler.trackDuplicate()` | **直接对应** | 检查 tool+params 重复，连续相同输出则 break，防止循环调用。 |

> **关键发现**：P3（NoExtraChanges）在代码侧尚未被**严格实现**。TLA+ 提供了一个比当前代码更严格的标准，未来可通过引入 diff 对比或文件指纹机制来精确验证"声明变更 = 实际变更"。

---

## TLC 修复历史（教育意义）

以下是 TLC 在实际运行中发现的**真实逻辑漏洞**。每个 bug 在运行前都是不可见的，但 TLC 通过穷举状态空间暴露了它们。

### Bug #1：撤销不删除（State 9 触发 TypeOk 违规）

**症状**：`RevokeCap` 将 `cap` 加入 `revokedCaps`，但未从 `caps` 中移除。
**违反**：`caps ∩ revokedCaps = {}` 被破坏。
**修复**：`caps' = caps \ {cap}` — 撤销时必须同时从有效集移除。
**教训**：状态机中"加入失效集"和"移出有效集"是两个独立操作，缺一不可。

### Bug #2：令牌可重复签发（State 5 触发 TypeOk 违规）

**症状**：`IssueCap` 允许对已存在于 `revokedCaps` 中的令牌重新签发。
**违反**：`caps ∩ revokedCaps = {}` 被破坏（同一 cap 再次出现在 caps 中）。
**修复**：增加守卫 `cap ∉ revokedCaps` — 已撤销令牌永远不可重新签发。
**教训**：撤销不仅是状态变更，更是**永久性终结**。如果业务允许重新签发，需要引入新的令牌 ID 而非复用旧 ID。

### Bug #3：全拒绝死锁（State 9 触发 Deadlock）

**症状**：所有动作 `REJECTED` + 所有令牌撤销后，无任何可用迁移。
**修复**：
- 允许 `Propose` 从 `REJECTED` 状态重新发起（现实中被拒绝的方案可以重新提交）。
- `.cfg` 添加 `CHECK_DEADLOCK FALSE` — 明确声明全拒绝是合法终止状态。
**教训**：形式化模型中的"死锁"不一定是 bug，有时是缺失的正常终态。

---

## 自定义验证范围

通过修改 `.cfg` 文件中的常量集来扩大或缩小穷举范围：

```cfg
CONSTANTS
  Actions = {act1, act2, act3}        # 增加动作数量
  Agents = {user_admin, ai_agent, reviewer}  # 增加代理
  CapabilityTokens = {cap1, cap2, cap3, cap4} # 增加令牌
```

> **注意**：状态空间随常量数量指数增长。建议从小到大逐步验证。

## 规约动作 ↔ 源码对照

| TLA+ 动作 | TypeScript 对应 |
|-----------|----------------|
| `Propose` | `PreFlightChecker.check()` |
| `Approve` | `GovernanceService.evaluate()` → `allowed: true` |
| `Execute` | `ToolExecutor.execute()` |
| `Observe` | `ExecutionStabilizer.isOutputStable()` |
| `Verify` | `ExecutionCompleter` 自动完成 |
| `Rollback` | `ExecutionRecovery` 备份回滚 |
| `IssueCap` / `RevokeCap` | `CapabilityLevel` 系统 |

## 工作流

修改 `GovernanceService.ts`、`executor.ts` 或 `ExecutionRecovery.ts` 时：

1. 先在 `.tla` 文件中更新状态机（如有新增状态、动作、约束）。
2. 跑一遍 TLC，确认不破坏已有安全性质。
3. 再落笔写 TypeScript。

这样每次代码变更都经过形式化验证的"预审"，将逻辑漏洞扼杀在编码之前。

> **数学不通过，不发版；TLC 报红，不改 TypeScript。**
