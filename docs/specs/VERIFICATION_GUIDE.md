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
```

## 安全性质（Invariant）

| 编号 | 性质 | 含义 |
|------|------|------|
| P1 | `ExecutionRequiresApproval` | 执行前必须经过审批 |
| P2 | `CapabilityRequired` | 执行时必须持有有效能力令牌 |
| P3 | `NoExtraChanges` | 验证通过意味着实际变更 = 声明变更 |
| P4 | `NoExecuteAfterRevocation` | 令牌撤销后不得执行 |
| P5 | `NoDoubleExecute` | 同一动作不得重复执行 |

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

规约中的 `Execute`、`Approve`、`Reject` 等动作与以下源码对应：

| TLA+ 动作 | TypeScript 对应 |
|-----------|----------------|
| `Propose` | `PreFlightChecker.check()` |
| `Approve` | `GovernanceService.evaluate()` → `allowed: true` |
| `Execute` | `ToolExecutor.execute()` |
| `Observe` | `ExecutionStabilizer.isOutputStable()` |
| `Verify` | `ExecutionCompleter` 自动完成 |
| `Rollback` | `ExecutionRecovery` 备份回滚 |
| `IssueCap` / `RevokeCap` | CapabilityLevel 系统 |

未来修改 `GovernanceService.ts` 或 `ExecutionRecovery.ts` 时，先在此 `.tla` 文件中更新状态机，跑一遍 TLC，确认不破坏已有的安全性质后，再落笔写 TypeScript。
