# yuangs CLI - 完整接口文档

> **AI-augmented Shell with Governance**

版本: 3.47.0
作者: 苑广山
更新日期: 2026-01-25

---

## 📋 目录

1. [项目架构概述](#项目架构概述)
2. [核心模块详解](#核心模块详解)
3. [全局核心元素](#全局核心元素)
4. [关键数据结构](#关键数据结构)
5. [特殊语法参考](#特殊语法参考)
6. [工作流示例](#工作流示例)

---

## 项目架构概述

### 设计理念

**yuangs** 是一个遵循 Unix 哲学的 AI 增强型命令行工具，核心理念：

- **AI 提供思路，人类掌控执行**
- **无黑盒操作** - 一切皆可解释、可审计
- **语法即力量** - 显式的文件/目录引用
- **始终有人类在环** - 治理和确认机制

### 架构层次

```
┌─────────────────────────────────────────────────────┐
│                  CLI Layer                          │
│  (cli.ts - Commander.js routing)                   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              Command Handlers                        │
│  (handleAIChat, handleAICommand, context/*)       │
└───────┬─────────────────┬────────────────────────┘
        │                 │
┌───────▼────────┐  ┌────▼────────────────────────┐
│  Agent Layer    │  │  Core Layer                │
│                │  │                           │
│ - AgentRuntime │  │ - ExecutionRecord         │
│ - DualAgent    │  │ - Explain/Replay         │
│ - Governance   │  │ - CapabilityInference     │
│ - Skills       │  │ - DB/Config             │
└───────┬────────┘  └────────────────────────────┘
        │
┌───────▼─────────────────────────────────────┐
│          AI Client Layer                     │
│  (ai/client.ts - LLM API calls)           │
└────────────────────────────────────────────┘
```

### 数据流向

1. **用户输入** → 特殊语法解析 → 上下文构建
2. **上下文** → AgentRuntime/DualAgentRuntime → LLM 推理
3. **LLM 响应** → 治理审核 → 执行器执行
4. **执行结果** → 记录保存 → 技能学习

---

## CLI命令完整列表

yuangs CLI 提供了丰富的命令集，涵盖了AI交互、应用管理、宏命令等多个方面。

### 基础命令

#### `yuangs ai [question...]`
**用途**: 向 AI 提问

**选项**:
- `-e, --exec` - 生成并执行 Linux 命令
- `-m, --model <model>` - 指定 AI 模型
- `-p` - 使用 Pro 模型（相当于 -m Assistant）
- `-f` - 使用 Flash 模型（相当于 -m Assistant）
- `-l` - 使用 Lite 模型（相当于 -m Assistant）
- `-w, --with-content` - 在管道模式下读取文件内容
- `--verbose` - 详细输出（显示 Capability 匹配详情）
- `--planner` - 启用双Agent模式（Planner + Executor）
- `--no-planner` - 禁用双Agent模式
- `--show-context-relevance` - 显示上下文相关性评分
- `--context-strategy <strategy>` - 上下文策略: smart/minimal/full

**示例**:
```bash
yuangs ai "git status 是什么意思？"
yuangs ai -e "查找大于 100M 的文件"
yuangs ai --planner "重构所有组件，批量更新"
```

---

### 应用管理命令

#### `yuangs list`
**用途**: 列出所有已配置的应用

**示例**:
```bash
yuangs list
```

**输出**: 显示所有应用的名称和URL

---

#### `yuangs shici`
**用途**: 打开古诗词 PWA

**示例**:
```bash
yuangs shici
```

---

#### `yuangs dict`
**用途**: 打开英语词典

**示例**:
```bash
yuangs dict
```

---

#### `yuangs pong`
**用途**: 打开 Pong 游戏

**示例**:
```bash
yuangs pong
```

---

### 宏命令

#### `yuangs macros`
**用途**: 查看所有已保存的快捷指令（宏）

**示例**:
```bash
yuangs macros
```

---

#### `yuangs save <name>`
**用途**: 保存当前命令为快捷指令（宏）

**选项**:
- `-l, --from-last` - 保存最后执行的 AI 命令
- `-g, --global` - 添加 alias 到 ~/.zshrc

**示例**:
```bash
yuangs save build "npm run build && npm test"
yuangs save deploy -l
yuangs save deploy -g
```

---

#### `yuangs run <name>`
**用途**: 执行已保存的快捷指令（宏）

**示例**:
```bash
yuangs run build
yuangs run deploy
```

---

### 历史命令

#### `yuangs history`
**用途**: 查看及执行命令历史

**选项**:
- `-l, --last` - 执行上一条命令

**示例**:
```bash
yuangs history
yuangs history -l
```

**交互**: 会显示命令列表并询问用户选择要执行的命令。

---

### 配置与补全命令

#### `yuangs completion [shell]`
**用途**: 生成并安装 Shell 补全脚本

**参数**:
- `shell` - shell 类型: bash 或 zsh（默认自动检测）

**示例**:
```bash
yuangs completion
yuangs completion bash
yuangs completion zsh
```

---

#### `yuangs config`
**用途**: 管理本地配置 (~/.yuangs.json)

**子命令**:
- `get <key>` - 获取配置项
- `set <key> <value>` - 设置配置项
- `list` - 列出所有配置

**示例**:
```bash
yuangs config list
yuangs config set defaultModel Assistant
yuangs config get defaultModel
```

---

### 高级命令

#### `yuangs capabilities`
**用途**: 能力管理命令

**子命令**:
- `list` - 列出所有能力
- `match <input>` - 测试输入的能力匹配

---

#### `yuangs registry`
**用途**: Macro Registry 管理

**子命令**:
- `list` - 列出所有注册的宏
- `add <name> <commands>` - 添加宏到注册表
- `remove <name>` - 从注册表移除宏

---

#### `yuangs explain [id | last]`
**用途**: 解释系统为什么做出某个决策

**示例**:
```bash
yuangs explain last
yuangs explain exec_1768820380225_rgts34981
```

**输出**: 显示决策过程、选择的模型、使用的技能等信息。

---

#### `yuangs replay <id> [options]`
**用途**: 使用控制标志重放执行

**选项**:
- `-s, --strict` - 严格重放（使用精确模型）
- `-c, --compatible` - 兼容重放（允许 fallback）
- `-r, --re-evaluate` - 使用当前配置重新评估
- `-v, --verbose` - 详细输出
- `--dry` - Dry run（不实际执行）
- `--explain` - 在重放前显示解释
- `--diff` - 显示原始配置与当前配置的差异

**示例**:
```bash
yuangs replay exec_1768820380225_rgts34981 --dry --explain
yuangs replay exec_1768820380225_rgts34981 --diff
```

---

#### `yuangs skills <subcommand>`
**用途**: 管理技能库

**子命令**:
- `list` - 列出所有技能及其分数
- `explain <skill-name>` - 解释特定技能
- `disable <skill-name>` - 禁用技能
- `enable <skill-name>` - 启用技能

**示例**:
```bash
yuangs skills list
yuangs skills disable risky-operation
yuangs skills enable safe-operation
```

---

#### `yuangs preferences`
**用途**: 偏好设置管理

**子命令**:
- `get <key>` - 获取偏好设置
- `set <key> <value>` - 设置偏好设置
- `list` - 列出所有偏好设置

---

#### `yuangs help`
**用途**: 显示帮助信息

**示例**:
```bash
yuangs help
yuangs -h
yuangs --help
```

---

## 核心模块详解

### src/agent/

#### AgentRuntime.ts

**职责**: 单 Agent 执行引擎，核心的 AI 对话和命令执行引擎

**关键方法**:

```typescript
class AgentRuntime {
  constructor(initialContext: any)
  // 初始化上下文管理器，生成执行ID

  async run(
    userInput: string,
    mode: "chat" | "command" = "chat",
    onChunk?: (chunk: string) => void,
    model?: string,
    renderer?: StreamMarkdownRenderer
  )
  // 主执行循环，最多10轮
  // - 构建动态上下文
  // - 调用 LLM 推理
  // - 执行动作
  // - 技能学习
}
```

**执行流程**:

1. **上下文增强** - 使用 SmartContextManager 获取相关性排序的上下文
2. **LLM 调用** - 通过 LLMAdapter.think() 获取响应
3. **因果锁定 (Causal Lock)** - 验证 LLM 对观察结果的 ACK
4. **预检** - 使用 evaluateProposal() 进行策略审核
5. **正式治理** - 通过 GovernanceService.adjudicate() 决策
6. **执行** - 通过 ToolExecutor.execute() 执行
7. **技能学习** - 记录成功执行，更新技能库

**全局作用**: AgentRuntime 是所有 AI 交互的核心执行器，被 handleAIChat 和 DualAgentRuntime 使用

---

### 执行循环详解

#### 轮次管理

**最大轮次**: 10 轮

**代码位置**: `src/agent/AgentRuntime.ts` line 41

```typescript
const maxTurns = 10;
let turnCount = 0;

while (turnCount < maxTurns) {
  const currentTurn = ++turnCount;
  if (currentTurn > 1) {
    console.log(chalk.blue(`\n--- Turn ${currentTurn} ---`));
  }
  // ... 执行逻辑
}
```

**轮次作用**：
- 防止无限循环
- 每轮之间有清晰的分隔
- 超过最大轮次时给出警告

---

#### 错误恢复机制

**状态变量**: `lastError`

**代码位置**: `src/agent/AgentRuntime.ts` lines 42, 271, 316

```typescript
let lastError: string | undefined;

// 初始状态
const initialDynamicContext = await buildDynamicContext();

// 每轮循环开始时
const dynamicContext = await buildDynamicContext(lastError);
```

**错误处理流程**：

1. **执行失败时记录错误**
```typescript
if (!result.success) {
  // 失败时记录错误
  lastError = result.error;
  this.context.addToolResult(action.type, `Error: ${result.error}`);
  console.log(chalk.red(`[ERROR] ${result.error}`));
} else {
  // 成功时清除错误状态
  lastError = undefined;
  this.context.addToolResult(action.type, result.output);
  console.log(chalk.green(`[SUCCESS] Result:\n${preview}`));
}
```

2. **下一轮注入错误恢复指导**
```typescript
const dynamicContext = await buildDynamicContext(lastError);
```

**动态上下文构建**（基于错误状态）：

**无错误时**：
```typescript
const dynamicContext = {
  systemPrompt: "Continue with the current task.",
  additionalContext: null
};
```

**有错误时**：
```typescript
const dynamicContext = {
  systemPrompt: `The previous action failed. Error: ${lastError}. Please try a different approach.`,
  additionalContext: {
    failureReason: lastError,
    suggestedAlternatives: [
      "Check if the command syntax is correct",
      "Verify file paths exist",
      "Try alternative commands"
    ]
  }
};
```

3. **错误恢复场景示例**

**场景 1: 文件不存在**
```
Turn 1: @src/missing.ts 分析文件
[ERROR] Error: ENOENT: no such file or directory 'src/missing.ts'

Turn 2:
动态上下文: "The file 'src/missing.ts' does not exist. Try verifying the file path first."
→ AI: 让我检查文件名是否正确...
```

**场景 2: 权限不足**
```
Turn 1: 执行 rm -rf /root
[ERROR] Permission denied

Turn 2:
动态上下文: "Previous operation failed with permission denied. Try with sudo or check file ownership."
→ AI: 使用 sudo rm -rf ...
```

**场景 3: 命令语法错误**
```
Turn 1: 执行 grep -patter "file
[ERROR] grep: unrecognized option '-patter'

Turn 2:
动态上下文: "Previous command had invalid syntax. The correct option is '-pattern'."
→ AI: 使用正确的 grep -pattern "file" 语法...
```

---

#### 预检机制 (Pre-flight Check)

**目的**: 在正式治理前进行策略层面的快速审核

**代码位置**: `src/agent/AgentRuntime.ts` lines 219-233

```typescript
const preCheck = evaluateProposal(
  action,
  GovernanceService.getRules(),
  GovernanceService.getLedgerSnapshot()
);

if (preCheck.effect === "deny") {
  console.log(
    chalk.red(`[PRE-FLIGHT] 🛡️ Policy Blocked: ${preCheck.reason}`),
  );
  this.context.addMessage(
    "system",
    `POLICY DENIED: ${preCheck.reason}. Find a different way.`,
  );
  continue; // 跳过本轮，进入下一轮
}
```

**预检规则示例**：

**规则 1: 阻止危险命令**
```yaml
rules:
  - id: no-rm-rf-root
    effect: deny
    reason: Destructive rm -rf command on root directory
    actions: [shell_cmd]
    riskLevels: [high]
```

**结果**：
```
[PRE-FLIGHT] 🛡️ Policy Blocked: Destructive rm -rf command on root directory

Turn 2:
→ AI: 我不能执行这个操作。让我检查其他方式...
```

**规则 2: 限制网络请求**
```yaml
rules:
  - id: no-unauthorized-network
    effect: deny
    reason: Network requests require explicit authorization
    actions: [network_call]
```

---

#### 正式治理流程

**三层审核机制**：

**第1层：WASM 物理层核验**
```typescript
// 在 GovernanceService.adjudicate() 中首先执行
const wasmResult = WasmGovernanceBridge.evaluate(action);
if (wasmResult.effect === 'deny') {
  return { status: 'rejected', reason: wasmResult.reason };
}
```

**第2层：逻辑层核验**
```typescript
// 通过 evaluateProposal() 进行逻辑检查
const logicalCheck = evaluateProposal(
  action,
  GovernanceService.getRules(),
  GovernanceService.getLedgerSnapshot()
);

if (logicalCheck.effect === 'deny') {
  return { status: 'rejected', reason: logicalCheck.reason };
}
```

**第3层：人工确认**
```typescript
// 低风险操作直接允许
if (action.riskLevel === 'low') {
  return { status: 'approved', reason: 'Auto-approved for low-risk operation' };
}

// 高风险操作需要用户确认
if (action.riskLevel === 'high') {
  console.log(chalk.yellow(`\n⚠️  High Risk Operation Detected`));
  console.log(chalk.white(`Action Type: ${action.type}`));
  console.log(chalk.white(`Payload: ${JSON.stringify(action.payload, null, 2)}`));
  
  // 显示风险披露
  displayRiskDisclosure(action);
  
  // 询问用户
  const confirmed = await confirmAction(action);
  if (!confirmed) {
    return { status: 'rejected', reason: 'User denied' };
  }
  return { status: 'approved', reason: 'User confirmed' };
}
```

**风险披露格式**：
```
⚠️  Risk Assessment

Command: rm -rf /some/path
Type: shell_cmd
Risk Level: HIGH

Potential Impact:
  📁 File System: Will permanently delete all files in directory
  📊 Data Loss: All data will be lost
  🔧 Recovery: Cannot undo (unless using version control)

Policy Match: Rule "no-destructive-rm" applies
```

---

#### 技能学习触发

**学习时机**：
1. **聊天模式成功** - 当 AI 提供文本答案时
2. **工具执行成功** - 当 shell 命令或工具调用成功时
3. **失败时不学习** - 避免从错误中学习

**代码位置**: `src/agent/AgentRuntime.ts` lines 156-189, 279-313

```typescript
// 聊天模式成功（lines 156-189）
if (thought.isDone || action.type === "answer") {
  const result = await ToolExecutor.execute(action as any);
  // Learn from successful chat
  try {
    const record = createExecutionRecord(
      'agent-chat',
      { required: [], preferred: [] } as any,
      configSnapshot,
      decision,
      { success: true },
      undefined,
      userInput,
      'chat'
    );

    (record as any).llmResult = { plan: thought.parsedPlan };
    (record as any).input = { rawInput: userInput };

    const savedRecordId = saveExecutionRecord(record);
    const savedRecord = loadExecutionRecord(savedRecordId);

    if (savedRecord) {
      learnSkillFromRecord(savedRecord, true);
    }
  } catch (error) {
    console.warn(chalk.yellow(`[Skill Learning] Failed: ${error}`));
  }
}

// 工具执行成功（lines 279-313）
if (result.success) {
  // 成功时清除错误状态
  lastError = undefined;
  this.context.addToolResult(action.type, result.output);
  const preview = result.output.length > 300
    ? result.output.substring(0, 300) + '...'
    : result.output;
  console.log(chalk.green(`[SUCCESS] Result:\n${preview}`));

  // Learn from this successful execution
  try {
    const record = createExecutionRecord(...);
    const savedRecordId = saveExecutionRecord(record);
    const savedRecord = loadExecutionRecord(savedRecordId);

    if (savedRecord) {
      learnSkillFromRecord(savedRecord, true);
    }
  } catch (error) {
    console.warn(chalk.yellow(`[Skill Learning] Failed: ${error}`));
  }
}
```

---

#### 知识图谱因果边记录

**目的**: 建立明确的因果关系，支持追溯和审计

**代码位置**: `src/agent/AgentRuntime.ts` lines 246-263

```typescript
// 记录因果边到 KG
if (lastObs && lastObs.metadata?.obsId && ackText && ackText !== 'NONE') {
  try {
    const { recordEdge } = await import('../engine/agent/knowledgeGraph');
    recordEdge({
      from: lastObs.metadata.obsId,      // 观察结果节点
      to: action.id,                   // 操作节点
      type: 'ACKNOWLEDGED_BY',        // 关系类型
      metadata: {
        verified: true,
        timestamp: Date.now()
      }
    });
    console.log(chalk.gray(`[KG] ⚓ Causal edge recorded`));
  } catch (error: any) {
    console.warn(chalk.yellow(`[KG] Warning: Failed to record causal edge: ${error.message}`));
  }
}
```

**因果边示例**：

```
[KG] ⚓ Causal edge recorded

边信息:
  From: obs_abc123 (文件读取结果: "File content: ...")
  To: act_def456 (文件分析操作)
  Type: ACKNOWLEDGED_BY
  Verified: true
  Timestamp: 2026-01-25 10:30:15

因果关系链:
  obs_abc123 → act_def456 → tool_result_ghi789
  (文件读取) → (文件分析) → (分析结果输出)
```

**知识图谱的作用**：
- **追溯审计** - 可以完整追踪从观察到执行的因果关系链
- **错误诊断** - 当某个步骤失败时，可以回溯到观察结果
- **学习优化** - 基于成功的因果链学习模式
- **因果关系可视化** - 支持因果图的可视化工具

---

#### 执行记录的保存

**记录信息**：
```typescript
const record = createExecutionRecord(
  'agent-chat',              // 命令名称
  { required: [], preferred: [] },
  configSnapshot,           // 配置快照
  decision,                 // 模型决策
  { success: true },        // 执行结果
  undefined,                // 命令（如果有）
  userInput,                // 原始用户输入
  'chat'                    // 模式
);

// 附加学习相关信息
(record as any).llmResult = { plan: thought.parsedPlan };
(record as any).input = { rawInput: userInput };

const savedRecordId = saveExecutionRecord(record);
```

**记录存储位置**: `~/.yuangs_execution_records/`

**记录 ID 格式**: `exec_timestamp_randomid`
- 示例：`exec_17378084291_abc123def456`

---

#### 完整的执行流程示例

**场景**: 用户要求重构组件并测试

```
Turn 1:
输入: "重构 ComponentA 组件"

上下文增强:
  - SmartContextManager 选择相关文件（ComponentA.ts）
  - 相关性评分: 0.87
  - Token 使用: 1,200

LLM 调用:
  - 模型: gemini-2.5-flash-lite
  - 响应: 分析代码并提出修改方案

因果锁定:
  - ACK: "ComponentA.ts 已读取，包含 150 行代码"
  - 验证: ✅ 匹配
  - [CAUSAL LOCK] ✅ ACK verified

预检:
  - 风险级别: medium
  - 策略检查: ✅ 通过
  - [PRE-FLIGHT] ✅ Policy check passed

治理审核:
  - WASM 核验: ✅ 通过
  - 逻辑核验: ✅ 通过
  - 风险等级: medium
  - 用户确认: ✅ 用户批准

执行:
  - 操作: code_diff
  - 工具: 代码编辑器
  - [EXECUTING] ⚙️ code_diff...
  - 状态: ✅ SUCCESS

技能学习:
  - 从执行记录学习技能
  - 技能名称: refactor-component
  - confidence: 0.65
  - 成功率: 85%

知识图谱:
  - 记录因果边: obs_xxx → act_yyy (ACKNOWLEDGED_BY)
  - [KG] ⚓ Causal edge recorded

Turn 1 完成

Turn 2:
输入: "运行测试验证"

动态上下文:
  - 上一步成功，无错误
  - 注入提示: "Continue with testing the refactored component."

LLM 调用:
  - 响应: 执行 npm test

...

（继续执行后续轮次，直到完成或达到 10 轮上限）
```

---

#### 循环退出条件

**正常退出**：
```typescript
// AI 标记完成
if (thought.isDone || action.type === "answer") {
  // 学习技能
  learnSkillFromRecord(savedRecord, true);
  break; // 退出循环
}
```

**异常退出**：
```typescript
// 达到最大轮次
if (turnCount >= maxTurns) {
  console.log(chalk.red(`\n⚠️ Max turns (${maxTurns}) reached.`));
}
```

**执行完成后的清理**：
- 保存执行记录
- 更新技能库
- 同步对话历史
- 记录知识图谱边（如果适用）

---

### 智能上下文管理器 (SmartContextManager)

#### 概述

**SmartContextManager** 是上下文管理的核心引擎，负责：
- 动态评估上下文相关性
- 智能摘要生成
- Token 预算控制
- 上下文排序和优先级管理

**与 ContextManager 的区别**：
- ContextManager：基础的对话和观察结果跟踪
- SmartContextManager：增强型上下文管理，加入智能决策和优化

---

#### 相关性评分机制

**评分范围**: 0.0 - 1.0（越高越相关）

**评分依据**：

1. **语义匹配** (35% 权重)
   - 关键词匹配
   - 主题相似度
   - 概念关联

2. **时间新鲜度** (30% 权重)
   - 最近添加的上下文得分更高
   - 衰减周期：24小时
   - 公式：`freshness = exp(-hoursSinceLastUse / 24)`

3. **使用频率** (20% 权重)
   - 经常使用的上下文得分更高
   - 滑动窗口：最近 10 次

4. **显式引用** (15% 权重)
   - 用户通过 `@` 或 `#` 显式添加的上下文
   - 得到额外加分

**综合得分计算**：
```typescript
relevanceScore = 
  0.35 * semanticMatch +
  0.30 * freshness +
  0.20 * frequency +
  0.15 * explicitReference
```

---

#### 智能摘要功能

**目的**: 在保持关键信息的同时减少 Token 消耗

**摘要策略**：

1. **长文件摘要**
   - 文件 > 5000 tokens
   - 生成结构化摘要（包含：类、函数、主要逻辑）
   - 保留完整的文件路径供引用

2. **代码文件摘要**
   - 提取函数签名
   - 提取类定义
   - 提取关键常量和变量
   - 格式化为可读的结构

3. **目录摘要**
   - 列出所有文件路径
   - 显示文件大小和类型
   - 标记重要文件（index.ts, main.ts 等）

**摘要格式**：
```markdown
@src/utils/
  📦 [摘要] 工具函数集合，包含文件操作、语法解析等
  📄 [Token预算] 3500 tokens
  📁 [详情] 包含 12 个文件：fileReader.ts, globDetector.ts, syntaxHandler.ts...

（完整内容在需要时加载）
```

---

#### 动态上下文构建过程

**步骤 1: 分析用户查询**
```typescript
const analysis = analyzeQuery(userInput);
// 提取关键词
// 识别主题
// 检测意图类型（代码分析、调试、文档查询等）
```

**步骤 2: 评估所有上下文项**
```typescript
const scoredItems = contextStore.list().map(item => ({
  ...item,
  relevance: calculateRelevance(item, analysis)
}));
```

**步骤 3: 应用 Token 预算约束**
```typescript
interface EnhancedContextOptions {
  query: string;           // 用户查询
  minRelevance: number;     // 最小相关性阈值（默认 0.3）
  maxTokens: number;        // 最大 Token 预算（默认 8000）
  enableSmartSummary: boolean;  // 是否启用智能摘要
}
```

**步骤 4: 构建排序后的上下文**
```typescript
const sortedItems = scoredItems
  .filter(item => item.relevance >= options.minRelevance)
  .sort((a, b) => b.relevance - a.relevance);
  
// 选择高相关性项目，直到达到 Token 限制
const selectedItems = selectUnderTokenBudget(sortedItems, options.maxTokens);
```

**步骤 5: 生成增强的 Prompt**
```typescript
const context = {
  summary: generateSmartSummary(selectedItems),
  rankedItems: selectedItems,
  totalTokens: calculateTotalTokens(selectedItems),
  droppedItems: filteredOutItems
};

return context;
```

---

#### Token 预算控制

**配置来源**：
- 用户配置：`~/.yuangs.json`
  ```json
  {
    "contextWindow": 8000,
    "maxFileTokens": 20000,
    "maxTotalTokens": 200000
  }
  ```
- 运行时参数：可覆盖默认值

**预算分配策略**：

1. **优先级策略**（默认）
   - 优先选择高相关性上下文
   - Token 不足时丢弃低相关性项目
   - 确保核心信息始终包含

2. **平衡策略**
   - 平衡不同类型的内容（文件、目录、Git 上下文）
   - 每种类型至少保留一个高优先级项

3. **智能缩减**
   - 使用摘要代替完整内容（长文件）
   - 优先保留关键文件
   - 动态调整摘要详细度

**Token 计算方法**：
```typescript
// 粗略估算：1 token ≈ 4 字符（英文）或 2 字符（中文）
function estimateTokens(content: string): number {
  const charCount = content.length;
  const hasChinese = /[\u4e00-\u9fa5]/.test(content);
  return hasChinese ? Math.ceil(charCount / 2) : Math.ceil(charCount / 4);
}
```

---

#### 排序后的上下文结构

**返回的 EnhancedContext 结构**：
```typescript
interface EnhancedContext {
  summary?: string;              // 智能摘要（可选）
  rankedItems: ContextItem[];    // 按相关性排序的上下文项
  totalTokens: number;           // 总 Token 使用量
  droppedItems: ContextItem[];   // 因 Token 限制被丢弃的项目
}

interface ContextItem {
  id: string;
  path: string;
  content: string | string;  // 完整内容或摘要
  tokens: number;
  relevance: number;             // 相关性评分 0-1
  matchReasons: string[];       // 匹配原因（用于调试）
}
```

---

#### 上下文相关性显示

当使用 `--show-context-relevance` 选项时，会显示详细的相关性分析：

```
📊 Context Relevance Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context Summary:
📦 智能摘要：本次查询相关的核心上下文
- 包含 8 个文件上下文，总计 6,250 tokens
- 使用智能摘要，包含 3 个完整文件、5 个摘要

📋 Ranked Files (Top 10)

  1. src/index.ts ████████████████ 92% (3,500 tokens)
     关键词: index, entry, main
     主题: 项目入口
     匹配原因: 关键词完全匹配 + 显式引用

  2. src/commands/handleAIChat.ts ████████████ 85% (1,200 tokens)
     关键词: handle, chat, AI
     主题: AI 交互处理
     匹配原因: 主题相关 + 最近使用

  3. src/agent/AgentRuntime.ts ████████ 75% (950 tokens)
     关键词: agent, runtime, execution
     主题: 核心执行引擎
     匹配原因: 关键词匹配 + 相关领域

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

#### 配置选项

通过 API 或命令行参数可以调整 SmartContextManager 行为：

| 配置项 | 默认值 | 说明 |
|---------|---------|------|
| `minRelevance` | 0.3 | 最小相关性阈值，低于此值不包含在上下文中 |
| `maxTokens` | 8000 | 上下文最大 Token 数量 |
| `enableSmartSummary` | true | 是否启用智能摘要 |
| `summaryLength` | 500 | 摘要的最大长度（tokens） |

---

#### 全局作用

SmartContextManager 为整个系统提供：
- **智能的上下文选择** - 优先相关内容，减少噪声
- **高效的 Token 利用** - 在预算内提供最多有用信息
- **透明的上下文决策** - 用户可以看到为什么选择某些内容
- **灵活的配置** - 支持不同场景的调整

**使用的模块**：
- AgentRuntime：主执行引擎中集成
- handleAIChat：交互式命令中使用
- `--show-context-relevance`：调试和可视化选项

---

### 因果锁定 (Causal Lock) 机制详解

#### 概念与重要性

**Causal Lock（因果锁定）** 是 AgentRuntime 中的关键安全机制，用于防止 AI 产生幻觉或做出与现实不符的决策。

**核心原理**：
- AI 必须明确承认它观察到的现实（Observation）
- 每个操作必须基于之前真实的观察结果
- 如果 AI 的理解与现实不匹配，必须拒绝执行并重新推理

**为什么重要**：
1. **防止幻觉** - 确保 AI 基于真实观察做决策，而非想象
2. **确保因果链** - 每个操作都是对前一个观察结果的响应
3. **可追溯性** - 建立明确的因果关系，方便调试和审计
4. **防止错误传播** - 及时发现并纠正理解错误，避免错误累积

---

#### ACK 验证流程

**代码位置**: `src/agent/AgentRuntime.ts` lines 194-216

**验证步骤**：

1. **获取最后一个可确认观察**
```typescript
const lastObs = this.context.getLastAckableObservation();
```

2. **获取 AI 的 ACK 响应**
```typescript
const ackText = thought.parsedPlan?.acknowledged_observation;
```

3. **比较内容是否匹配**
```typescript
if (lastObs && ackText && ackText !== 'NONE') {
  const actualContent = lastObs.content.trim();
  const ackedContent = ackText.trim();

  if (actualContent !== ackedContent) {
    // ACK 不匹配 - 因果链断裂
    console.log(chalk.red(`[CAUSAL BREAK] ❌ ACK mismatch!`));
    console.log(chalk.red(`  Expected: ${actualContent.substring(0, 100)}...`));
    console.log(chalk.red(`  Received: ${ackedContent.substring(0, 100)}...`));
    
    // 添加系统消息，要求 AI 重新观察现实
    this.context.addMessage(
      "system",
      `CAUSAL BREAK: ACK does not match physical Observation. Cannot proceed without acknowledging reality.`,
    );
    continue; // 跳过本轮，进入下一轮重新推理
  }

  // ACK 匹配 - 因果链完整
  console.log(chalk.green(`[CAUSAL LOCK] ✅ ACK verified`));
}
```

---

#### 观察结果类型

ContextManager 支持多种观察结果类型：

1. **tool_result** - 工具执行结果
2. **system_note** - 系统生成的说明
3. **manual_input** - 用户手动输入

**可确认的观察**：
- 必须是工具执行的直接结果
- 必须包含可验证的输出或状态
- 不能是纯文本对话消息

---

#### 匹配与不匹配的处理

##### ✅ 匹配 (ACK Verified)

**行为**：
- 继续执行下一阶段
- 记录因果边到知识图谱（Knowledge Graph）
- 显示 `[CAUSAL LOCK] ✅ ACK verified` 提示

**示例**：
```
[CAUSAL LOCK] ✅ ACK verified
[KG] ⚓ Causal edge recorded
[EXECUTING] ⚙️ tool_call...
```

---

##### ❌ 不匹配 (CAUSAL BREAK)

**行为**：
- 拒绝当前操作
- 添加系统消息到上下文
- 跳过本轮执行，进入下一轮
- 要求 AI 重新观察现实

**示例**：
```
[CAUSAL BREAK] ❌ ACK mismatch!
  Expected: [actual observation content...]
  Received: [AI's ACK...]

系统消息: CAUSAL BREAK: ACK does not match physical Observation. Cannot proceed without acknowledging reality.

--- Turn 2 ---
（AI 重新推理并正确观察）
```

---

#### 与知识图谱的集成

当 ACK 验证成功时，系统会记录因果边：

```typescript
// AgentRuntime.ts lines 246-263
if (lastObs && lastObs.metadata?.obsId && ackText && ackText !== 'NONE') {
  try {
    const { recordEdge } = await import('../engine/agent/knowledgeGraph');
    recordEdge({
      from: lastObs.metadata.obsId,      // 观察结果节点
      to: action.id,                   // 操作节点
      type: 'ACKNOWLEDGED_BY',        // 关系类型
      metadata: {
        verified: true,
        timestamp: Date.now()
      }
    });
    console.log(chalk.gray(`[KG] ⚓ Causal edge recorded`));
  } catch (error: any) {
    console.warn(chalk.yellow(`[KG] Warning: Failed to record causal edge: ${error.message}`));
  }
}
```

**作用**：
- 建立明确的因果关系
- 支持因果链追溯
- 为未来的审计和调试提供数据基础

---

#### 设计原则

Causal Lock 遵循以下原则：

1. **显式性** - AI 必须明确 ACK 观察内容
2. **严格性** - 完全匹配才允许继续，不模糊匹配
3. **可观察性** - 所有验证过程都通过日志输出
4. **可恢复性** - 因果断裂后可以进入下一轮重新推理
5. **可审计性** - 因果边记录到知识图谱，支持事后审查

---

#### 实际应用场景

**场景 1：文件读取后分析**
```
用户: "@src/index.ts 解释这段代码"

Agent: 读取文件内容 → 添加观察结果 "File src/index.ts content: ..."
用户: "这个文件的导出是什么？"

AI (正确): ACK: "The file exports: Index class and several functions"
→ [CAUSAL LOCK] ✅ ACK verified
→ 继续分析导出结构
```

**场景 2：命令执行后的验证**
```
用户: "查看当前目录"

Agent: 执行 `ls -la` → 添加观察结果 "Directory listing: ..."
用户: "有几个文件？"

AI (错误): ACK: "There are 5 files" (实际是 8 个文件)
→ [CAUSAL BREAK] ❌ ACK mismatch
→ 系统消息: "CAUSAL BREAK: ACK does not match physical Observation"
→ 进入下一轮重新观察

AI (修正): ACK: "There are 8 files"
→ [CAUSAL LOCK] ✅ ACK verified
→ 继续回答问题
```

---

#### 总结

Causal Lock 是 yuangs 治理体系的核心安全机制之一：

✅ **确保 AI 基于现实做决策** - 防止幻觉
✅ **建立明确的因果关系** - 支持追溯和审计  
✅ **实时发现并纠正错误** - 避免错误累积
✅ **与知识图谱集成** - 建立可查询的因果网络
✅ **透明的验证过程** - 所有步骤都有日志输出

**与其他治理机制的关系**：
- Causal Lock 在执行**之前**验证 AI 对现实的理解
- GovernanceService 在执行**之前**审核操作的安全性
- 两者配合形成双重保障：确保理解正确 + 确保操作安全

---

#### DualAgentRuntime.ts

**职责**: Planner + Executor 双 Agent 系统，用于复杂任务的规划执行

**激活条件**:
- 用户输入包含规划关键词（重构、批量、多步骤等）
- 复杂度评分 > 0.7
- 用户未禁用 planner

**关键方法**:

```typescript
class DualAgentRuntime {
  async run(
    userInput: string,
    onChunk?: (chunk: string) => void,
    model?: string
  )
  // 主入口，自动判断使用快路径或规划路径

  private async shouldUsePlanner(userInput: string): Promise<boolean>
  // 判断是否需要使用规划器
  // - 检查长度（<50字符直接快路径）
  // - 检查关键词（重构、优化、批量等）
  // - 评估复杂度

  private async assessComplexity(input: string): Promise<number>
  // 复杂度评估（0-1）
  // 简单操作（列出、查看、查找）= 0.3
  // 复杂操作 = 0.8

  private async runFastPath(...)
  // 快路径：直接调用 AgentRuntime

  private async runPlannedPath(...)
  // 规划路径：
  // 1. 调用 Planner 生成任务计划
  // 2. 展示计划并确认
  // 3. 逐个执行步骤
  // 4. 失败时询问是否继续

  private async callPlanner(input: string, model?: string): Promise<TaskPlan>
  // 调用规划器生成 JSON 格式的任务计划
}
```

**输出格式 (TaskPlan)**:

```json
{
  "plan": "简要说明",
  "steps": [
    {
      "id": "step_1",
      "description": "步骤描述",
      "type": "shell_cmd | tool_call | analysis | code_diff",
      "command": "命令（如 type=shell_cmd）",
      "tool_name": "工具名（如 type=tool_call）",
      "parameters": {},
      "risk_level": "low | medium | high",
      "dependencies": []
    }
  ],
  "estimated_time": "2 minutes"
}
```

**全局作用**: 为复杂任务提供结构化执行路径，提升任务完成率和成功率

---

#### governance.ts

**职责**: 治理服务，三层审核机制确保执行安全

**三层审核**:

1. **WASM 物理层核验** - WasmGovernanceBridge.evaluate()
2. **逻辑层核验** - evaluateProposal()
3. **人工干预兜底** - 用户确认（高风险操作）

**关键方法**:

```typescript
class GovernanceService {
  static async init()
  // 初始化治理系统
  // - 加载 policy.yaml 规则
  // - 初始化 WASM 桥接

  static async adjudicate(action: ProposedAction): Promise<GovernanceDecision>
  // 核心决策流程：
  // 1. WASM 核验 → 如果 deny，拒绝
  // 2. 逻辑核验 → 如果 deny，拒绝
  // 3. 如果 allow，记录到账本
  // 4. 否则进入人工确认
  //    - 生成风险披露
  //    - 显示命令/工具详情
  //    - 询问用户确认

  static getPolicyManual(): string
  // 返回规则手册（用于 Prompt）

  static getLedgerSnapshot(): RiskEntry[]
  // 获取风险账本快照
}
```

**风险披露**:

- 命令类型识别
- 破坏性检测
- 文件系统影响
- 网络请求检测
- 系统调用分析

**全局作用**: GovernanceService 是整个系统的安全网，确保所有执行都经过审核

---

#### contextManager.ts

**职责**: 对话和上下文管理器，跟踪消息和观察结果

**关键方法**:

```typescript
class ContextManager {
  addMessage(role: string, content: string): void
  // 添加消息到历史（最多50条）

  addToolResult(toolName: string, result: string): void
  // 添加工具执行结果

  addObservation(
    observation: string,
    kind: 'tool_result' | 'system_note' | 'manual_input' = 'system_note',
    originatingActionId?: string
  ): string
  // 添加观察结果，返回 obsId
  // 用于因果锁定（Causal Lock）

  getLastAckableObservation(): { content: string; metadata?: MessageMetadata } | null
  // 获取最后一个可确认的观察结果
  // 用于因果锁定验证

  getMessages(): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>
  // 获取所有消息

  getHash(): string
  // 计算上下文的 SHA256 哈希
  // 用于快照和重放

  getSnapshot()
  // 获取上下文快照
}
```

**全局作用**: ContextManager 维护 Agent 的对话状态，支持因果锁定和重放

---

#### skills.ts

**职责**: 技能学习和管理系统，自动学习并优化 AI 执行模式

**技能评分算法** (0-1):

```typescript
computeSkillScore(skill: Skill, now: number): number {
  const totalUses = skill.successCount + skill.failureCount;
  const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;

  // 时间衰减（新鲜度）：半衰期 14 天
  const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);
  const freshness = Math.exp(-idleDays / 14);

  // 综合得分：45% 成功率 + 35% 新鲜度 + 20% 置信度
  return (0.45 * successRate) + (0.35 * freshness) + (0.20 * skill.confidence);
}
```

**关键方法**:

```typescript
export function updateSkillStatus(skillId: string, success: boolean)
// 更新技能状态（执行后调用）
// 成功：successCount++，confidence += 0.05
// 失败：failureCount++，confidence -= 0.1

export function learnSkillFromRecord(record: any, success: boolean = true)
// 从执行记录自动学习新技能
// 只学习 agent/chat 模式的成功记录
// 提取 goal/command 作为技能名称

export function getRelevantSkills(input: string, limit: number = 3): Skill[]
// 获取相关技能：
// - 过滤评分 < 0.3 的技能
// - 过滤禁用的技能
// - 按综合分排序
// - 返回前 N 个

export function reapColdSkills()
// 技能收割器，清理过期或低质技能：
// - 评分 < 0.25 且 30 天未使用
// - 失败率 > 80% 且尝试 > 5 次
// - 保持最多 100 个技能
```

**持久化**: 技能库存储在 `~/.yuangs_skills.json`

**全局作用**: Skills 系统使 Agent 能够从经验中学习，提升执行效率

---

#### executor.ts

**职责**: Shell 命令执行器

**关键方法**:

```typescript
export async function exec(command: string): Promise<ExecResult>
// 执行 shell 命令
// - 使用用户配置的 SHELL
// - 实时输出 stdout/stderr
// - 返回结果和退出码

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}
```

**全局作用**: ToolExecutor 内部使用，是所有 shell 命令执行的基础

---

### src/ai/

#### client.ts

**职责**: AI API 客户端，处理 LLM 调用和对话历史

**关键方法**:

```typescript
export async function askAI(prompt: string, model?: string): Promise<string>
// 单次 AI 请求（非流式）
// - 从 ~/.yuangs.json 读取配置
// - 发送到 https://aiproxy.want.biz/v1/chat/completions
// - 返回完整响应

export async function callAI_Stream(
  messages: AIRequestMessage[],
  model: string | undefined,
  onChunk: (content: string) => void
): Promise<void>
// 流式 AI 请求
// - 实时处理 SSE 数据
// - 逐块调用 onChunk 回调
// - 支持 Markdown 渲染

export function addToConversationHistory(role: 'system' | 'user' | 'assistant', content: string)
export function getConversationHistory(): AIRequestMessage[]
export function clearConversationHistory()
// 对话历史管理（内存 + SQLite）

export function getUserConfig(): UserConfig
// 读取用户配置 ~/.yuangs.json
```

**配置文件**: `~/.yuangs.json`

```json
{
  "defaultModel": "gemini-2.5-flash-lite",
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "accountType": "free",
  "contextWindow": 8000,
  "maxFileTokens": 20000,
  "maxTotalTokens": 200000
}
```

**数据库**: `~/.yuangs_chat_history/history.db`

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER DEFAULT (unixepoch())
);
```

**全局作用**: ai/client 是整个系统与 LLM 交互的唯一入口

---

### src/core/

#### executionRecord.ts

**职责**: 执行记录结构定义和序列化

**关键结构**:

```typescript
export interface ExecutionRecord {
  id: string;                              // 执行ID：exec_timestamp_random
  meta: ExecutionMeta;                     // 元数据
  intent: CapabilityIntent;                // 能力意图
  configSnapshot: MergedConfig;            // 配置快照
  decision: ModelDecision;                 // 模型决策
  outcome: ExecutionOutcome;               // 执行结果
  command?: string;                        // 执行的命令
}

export interface ExecutionMeta {
  commandName: string;
  timestamp: string;
  toolVersion: string;
  projectPath: string;
  args?: any;
  rawInput?: string;
  mode?: string;
  replayable?: boolean;
  version?: string;
}

export interface ModelDecision {
  candidateModels: CapabilityMatchExplanation[];
  selectedModel: ModelCapabilities | null;
  usedFallback: boolean;
  fallbackReason?: string;
  strategy?: string;
  reason?: string;
  skills?: Skill[];
}

export interface ExecutionOutcome {
  success: boolean;
  failureReason?: 'capability-mismatch' | 'provider-error' | 'user-abort' | 'timeout' | 'other';
  tokenCount?: number;
  latencyMs?: number;
  reward?: number;
}
```

**全局作用**: ExecutionRecord 是所有执行的审计记录，用于 explain 和 replay

---

#### explain.ts

**职责**: 可解释性系统，生成人类可读的执行解释

**规范**: Explain Output Spec v1

```typescript
export function explainExecution(record: ExecutionRecord): string
// 生成稳定的 5 部分解释
```

**输出格式**:

```
=== Execution Explanation ===

[1] Command
- Name: <命令名>
- Args: <参数>
- Raw: <原始输入>

[2] Decision
- Strategy: <决策策略>
- Selected Model: <选择的模型>
- Reason: <选择原因>

[3] Model
- Name: <模型名称>
- Provider: <提供商>
- Context Window: <上下文窗口>
- Cost Profile: <成本配置>

[4] Skills
- <技能名>
    score: <评分>
    confidence: <置信度>
    successRate: <成功率>
    enabled: <启用状态>
    lastUsed: <最后使用时间>

[5] Meta
- Execution ID: <执行ID>
- Timestamp: <时间戳>
- Replayable: <可重放>
- Version: <版本>

=============================
```

**全局作用**: explain 系统提供执行透明度，支持审计和调试

---

#### replayEngine.ts

**职责**: 执行重放引擎，支持多种重放模式

**关键方法**:

```typescript
export class ReplayEngine {
  async replay(recordId: string, options: ReplayOptions = { mode: 'strict' }): Promise<ReplayResult>
  // 主重放方法
  // - 加载执行记录
  // - 根据 mode 选择重放策略

  private async strictReplay(...)
  // 严格重放：
  // - 使用原模型
  // - 执行原命令
  // - 精确复现

  private async compatibleReplay(...)
  // 兼容重放：
  // - 允许模型降级
  // - 使用当前配置
  // - 记录偏差原因

  private async reEvaluate(...)
  // 重新评估：
  // - 重新运行能力匹配
  // - 使用当前配置
  // - 生成新决策
}

export type ReplayMode = 'strict' | 'compatible' | 're-evaluate';

export interface ReplayOptions {
  mode: ReplayMode;
  skipAI?: boolean;
  verbose?: boolean;
  dry?: boolean;           // 干运行，不实际执行
  explain?: boolean;       // 显示解释
  diff?: boolean;          // 显示差异
}
```

**全局作用**: replayEngine 支持执行审计、回归测试和故障复现

---

#### capabilityInference.ts

**职责**: 从用户输入推断能力需求

**关键方法**:

```typescript
export function inferCapabilityRequirement(userInput: string): CapabilityRequirement
// 基于关键词推断需要的能力：
// - 代码/脚本/文件/create/write → CODE_GENERATION
// - 分析/理解/解释/推理 → REASONING
// - 长/large/仓库/目录 → LONG_CONTEXT

export interface CapabilityRequirement {
  required: AtomicCapability[];
  preferred: AtomicCapability[];
}
```

**全局作用**: capabilityInference 用于模型匹配，选择最合适的模型

---

#### db.ts

**职责**: SQLite 数据库，持久化对话历史

**关键方法**:

```typescript
export function appendMessageToDB(role: string, content: string)
// 添加消息到数据库

export function getRecentMessagesFromDB(limit: number = 20): AIRequestMessage[]
// 获取最近 N 条消息（按时间正序）

export function clearMessagesInDB()
// 清空所有消息
```

**数据库位置**: `~/.yuangs_chat_history/history.db`

**全局作用**: db 提供对话历史的持久化存储，支持跨会话

---

### src/commands/

#### handleAIChat.ts

**职责**: 交互式 AI 对话处理器，实现 REPL 循环

**核心循环**:

```typescript
export async function handleAIChat(initialQuestion: string | null, model?: string)
// 主 REPL 循环
// 1. 初始化上下文存储
// 2. 创建 readline 接口（支持补全）
// 3. 处理用户输入
//    - 特殊语法 (@, #, :命令)
//    - Shell 命令
//    - AI 问答
// 4. 循环直到 exit
```

**特殊语法处理**:

- `@file[:start-end]` - 添加文件到上下文（支持行号范围）
- `@!file` - 执行并捕获脚本输出
- `@file:command` - 添加文件并执行命令
- `#dir` - 添加目录到上下文
- `:exec cmd` - 原子执行（绕过 AI）
- `:ls` - 列出上下文
- `:cat [index]` - 查看上下文内容
- `:clear` - 清空上下文
- `:plugins` - 列出插件
- `??` 或空行 - Zero-Mode 触发 AI 模式
- `:ai` - 备用 AI 模式触发

**上下文管理**:

```typescript
// 使用 ContextStore 和 ContextAssembler
const contextStore = new ContextStore();
const contextAssembler = new ContextAssembler();

// 持久化到文件
await saveContext(contextStore.export());
const persisted = await loadContext();
```

**Shell 集成**:

```typescript
// 自动检测模式
const mode = detectMode(trimmed);
// 'command' - 直接执行
// 'chat' - 发送给 AI

// 支持补全
completer: createCompleter()
```

**全局作用**: handleAIChat 是用户与系统交互的主要入口

---

#### context/

**ContextStore.ts**

**职责**: 上下文持久化存储

```typescript
export class ContextStore {
  add(item: ContextItem): void
  // 添加上下文项

  list(): ContextItem[]
  // 列出所有上下文

  export(): ContextItem[]
  // 导出为数组

  import(items: ContextItem[]): void
  // 从数组导入

  clear(): void
  // 清空所有上下文

  isEmpty(): boolean
  // 检查是否为空
}
```

**ContextAssembler.ts**

**职责**: 上下文组装器，构建最终 Prompt

```typescript
export class ContextAssembler {
  assemble(
    store: ContextStore,
    userMessage: string,
    options?: AssembleOptions
  ): string
  // 组装上下文为最终 Prompt
  // - 按重要性排序
  // - Token 预算控制
  // - 添加 Git 上下文
}
```

**ContextTypes.ts**

**职责**: 上下文类型定义

```typescript
export interface ContextItem {
  id: string;
  source: 'file' | 'directory' | 'git' | 'manual';
  path: string;
  content: string;
  tokens: number;
  importance: number;        // 0-1
  lastUsedAt: number;
  addedAt: number;
  status: 'active' | 'archived';
  alias?: string;
}
```

**全局作用**: context/* 模块提供完整的上下文管理能力

---

### src/utils/

#### syntaxHandler.ts

**职责**: 特殊语法解析器

**支持的语法**:

```typescript
export async function handleSpecialSyntax(input: string, stdinData?: string): Promise<{ processed: boolean; result?: string }>
// 主处理函数
```

**语法模式**:

1. **文件引用** - `@file[:start-end]`
   - 提取指定行范围
   - 持久化到上下文
   - 返回增强的 Prompt

2. **立即执行** - `@!file`
   - 读取脚本内容
   - 执行并捕获输出
   - 组合源码 + 日志为上下文

3. **目录引用** - `#dir`
   - 递归查找文件
   - 逐个添加到上下文
   - Token 预算控制

4. **原子执行** - `:exec cmd`
   - 直接执行，不经过 AI
   - 继承 stdio

5. **上下文管理** - `:ls`, `:cat [index]`, `:clear`
   - 列出/查看/清空上下文

**全局作用**: syntaxHandler 是所有特殊语法的统一入口

---

### src/policy/

#### model/ModelRegistry.ts

**职责**: 模型规格注册表

**关键方法**:

```typescript
export class ModelRegistry {
  constructor(baseCapabilities: ModelCapabilities[])
  // 从 ModelCapabilities 构建注册表

  get(name: string): ModelSpec | undefined
  // 根据名称获取模型规格

  getDefault(): ModelSpec
  // 获取默认模型（gemini-2.5-flash-lite）

  findLongContextCapable(): ModelSpec[]
  // 查找所有支持长文本的模型
  // 按上下文窗口降序排列

  findBestLongContextModel(): ModelSpec | undefined
  // 返回上下文窗口最大的模型

  listModels(): ModelSpec[]
  // 列出所有已注册的模型
}

interface ModelSpec {
  name: string;
  contextWindow: number;
  costTier: 'low' | 'medium' | 'high';
  longContextCapable: boolean;
}
```

**全局作用**: ModelRegistry 提供统一的模型信息查询接口

---

## 全局核心元素

### ConversationHistory

**位置**: `src/ai/client.ts`

**定义**:

```typescript
let conversationHistory: AIRequestMessage[] = getRecentMessagesFromDB(20);
```

**作用**:
- 内存中的对话历史（最近 20 条）
- 与 SQLite 数据库同步
- 用于上下文感知的 LLM 调用

**全局影响**:
- 所有 AI 调用都带有历史上下文
- 支持多轮对话
- 提供对话连续性

**持久化**: `~/.yuangs_chat_history/history.db`

---

### ContextStore / ContextBuffer

**位置**: `src/commands/context/ContextStore.ts`, `src/commands/contextBuffer.ts`

**定义**:

```typescript
// ContextStore - 持久化存储
const contextStore = new ContextStore();

// ContextBuffer - 内存缓冲
const contextBuffer = new ContextBuffer();
```

**作用**:
- 管理文件、目录、Git 等上下文
- 持久化到 `~/.yuangs_context.json`
- 支持 Token 预算控制
- 支持重要性排序

**全局影响**:
- 所有文件/目录引用都通过它管理
- 上下文可跨会话持久化
- 支持复杂的上下文组合

---

### SkillLibrary

**位置**: `src/agent/skills.ts`

**定义**:

```typescript
let skillLibrary: Skill[] = [];
const SKILLS_FILE = path.join(os.homedir(), '.yuangs_skills.json');
```

**作用**:
- 存储所有学到的技能
- 每个技能有评分和置信度
- 自动学习、自动清理

**全局影响**:
- 提升重复任务的执行效率
- 实现经验积累
- 支持 A/B 测试

**持久化**: `~/.yuangs_skills.json`

---

### GovernanceService

**位置**: `src/agent/governance.ts`

**定义**:

```typescript
export class GovernanceService {
  private static rules: PolicyRule[];
  private static ledger = new RiskLedger();
  private static initialized = false;
}
```

**作用**:
- 三层审核机制
- 风险评估和披露
- 执行决策记录

**全局影响**:
- 所有执行都经过审核
- 提供安全保障
- 可审计的决策历史

**配置文件**: `policy.yaml` (工作目录)

---

### ExecutionRecord

**位置**: `src/core/executionRecord.ts`

**定义**:

```typescript
export interface ExecutionRecord {
  id: string;
  meta: ExecutionMeta;
  intent: CapabilityIntent;
  configSnapshot: MergedConfig;
  decision: ModelDecision;
  outcome: ExecutionOutcome;
  command?: string;
}
```

**作用**:
- 完整的执行审计记录
- 支持 explain 和 replay
- 包含所有上下文和决策

**全局影响**:
- 提供完整的可追溯性
- 支持故障复现
- 用于技能学习

**持久化**: `~/.yuangs_execution_records/`

---

### UserConfig

**位置**: `src/core/validation.ts`

**定义**:

```typescript
export type UserConfig = {
  defaultModel?: string;
  aiProxyUrl?: string;
  accountType?: 'free' | 'pro' | 'paid';
  contextWindow?: number;
  maxFileTokens?: number;
  maxTotalTokens?: number;
  [key: string]: any;
};
```

**作用**:
- 用户个性化配置
- 控制行为和资源使用

**全局影响**:
- 影响 AI 模型选择
- 控制 Token 预算
- 影响 API 调用

**持久化**: `~/.yuangs.json`

---

## 关键数据结构

### AgentInput

```typescript
export interface AgentInput {
  rawInput: string;
  stdin?: string;
  context?: AgentContext;
  options?: {
    model?: string;
    stream?: boolean;
    autoYes?: boolean;
    verbose?: boolean;
  };
}
```

**用途**: Agent 的输入接口，包含用户输入、标准输入、上下文和选项

---

### AgentContext

```typescript
export interface AgentContext {
  files?: Array<{ path: string; content: string }>;
  gitDiff?: string;
  history?: AIRequestMessage[];
}
```

**用途**: Agent 执行的上下文信息

---

### Skill

```typescript
export interface Skill {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  planTemplate: any;

  successCount: number;
  failureCount: number;
  confidence: number;        // 0-1

  lastUsed: number;
  createdAt: number;

  enabled: boolean;
}
```

**用途**: 技能实体，存储 learned execution patterns

---

### ContextItem

```typescript
export interface ContextItem {
  id: string;
  source: 'file' | 'directory' | 'git' | 'manual';
  path: string;
  content: string;
  tokens: number;
  importance: number;        // 0-1
  lastUsedAt: number;
  addedAt: number;
  status: 'active' | 'archived';
  alias?: string;
}
```

**用途**: 上下文项，表示一个文件、目录或其他上下文源

---

### PolicyRule

```typescript
export interface PolicyRule {
  id: string;
  effect: 'allow' | 'deny';
  reason: string;
  actions?: string[];
  riskLevels?: string[];
}
```

**用途**: 治理规则，定义允许或拒绝的操作

---

### RiskEntry

```typescript
export interface RiskEntry {
  actionType: string;
  timestamp: number;
  riskLevel: 'low' | 'medium' | 'high';
  approved: boolean;
}
```

**用途**: 风险账本条目，记录执行历史

---

## 特殊语法参考

### 文件引用

#### `@file[:start-end]`

**用途**: 引用文件内容到 AI 上下文

**示例**:
```
@src/index.ts
@src/index.ts:10-50
@src/index.ts:10 as main-file
```

**行为**:
- 读取文件内容
- 可选行号范围（闭区间）
- 可选别名
- 持久化到上下文存储

**详细语法规则**：

**1. 基础文件引用**
```
@src/agent/AgentRuntime.ts
@path/to/file.ts
```
- 读取整个文件
- 持久化到上下文
- Token: 完整文件内容

---

**2. 行号范围引用**

```
@src/index.ts:10-50        # 读取第 10 到 50 行（闭区间）
@src/index.ts:100-         # 从第 100 行读到文件末尾
@src/index.ts:10-100        # 从第 10 行读到第 100 行
@src/index.ts:10           # 从第 10 行读到文件末尾（与 :10-100 相同）
```

**验证逻辑**（来自 `src/commands/handleAIChat.ts` lines 467-484）：
```typescript
// 验证起始行号
if (startLine < 1 || startLine > lines.length) {
  console.log(chalk.red(`错误: 起始行号 ${startLine} 超出文件范围 (文件共有 ${lines.length} 行)`));
  return; // 不添加到上下文
}

// 验证结束行号
if (endLine && (endLine < startLine || endLine > lines.length)) {
  console.log(chalk.red(`错误: 结束行号 ${endLine} 超出有效范围 (应在 ${startLine}-${lines.length} 之间)`));
  return; // 不添加到上下文
}

// 提取指定范围的行
const startIdx = startLine - 1; // 转换为数组索引（从0开始）
let endIdx = endLine ? Math.min(endLine, lines.length) : lines.length;
content = lines.slice(startIdx, endIdx).join('\n');
```

**验证示例**：
```
✅ @src/utils/fileReader.ts:1-50
   添加文件: src/utils/fileReader.ts
   行范围: 1-50
   状态: 成功

❌ @src/utils/fileReader.ts:200-250
   错误: 起始行号 200 超出文件范围 (文件共有 180 行)
   状态: 未添加到上下文
```

---

**3. 带别名的引用**

```
@src/index.ts as main-entry
@src/config.json:1-50 as app-config
```

**别名的作用**：
- 为文件或上下文项提供简短的标识
- 在 `:ls` 列表时显示别名而非完整路径
- 方便在对话中引用

**别名显示示例**：
```
:ls
上下文列表:
  [1] file: src/index.ts (tokens: 3,200)
  [2] file: src/commands/handleAIChat.ts (tokens: 12,500)
  [3] main-entry: src/index.ts (tokens: 3,200)
      ↑ 别名引用
```

---

**Token 计算**：
```typescript
// 粗略估算：1 token ≈ 4 字符（英文）或 2 字符（中文）
tokens = Math.ceil(content.length / 4);
```

**持久化**：
- 文件内容添加到 `~/.yuangs_context.json`
- 支持跨会话持久化
- 可通过 `:ls` 查看，`:clear` 清空

---

#### `@!file`

**用途**: 立即执行脚本并捕获输出

**示例**:
```
@!build.sh
```

**行为**:
- 读取脚本内容
- 执行脚本
- 捕获 stdout/stderr
- 组合源码 + 日志为上下文

**详细执行流程**（来自 `src/commands/handleAIChat.ts` lines 398-451 和 `src/utils/syntaxHandler.ts` lines 203-263）：

**步骤 1: 检查文件是否存在**
```typescript
const fullPath = path.resolve(filePath);
if (!fs.existsSync(fullPath)) {
  console.log(chalk.red(`错误: 文件 "${filePath}" 不存在`));
  return { processed: true, result: '文件不存在' };
}
```

**步骤 2: 读取脚本内容**
```typescript
const content = fs.readFileSync(fullPath, 'utf-8');
console.log(chalk.gray(`正在执行 ${filePath} 并捕获输出...`));
```

**步骤 3: 执行脚本**
```typescript
// 使用 async/await 执行并捕获输出
const { stdout, stderr } = await execAsync(
  `chmod +x "${fullPath}" && "${fullPath}"`,
  { cwd: process.cwd() }
);

// 实时输出给用户
console.log(stdout); // 标准输出
if (stderr) console.error(chalk.red(stderr)); // 标准错误
```

**步骤 4: 构造组合上下文**
```typescript
const combinedContext = `
=== 脚本内容 (${filePath}) ===
\`\`\`bash
${content}
\`\`\`

=== 执行标准输出 (stdout) ===
\`\`\`
${stdout}
\`\`\`

=== 执行标准错误 (stderr) ===
\`\`\`
${stderr}
\`\`\`
`;
```

**步骤 5: 添加到上下文存储**
```typescript
const contextBuffer = new ContextBuffer();
const persisted = await loadContext();
contextBuffer.import(persisted);

contextBuffer.add({
  type: 'file',
  path: `${filePath} (Runtime Log)`,
  content: combinedContext,
  summary: '包含脚本源码和执行后的输出日志'
});

await saveContext(contextBuffer.export());
console.log(chalk.green(`\n✓ 已捕获脚本源码及执行日志到上下文\n`));
```

---

**输出格式示例**：
```
=== 脚本内容 (build.sh) ===
```bash
npm run build
```

=== 执行标准输出 (stdout) ===
```
Build completed in 3.2s
✓ Built successfully
```

=== 执行标准错误 (stderr) ===
```
```
```

**使用场景**：

**场景 1: 构建失败诊断**
```bash
用户: @!build.sh 这个构建失败了
系统: 执行并捕获输出
输出: ✓ 已捕获脚本源码及执行日志到上下文
AI: 我看到了构建失败的错误。根据错误信息，这是 TypeScript 类型错误...（然后提供修复方案）
```

**场景 2: 部署日志分析**
```bash
用户: @!deploy.sh 检查部署日志
系统: 执行并捕获完整的日志输出
AI: 根据日志分析，部署过程中数据库迁移成功了，但有一个警告...
```

**优势**：
- 立即获取实际输出，无需手动复制粘贴
- 同时保存源代码和输出，便于上下文对比
- 适合调试脚本执行问题

**注意事项**：
- 脚本必须有可执行权限
- 输出内容大小限制：系统会截断过长的输出（>300 字符）
- 执行环境的 shell 默认为用户配置的 SHELL

---

#### `@file:command`

**用途**: 在文件上下文中执行命令

**示例**:
```
@package.json:npm install
@src/tsconfig.json:tsc --watch
```

**行为**:
- 添加文件到上下文
- 切换到文件所在目录执行命令
- 捕获输出

**详细执行流程**（来自 `src/commands/handleAIChat.ts` lines 357-394）：

```typescript
// 解析命令语法
const execMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^].*)?$/);
if (execMatch && execMatch[2]) {
  const filePath = execMatch[1].trim();
  const commandStr = execMatch[2].trim();

  // 1. 读取文件内容
  const content = await readFileContent(filePath);

  // 2. 添加到上下文存储
  contextStore.add({
    id: `file:${filePath}`,
    source: 'file',
    path: filePath,
    content,
    tokens: Math.ceil(content.length / 4),
    importance: 0.5,
    lastUsedAt: Date.now(),
    addedAt: Date.now(),
    status: 'active'
  });

  // 3. 持久化上下文
  await saveContext(contextStore.export());

  // 4. 切换到文件目录并执行命令
  const { stdout, stderr } = await exec(commandStr, {
    cwd: path.dirname(filePath)
  });

  console.log(stdout);
  if (stderr) console.error(chalk.red(stderr));

  // 5. 再次保存上下文（可能因执行结果而变化）
  await saveContext(contextStore.export());
}
```

**使用场景**：

**场景 1: 在项目目录中运行命令**
```bash
用户: @package.json:npm install

行为:
1. 添加 package.json 到上下文
2. 切换到 /Users/ygs/npm_yuangs/ 执行 npm install
3. 捕获输出并显示
4. 输出: ✓ 已加入文件上下文: package.json
       ✓ 执行完成

结果: npm install 成功执行，输出同时保存到上下文
```

**场景 2: 在配置文件目录中测试**
```bash
用户: @config/config.yaml:cat config.yaml

行为:
1. 添加 config.yaml 到上下文
2. 切换到 /Users/ygs/npm_yuangs/config/ 执行 cat config.yaml
3. 显示配置内容

结果: 可以直接查看配置，适合验证和检查
```

**注意事项**：
- 命令在文件所在目录执行，而非当前工作目录
- 适合需要特定工作目录的命令（如构建、测试）
- 执行结果的标准输出直接显示，不经过 LLM

---

### 目录引用

#### `#dir`

**用途**: 引用目录下所有文件到 AI 上下文

**示例**:
```
#src/
#src/components
#tests
```

**行为**:
- 递归查找所有文件
- 逐个添加到上下文
- Token 预算控制
- 跳过大文件

**详细执行流程**（来自 `src/commands/handleAIChat.ts` lines 534-612 和 `src/utils/syntaxHandler.ts` lines 147-201）：

```typescript
// 1. 检查目录是否存在
const fullPath = path.resolve(dirPath);
if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
  console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录`));
  return { processed: true, result: '目录不存在' };
}

// 2. 查找文件
const findCommand = process.platform === 'darwin' || process.platform === 'linux'
  ? `find "${fullPath}" -type f`
  : `dir /s /b "${fullPath}"`;

const { stdout } = await execAsync(findCommand);
const filePaths = stdout.trim().split('\n').filter(f => f);

if (filePaths.length === 0) {
  console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件`));
  return { processed: true, result: question };
}

// 3. 读取文件内容
const contentMap = readFilesContent(filePaths);

// 4. 添加到上下文（带 Token 预算控制）
const userConfig = getUserConfig();
const maxFileTokens = userConfig.maxFileTokens || 20000;    // 单文件最大 Token 限制
const maxTotalTokensLimit = userConfig.maxTotalTokens || 200000;  // 总上下文最大 Token 限制

let addedCount = 0;
for (const [filePath, content] of contentMap) {
  // 检查单个文件大小
  const fileTokens = Math.ceil(content.length / 4);
  if (fileTokens > maxFileTokens) {
    console.log(chalk.yellow(`⚠️  跳过大文件: ${filePath} (太大)`));
    continue; // 跳过此文件
  }

  // 添加到上下文
  contextStore.add({
    id: `file:${filePath}`,
    source: 'file',
    path: filePath,
    content: content,
    tokens: fileTokens,
    importance: 0.5,
    lastUsedAt: Date.now(),
    addedAt: Date.now(),
    status: 'active'
  });
  addedCount++;

  // 检查是否达到总 Token 限制
  const currentTotalTokens = contextStore.export().reduce((sum, item) => sum + item.tokens, 0);
  if (currentTotalTokens > maxTotalTokensLimit) {
    console.log(chalk.yellow(`⚠️  达到token限制，停止添加更多文件`));
    break; // 停止添加更多文件
  }
}

// 5. 持久化上下文
await saveContext(contextStore.export());

console.log(chalk.green(`✓ 已成功加入 ${addedCount} 个文件到上下文`));
```

**配置项说明**：

| 配置项 | 默认值 | 说明 |
|---------|---------|------|
| `maxFileTokens` | 20000 | 单个文件最大 Token 数量，超过此限制的文件将被跳过 |
| `maxTotalTokens` | 200000 | 总上下文最大 Token 数量，达到此限制后停止添加文件 |

**文件扫描策略**：

**跨平台支持**：
- **Linux/macOS**: 使用 `find` 命令递归查找
- **Windows**: 使用 `dir /s /b` 命令

**排除规则**：
- 只包含文件（type f），不包含目录
- 递归查找所有子目录

**智能选择**（可选，当启用 SmartContextManager 时）：
- 按相关性评分排序
- 优先选择与用户查询相关的文件
- 在 Token 预算内包含最多的有用信息

---

**使用场景**：

**场景 1: 查看整个项目结构**
```bash
用户: #src/
系统: 
  - 扫描 src/ 目录下的所有文件
  - 添加每个文件到上下文
  - 持久化存储
  - 输出: ✓ 已成功加入 48 个文件到上下文

AI: 
  我看到了项目包含以下模块：
  - src/agent/ - Agent 执行引擎
  - src/ai/ - AI 客户端
  - src/commands/ - 命令处理器
  - src/core/ - 核心功能
  - ...
```

**场景 2: 选择性添加特定目录**
```bash
用户: #src/agent #src/core
系统: 
  - 扫描 src/agent/ 和 src/core/
  - 只添加这些目录的文件
  - 输出: ✓ 已成功加入 15 个文件到上下文

AI: 分析这两个核心模块的代码...
```

**场景 3: 大项目目录扫描**
```bash
用户: #.

系统: 
  - 扫描当前目录（递归）
  - 添加大量文件
  - 如果达到 Token 限制，显示警告
  - 输出: ✓ 已成功加入 156 个文件到上下文
          ⚠️ 跳过大文件: 8 个
          ⚠️ 达到token限制，停止添加更多文件

AI: 
  我看到了项目结构，以下是大文件被跳过：
  - large-data.json (85,000 tokens)
  - dist/bundle.js (120,000 tokens)
  是否需要我重新扫描这些文件或查看摘要？
```

**注意事项**：
- 对于大项目，建议使用更精确的目录路径（如 `#src/agent` 而非 `#.`）
- Token 限制会阻止包含过多文件，但可以通过配置调整
- 上下文是持久的，下次会话会自动加载

---

### 管理命令

#### `:exec cmd`

**用途**: 原子执行，绕过 AI

**示例**:
```
:exec ls -la
:exec git status
:exec npm test
```

**行为**:
- 直接执行命令
- 继承 stdio
- 不经过 AI 推理

**详细执行流程**（来自 `src/commands/handleAIChat.ts` lines 334-347 和 `src/utils/syntaxHandler.ts` lines 265-290）：

```typescript
// 在 handleAIChat.ts 中的 REPL 循环中处理
if (trimmed.startsWith(':exec ')) {
  const cmd = trimmed.slice(6).trim();
  if (cmd) {
    // 1. 暂停 readline 接口
    rl.pause();
    
    // 2. 执行 shell 命令
    try {
      await shellExecuteCommand(cmd, (code) => {
        if (code !== 0) console.log(chalk.red(`Exited with ${code}`));
      });
    } finally {
      // 3. 恢复 readline 接口
      rl.resume();
    }
  }
}

// shellExecuteCommand 实现
async function shellExecuteCommand(cmd: string, onExit) {
  const child = spawn(cmd, { shell: true, stdio: 'inherit' });
  child.on('close', onExit);
}

// 在 syntaxHandler.ts 中的独立处理
async function handleAtomicExec(command: string) {
  console.log(chalk.cyan(`\n⚡️ [Atomic Exec] 执行命令: ${command}\n`));
  
  try {
    // 1. 使用 spawn 继承 stdio
    const { spawn } = require('child_process');
    const child = spawn(command, { 
      shell: true, 
      stdio: 'inherit' 
    });

    // 2. 等待进程完成
    await new Promise<void>((resolve, reject) => {
      child.on('close', (code: number) => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
      child.on('error', reject);
    });
    
    // 3. 返回空结果（不传递给 AI）
    return { processed: true, result: '' };
  } catch (error) {
    console.error(chalk.red(`执行失败: ${error}`));
    return { processed: true, result: '' };
  }
}
```

**特点**：

1. **完全绕过 AI** - 命令直接传递给 shell，不经过任何 AI 处理
2. **实时交互** - 使用 `stdio: 'inherit'`，命令可以直接与用户交互（如密码输入）
3. **继承环境** - 命令在当前 shell 环境中执行，继承所有环境变量
4. **无上下文** - 执行结果不自动添加到 AI 上下文
5. **独立模式** - 可作为独立的命令使用，不依赖于 AI 会话

---

**使用场景**：

**场景 1: 快速文件操作**
```bash
用户: :exec ls -la
系统: 直接显示文件列表（不经过 AI）
优势: 快速、直接、无延迟
```

**场景 2: Git 操作**
```bash
用户: :exec git status
系统: 直接执行 git 命令
优势: 保持 git 的彩色输出和交互性
```

**场景 3: 构建和测试**
```bash
用户: :exec npm test
系统: 直接运行测试套件
优势: 完整的错误输出和退出码
```

**场景 4: 管道操作**
```bash
用户: :exec cat file.log | grep "ERROR"
系统: 执行带管道的命令
优势: 支持所有 shell 语法和特性
```

---

**与其他模式的对比**：

| 特性 | :exec | AI 模式 | Shell 直接执行 |
|--------|--------|----------|---------------|
| AI 推理 | ❌ 否 | ✅ 是 | ❌ 否 |
| 治理审核 | ❌ 否 | ✅ 是 | ❌ 否 |
| 上下文感知 | ❌ 否 | ✅ 是 | ❌ 否 |
| 可执行历史记录 | ❌ 否 | ✅ 是 | ✅ 是 |
| 输出到 AI | ❌ 否 | ✅ 是 | ❌ 否 |
| 用户交互 | ✅ 是 | ❌ 否 | ✅ 是 |

---

**适用场景**：

✅ **推荐使用 `:exec` 的场景**：
1. 已知确切的命令
2. 需要实时用户交互（如密码、确认）
3. 需要看到完整的原始输出（包括颜色、格式）
4. 快速的重复性操作
5. 需要利用 shell 管道或重定向

❌ **不推荐使用 `:exec` 的场景**：
1. 不确定命令语法时（先用 AI 查询）
2. 需要根据上下文做决策时
3. 需要记录到执行历史中（AI 模式会记录）
4. 需要技能学习和模式识别时

---

**在 handleAIChat REPL 中的集成**：

```typescript
// REPL 循环中的处理
while (true) {
  const input = await ask(chalk.green('你：'));
  const trimmed = input.trim();

  // :exec 优先级最高
  if (trimmed.startsWith(':exec ')) {
    const cmd = trimmed.slice(6).trim();
    
    rl.pause();  // 暂停 readline
    try {
      await shellExecuteCommand(cmd);
    } finally {
      rl.resume();  // 恢复 readline
    }
    continue;  // 跳过其他处理
  }

  // 其他处理...
  // AI 聊天、其他特殊语法等
}
```

**设计原则**：

- **最小化 AI 介入** - 对于确定性命令，直接执行，减少延迟和 token 消耗
- **保持控制权** - 用户通过 `:exec` 明确表示要直接执行，保留完全控制
- **透明性** - 用户能清楚看到执行过程，无中间层
- **效率优先** - 简单快速操作不需要等待 AI 响应

---

#### `:ls`

**用途**: 列出当前上下文

**示例**:
```
:ls
```

**行为**:
- 显示所有上下文项
- 表格格式

---

#### `:cat [index]`

**用途**: 查看上下文内容

**示例**:
```
:cat          # 查看所有
:cat 1        # 查看第1个
```

**行为**:
- 显示上下文内容
- 支持索引选择

---

#### `:clear`

**用途**: 清空上下文

**示例**:
```
:clear
```

**行为**:
- 清空内存上下文
- 删除持久化存储

---

#### `:plugins`

**用途**: 列出加载的插件

**示例**:
```
:plugins
```

**行为**:
- 显示所有可用插件
- 列出补全功能

---

### Zero-Mode 触发

#### `??`

**用途**: 触发 AI 模式

**示例**:
```
?? 怎么解压 .tar.gz 文件？
```

**行为**:
- 进入 AI 问答模式
- 使用当前上下文（如果有）
- ⚠️ 注意：可能与 shell glob 冲突

---

#### `:ai`

**用途**: 备用 AI 模式触发

**示例**:
```
:ai
```

**行为**:
- 与 `??` 功能相同
- 避免 glob 冲突

---

#### 空行 + Enter

**用途**: 默认 Zero-Mode 触发

**示例**:
```
（直接按回车）
```

**行为**:
- 使用当前上下文
- 进入 AI 问答模式

---

### 语法优先级

1. `:exec` - 最高优先级，立即执行
2. `@!file` - 第二优先级，立即执行脚本
3. `@file:command` - 第三优先级，文件 + 命令
4. `@file[:start-end]` - 文件引用
5. `#dir` - 目录引用
6. `:ls`, `:cat`, `:clear`, `:plugins` - 管理命令
7. `??`, `:ai`, 空行 - Zero-Mode 触发
8. 其他 - Shell 命令或 AI 问答

---

## 工作流示例

### 1. 简单问题流程

```
用户输入: "git status 是什么意思？"

1. 检测模式 → chat
2. 构建 Prompt（无上下文）
3. 调用 AgentRuntime.run()
4. LLM 生成答案
5. 显示结果
6. 保存到历史
```

---

### 2. 文件引用分析流程

```
用户输入: "@src/index.ts 解释这段代码"

1. 解析特殊语法 → handleFileReference()
2. 读取文件: src/index.ts
3. 添加到上下文存储
4. 构建增强的 Prompt
5. 调用 AgentRuntime.run()
6. LLM 带文件上下文分析
7. 显示结果
8. 上下文持久化
```

---

### 3. 目录分析流程

```
用户输入: "#src/ 分析这些模块的功能"

1. 解析特殊语法 → handleDirectoryReference()
2. 递归查找: src/ 下的所有文件
3. 逐个添加到上下文（Token 预算）
4. 构建增强的 Prompt
5. 调用 AgentRuntime.run()
6. LLM 分析模块结构
7. 显示结果
8. 上下文持久化
```

---

### 4. 命令生成和执行流程

```
用户输入: "查找大于 100M 的文件"

1. 检测模式 → chat
2. 调用 AgentRuntime.run()
3. LLM 生成计划：
   {
     "type": "shell_cmd",
     "command": "find . -type f -size +100M",
     "risk_level": "low"
   }
4. 治理审核：
   - WASM 核验 → 通过
   - 逻辑核验 → 通过
   - 风险披露 → low
   - 用户确认
5. 执行命令
6. 显示结果
7. 保存记录
8. 技能学习
```

---

### 5. 双 Agent 规划执行流程

```
用户输入: "重构所有组件，批量更新，优化性能"

1. shouldUsePlanner() → true（检测到重构、批量、优化）
2. 调用 Planner 生成任务计划：
   {
     "plan": "分三步重构：1. 分析结构 2. 逐个重构 3. 测试",
     "steps": [
       {"id": "1", "description": "分析组件结构", "type": "analysis", "risk": "low"},
       {"id": "2", "description": "重构 ComponentA", "type": "code_diff", "risk": "medium"},
       {"id": "3", "description": "重构 ComponentB", "type": "code_diff", "risk": "medium"},
       {"id": "4", "description": "运行测试", "type": "shell_cmd", "command": "npm test", "risk": "low"}
     ]
   }
3. 展示计划，用户确认
4. 逐个执行步骤：
   - Step 1: LLM 分析结构
   - Step 2: 治理审核 → 修改代码
   - Step 3: 治理审核 → 修改代码
   - Step 4: 执行测试
5. 显示完成状态
6. 保存记录
7. 技能学习
```

---

### 6. 立即执行并捕获流程

```
用户输入: "@!build.sh 分析构建失败原因"

1. 解析 @! 语法
2. 读取 build.sh 内容
3. 执行脚本：chmod +x build.sh && ./build.sh
4. 捕获输出
5. 组合上下文：
   === 脚本内容 ===
   ```bash
   npm run build
   ```
   === Stdout ===
   [输出]
   === Stderr ===
   [错误]
6. 添加到上下文
7. 调用 AgentRuntime.run()
8. LLM 分析失败原因
9. 显示诊断结果
```

---

### 7. 重放执行流程

```
用户输入: "yuangs replay exec_1768820380225_rgts34981 --dry --explain"

1. 加载执行记录
2. 显示解释（explainExecution）：
   [1] Command: ai-command
   [2] Decision: capability-match, gemini-2.5-flash-lite
   [3] Model: gemini-2.5-flash-lite, 8000 context
   [4] Skills: deploy-production (score: 0.72)
   [5] Meta: exec_1768820380225_rgts34981
3. Dry-run → 不执行，仅显示信息
4. 返回成功
```

---

## 附录

### 配置文件

#### ~/.yuangs.json

```json
{
  "defaultModel": "gemini-2.5-flash-lite",
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "accountType": "free",
  "contextWindow": 8000,
  "maxFileTokens": 20000,
  "maxTotalTokens": 200000,
  "autoConfirm": false,
  "disablePlanner": false
}
```

#### ~/.yuangs_skills.json

```json
[
  {
    "id": "exec_1768820380225_rgts34981",
    "name": "deploy-production",
    "description": "Auto-learned skill: deploy-production",
    "whenToUse": "部署到生产环境",
    "planTemplate": {...},
    "successCount": 8,
    "failureCount": 1,
    "confidence": 0.65,
    "lastUsed": 1705680000000,
    "createdAt": 1705000000000,
    "enabled": true
  }
]
```

#### policy.yaml (工作目录)

```yaml
rules:
  - id: no-rm-rf
    effect: deny
    reason: Destructive rm -rf command
    actions: [shell_cmd]
    riskLevels: [high]

  - id: allow-safe
    effect: allow
    reason: Safe operations allowed
```

---

### 环境变量

```bash
SHELL           # 默认 shell（用于执行命令）
YUANGS_CONFIG   # 配置文件路径（覆盖默认）
YUANGS_DEBUG    # 调试模式
```

---

### 数据库结构

#### messages 表

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,           -- 'system' | 'user' | 'assistant'
  content TEXT NOT NULL,
  timestamp INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_timestamp ON messages(timestamp);
```

---

### API 端点

#### aiproxy.want.biz

```http
POST https://aiproxy.want.biz/v1/chat/completions

Headers:
  Content-Type: application/json
  X-Client-ID: npm_yuangs
  Origin: https://cli.want.biz
  Referer: https://cli.want.biz/
  account: free | pro | paid
  User-Agent: Mozilla/5.0 (iPhone; ...)
  Accept: application/json

Body:
{
  "model": "gemini-2.5-flash-lite",
  "messages": [
    {"role": "user", "content": "..."}
  ],
  "stream": false | true
}
```

---

### 日志和调试

**启用调试模式**:

```bash
export YUANGS_DEBUG=1
yuangs ai "测试"
```

**查看日志**:

```bash
tail -f ~/.npm/_logs/$(date +%Y-%m-%d).log
```

---

## 总结

**yuangs** 是一个精心设计的 AI-augmented Shell 系统，核心特点：

1. **可治理性** - 三层审核机制确保安全
2. **可解释性** - 完整的审计记录和 explain 系统
3. **可重放性** - 支持执行重放和故障复现
4. **学习能力** - 技能系统从经验中学习
5. **语法力量** - 显式的文件/目录引用语法
6. **人类控制** - 始终有人类在环

**全局核心元素**:

- **ConversationHistory** - 对话历史，提供上下文连续性
- **ContextStore** - 上下文管理，支持持久化
- **SkillLibrary** - 技能学习，提升执行效率
- **GovernanceService** - 治理审核，确保执行安全
- **ExecutionRecord** - 审计记录，支持 explain 和 replay
- **UserConfig** - 用户配置，个性化行为控制

**设计哲学**:

> **AI 提供思路，人类掌控执行。**
>
> 这不是妥协，而是对工程理性的尊重。

---

*文档版本: 1.1*
*最后更新: 2026-01-25*
