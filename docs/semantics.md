# Execution Semantics Specification

> 本文档形式化定义 yuangs 的执行状态机、输入分类与状态转移规则。  
> 其目标不是解释"怎么用"，而是回答：  
> **"一条输入在系统中会经历什么，以及不会经历什么。"**

---

## 1. 基本对象定义

### 1.1 Actor

- **User**
  - 唯一的执行主体
  - 唯一的副作用责任承担者

- **AI**
  - 纯推理与建议组件
  - 不具备执行能力

- **Shell Runtime**
  - 状态机宿主
  - 执行用户确认后的 Action

---

### 1.2 Context（上下文）

上下文是一个**显式构建的、只读的数据集合**，来源包括：

- 文件内容（`@path[:line]`）
- 目录结构（`#dir`）
- 管道输入（`stdin`）
- 命令输出（`@!cmd`）

> **除非被显式声明，上下文不存在。**

---

## 2. 输入分类（Input Classification）

每一条输入在解析阶段被严格分类为以下之一：

| 类型 | 示例 | 是否执行 |
|----|----|----|
| Shell Command | `ls -la` | ✅ |
| Context Declaration | `@src/index.ts` | ❌ |
| Directory Context | `#src/` | ❌ |
| AI Dialogue | `ai "explain this"` | ❌ |
| AI Command Proposal | `ai -e "find logs"` | ❌ |
| Atomic Exec | `:exec ./deploy.sh` | ✅ |

---

## 3. 状态机定义

### 3.1 状态集合

```text
Idle
 ├─> ContextBuilding
 ├─> AIReasoning
 ├─> ProposalReady
 ├─> AwaitUserConfirmation
 ├─> Executing
 └─> Completed
```

---

### 3.2 状态转移规则

#### Idle → ContextBuilding

触发条件：
- 输入包含 `@` / `#` / 管道输入

副作用：
- 仅构建 ContextBuffer
- 不执行任何系统命令

---

#### ContextBuilding → AIReasoning

触发条件：
- 输入为自然语言
- 或显式调用 `ai`

副作用：
- AI 读取 ContextBuffer
- 不生成 Action

---

#### AIReasoning → ProposalReady

触发条件：
- 使用 `ai -e`

副作用：
- 生成 **建议命令**
- 命令不可自动执行

---

#### ProposalReady → AwaitUserConfirmation

触发条件：
- 建议命令展示完成

副作用：
- 等待用户输入（Enter / 编辑 / 放弃）

---

#### AwaitUserConfirmation → Executing

触发条件：
- 用户明确确认执行

副作用：
- Shell Runtime 执行命令
- 记录完整执行日志

---

#### Any → Executing（特例）

触发条件：
- 输入为 `:exec`

副作用：
- 绕过 AIReasoning
- 直接执行

---

## 4. 不可达状态（Illegal States）

以下状态在 yuangs 中**被设计为不可达**：

- AI 直接进入 Executing
- Context 在未声明情况下存在
- 执行命令但无用户输入
- 副作用发生但未被记录

---

## 5. 审计保证（Audit Guarantees）

系统必须保证：

- 任一执行动作可追溯到：
  - 用户输入
  - 上下文来源
  - AI 建议（如存在）
- 审计日志不可由 AI 修改

---

## 6. 语义结论

> **yuangs 不是一个"智能代理"，  
> 而是一个受限、可验证、可审计的执行状态机。"
