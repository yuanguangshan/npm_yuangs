# Agent Governance Protocol (Draft 0.1)

> **Status:** Draft
> **Version:** 0.1
> **Last Updated:** 2026-01-19

## 0. 核心定义 (Core Definitions)

- **Agent**: 任何具备推理、计划、生成能力的自动化系统。
- **Runtime**: Agent 运行所依附的受控环境 (Governed Environment)。
- **User**: 拥有最终执行权的主体。
- **Governance Layer**: 介于 Agent 与现实世界之间的强制审计层，负责策略执行与风险控制。

---

## 1. 权力分离原则 (Principle of Separation of Powers)

### 1.1 推理权 (Reasoning Right)

Agent **仅被授予推理权**。其能力通过严格的沙箱与接口暴露，包括但不限于：

- 生成计划 (Plan Generation)
- 推导命令 (Command Derivation)
- 关联上下文 (Context Association)
- 分析执行结果 (Result Analysis)

Agent **不得直接调用任何副作用接口** (filesystem APIs / network stack / process execution)，除非通过受控的 RPC 或 Tool Use 协议。

### 1.2 执行权 (Execution Right)

执行权 **仅存在于 Runtime 与 User 侧**：

- **Runtime**: 负责执行前的安全检查 (Security Checks) 与最小权限执行 (Least Privilege Execution)。
- **User**: 拥有**不可绕过**的最终确认权 (Final Approval)。

任何试图绕过 User Gate 或 Runtime Checks 的行为，均视为 **协议违规 (Protocol Violation)**。

---

## 2. 显式上下文原则 (Principle of Explicit Context Semantics)

### 2.1 不可见即不存在 (Visibility is Existence)

Agent **不得访问任何未被显式声明的资源**。

资源声明必须满足：

- 具备清晰的语义边界 (Semantic Boundaries)，如文件路径、目录结构、环境变量等。
- 可被人类审计 (Human Auditable)。
- 可被策略引擎拦截或拒绝 (Policy Interceptible)。

### 2.2 上下文即特权 (Context is a Capability, not a Default)

上下文 (Context) 不是默认可用的环境背景，而是 **每次交互被动态授予的能力 (Granted Capability)**。

每一次上下文注入 (Context Injection) 都必须：

- **可追踪 (Traceable)**: 记录注入源与注入量。
- **可撤销 (Revocable)**: 用户或策略层可随时移除。
- **可重放 (Replayable)**: 上下文状态必须可被完整复现。

---

## 3. 中介执行原则 (Principle of Mediated Execution)

### 3.1 执行即高风险边界 (Execution is the Risk Boundary)

任何从“文本/Token”跨越到“副作用/Side Effect”的行为，必须经过 **Governance Layer**。

Governance Layer 至少应包含：

- **风险识别 (Risk Identification)**: 识别高危操作（如删除、提权、重定向、覆盖）。
- **成本评估 (Cost Estimation)**: 评估 Token 消耗、时间成本、IO 影响。
- **规则审计 (Rule Auditing)**: 对照 Constitution 或 Policy 进行合规性检查。

### 3.2 执行必须可拒绝 (Execution Must Be Rejectable)

所有来自 Agent 的执行请求，必须被视为 **Proposal (提案)** 而非 Action (指令)。

Runtime 和 User 拥有完整的、即时的拒绝权，且拒绝行为必须被 **记录 (Logged)** 并反馈给 Agent 以修正其计划。

---

## 4. 真实反馈闭环原则 (Principle of Truthful Feedback Loop)

### 4.1 反馈即事实 (Feedback is Ground Truth)

- stdout / stderr / exit code 均视为不可篡改的事实来源。
- 执行失败、错误或异常 **不得被吞没 (Swallowed) 或美化 (Hallucinated away)**。

### 4.2 视觉一致性 (Visual Consistency)

系统展示给用户的内容 (UI/UX)，必须与系统的真实内部状态 (State) 保持严格一致。

禁止：

- **虚假中间态**: 展示未发生的步骤。
- **流式幻觉**: 在 Stream 中输出与实际执行不符的确认信息。

---

## 5. 可审计性原则 (Principle of Auditability)

系统必须保证：

- **决策链路可回放 (Decision Replay)**: 能够完整复现 Agent 做决策所依据的 Context 和 Prompt。
- **执行有日志 (Execution Logs)**: 所有副作用操作留痕。
- **上下文变更可追踪 (Context Traceability)**: 此时此刻 Agent 看到了什么？

> **"一个不可审计的 Agent，等价于一个不可控的 Agent。"**
> *"An un-auditable Agent is equivalent to an uncontrollable Agent."*
