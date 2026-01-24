# yuangs CLI - 完整接口文档

> **AI-augmented Shell with Governance**

版本: 3.27.0
作者: 苑广山

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

---

#### `@file:command`

**用途**: 在文件上下文中执行命令

**示例**:
```
@package.json:npm install
```

**行为**:
- 添加文件到上下文
- 执行指定命令
- 捕获输出

---

### 目录引用

#### `#dir`

**用途**: 引用目录下所有文件到 AI 上下文

**示例**:
```
#src/
#src/components
```

**行为**:
- 递归查找所有文件
- 逐个添加到上下文
- Token 预算控制
- 跳过大文件

---

### 管理命令

#### `:exec cmd`

**用途**: 原子执行，绕过 AI

**示例**:
```
:exec ls -la
:exec git status
```

**行为**:
- 直接执行命令
- 继承 stdio
- 不经过 AI 推理

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

*文档版本: 1.0*
*最后更新: 2026-01-24*
