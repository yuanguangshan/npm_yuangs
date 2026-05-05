# 代码变更治理形式化验证指引

本目录包含 `yuangs` 核心治理逻辑的 TLA+ 规约，用于在代码变更前验证安全性。

## 前置条件

1. 安装 [VS Code](https://code.visualstudio.com/)。
2. 安装 VS Code 插件 **TLA+** (`alygin.vscode-tlaplus`)。
3. 确保系统已安装 [TLA+ Toolbox](https://lamport.azurewebsites.net/tla/toolbox.html) 或 TLC 命令行工具。

## 架构概览

治理流程状态机：

```
DRAFT → PROPOSED → APPROVED → EXECUTED → OBSERVED → VERIFIED
                   ↘ REJECTED ←────── (任意非终态阶段)
                   ↗ (可从 REJECTED 重新 Propose)
```

令牌生命周期：

```
IssueCap → caps + {cap}
RevokeCap → caps - {cap}, revokedCaps + {cap}
Execute 要求 cap ∈ (caps \ revokedCaps) 且 CapabilityGrant(cap, "execute")
已撤销令牌不可重新签发（IssueCap 守卫 cap ∉ revokedCaps）
```

## 安全性质

### 类型不变量 `TypeOk`

状态变量始终在有效范围内。核心约束：`caps ∩ revokedCaps = {}`（令牌不能同时有效和已撤销）。

### P1 — `ExecutionRequiresApproval`

执行前必须经过审批。`actionState[a] = "EXECUTED" => approvedBy[a] ≠ None`

### P2 — `CapabilityRequired`

执行时必须持有有效能力令牌。`actionState[a] = "EXECUTED" => ∃c ∈ (caps \ revokedCaps)`

### P3 — `NoExtraChanges`

验证通过意味着实际变更 = 声明变更。`actionState[a] = "VERIFIED" => observations[a] = declaredChanges[a]`

### P4 — `NoExecuteAfterRevocation`

令牌撤销后不得执行。`actionState[a] = "EXECUTED" => ∀c ∈ revokedCaps: CapabilitySubject(c) ≠ a`

### P5 — `NoDoubleExecute`

同一动作不得重复执行。处于执行后状态的动作最多一个。

## 代码映射关系

TLA+ 性质与 TypeScript 代码的对应关系。**前 4 条映射直接，第 3 条（NoExtraChanges）为设计意图级对应。**

| TLA+ 性质 | TypeScript 对应 | 映射强度 | 说明 |
|-----------|----------------|---------|------|
| `TypeOk` | `CapabilityLevel.ts` + `PolicyEngine` 策略约束 | 概念对应 | TLA+ 的状态类型约束在代码中体现为能力等级枚举和策略框架的类型安全保证。注意：TLA+ 的 TypeOk 是状态不变量，PolicyEngine 是安全策略，两者层级不同。 |
| `ExecutionRequiresApproval` | `GovernanceService.adjudicate()` → `evaluateProposal()` + `PreFlightChecker.passGovernance()` | **直接对应** | 审批是显式的、有完整策略引擎支撑。`PreFlightChecker` 执行前调用 `GovernanceService.adjudicate()`，被拒绝则阻止执行。 |
| `CapabilityRequired` | `ToolExecutor.checkToolCapability()` → `canExecuteTool()` | **直接对应** | 工具执行前检查 `CapabilityLevel` 是否满足，不满足直接拒绝。 |
| `NoExtraChanges` | `ExecutionCompleter` + `ExecutionStabilizer` | 设计意图对应 | TLA+ 的 `observations == declaredChanges` 是理想化约束。代码中 `ExecutionCompleter` 做工具类型判断决定自动完成，`ExecutionStabilizer` 检测输出稳定，但不做"声明变更 vs 实际变更"的精确比对。此性质在 TLA+ 中通过 Mock 实现，代码侧尚未完全等价实现。 |
| `NoExecuteAfterRevocation` | `CapabilityLevel` 降级链 + `errorTracker.shouldBlockExecution()` | 概念对应 | 能力降级使工具不可用，错误追踪在连续失败后阻止执行。注意：`errorTracker` 基于错误计数而非令牌撤销，两者机制不同。 |
| `NoDoubleExecute` | `ExecutionHandler.trackDuplicate()` | **直接对应** | 检查 tool+params 重复，连续相同输出则 break，防止循环调用。 |

### 关键发现

规约中的安全性质是从代码逻辑中提炼的安全需求。TLC 的贡献在于在有限模型中穷举所有可能的状态迁移路径，数学地证明这些性质不被违反。

随着逐步扩大模型规模（增加 `Actions`、`CapabilityTokens` 等常量），这种保障会逐渐逼近真实系统的复杂度。

## 运行模型检查

### 方式一：VS Code（推荐）

1. 在 VS Code 中打开 `docs/specs/CodeChangeGovernanceV2.tla`。
2. 按 `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)，输入 **`TLA+: Check model with TLC`**。
3. 等待模型检查完成（约 10-30 秒，取决于状态空间）。
4. 成功时输出包含 `Success`。
5. 失败时侧边栏会提供完整的反例轨迹（counterexample），定位逻辑漏洞。

### 方式二：命令行

```bash
# 安装 tlc 工具（macOS）
brew install tlaplus

# 运行模型检查
java -jar /path/to/tla2tools.jar -workers auto docs/specs/CodeChangeGovernanceV2.tla
```

## 已知修复记录

TLC 在实际运行中发现并修复的缺陷：

| # | 缺陷 | 修复 |
|---|------|------|
| 1 | `RevokeCap` 未从 `caps` 移除已撤销令牌，违反 `caps ∩ revokedCaps = {}` | `caps' = caps \ {cap}` |
| 2 | `IssueCap` 允许重新签发已撤销的令牌，再次违反交集不变量 | 增加守卫 `cap ∉ revokedCaps` |
| 3 | 全部动作 REJECTED 且令牌全部撤销后无可用迁移（死锁） | `Propose` 允许从 REJECTED 重新提议，`.cfg` 添加 `CHECK_DEADLOCK FALSE` |

## 自定义验证范围

通过修改 `.cfg` 文件中的常量集来扩大或缩小穷举范围：

```cfg
CONSTANTS
  Actions = {act1, act2, act3}        # 增加动作数量
  Agents = {user_admin, ai_agent, reviewer}  # 增加代理
  CapabilityTokens = {cap1, cap2, cap3, cap4} # 增加令牌
```

> **注意**：状态空间随常量数量指数增长。建议从小到大逐步验证。

## 与 TypeScript 实现对齐

规约中的动作与以下源码对应：

| TLA+ 动作 | TypeScript 对应 |
|-----------|----------------|
| `Propose` | `PreFlightChecker.check()` |
| `Approve` | `GovernanceService.evaluate()` → `allowed: true` |
| `Execute` | `ToolExecutor.execute()` |
| `Observe` | `ExecutionStabilizer.isOutputStable()` |
| `Verify` | `ExecutionCompleter` 自动完成 |
| `Rollback` | `ExecutionRecovery` 备份回滚 |
| `IssueCap` / `RevokeCap` | `CapabilityLevel` 系统 |

未来修改 `GovernanceService.ts` 或 `ExecutionRecovery.ts` 时，先在此 `.tla` 文件中更新状态机，跑一遍 TLC，确认不破坏已有的安全性质后，再落笔写 TypeScript。
