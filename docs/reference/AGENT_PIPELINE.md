# Agent Pipeline Architecture

## 概述

版本 2.1.0 引入了全新的 **Agent Pipeline** 架构，统一了 AI Chat 和 AI Command 的执行流程。这是一个可扩展、可调试、可进化的智能体系统。

## 核心架构

### Pipeline 阶段

```
User Input
   ↓
1. Intent Analysis (意图分析)
   ↓
2. Context Assembly (上下文组装)
   ↓
3. Prompt Construction (提示词构建)
   ↓
4. Model Selection (模型选择)
   ↓
5. LLM Execution (LLM 执行)
   ↓
6. Result Interpretation (结果解释)
   ↓
7. Action Execution (动作执行)
   ↓
8. Execution Record (执行记录)
```

### 目录结构

```
src/agent/
├── AgentPipeline.ts    # 核心编排器
├── types.ts            # 类型定义
├── intent.ts           # 意图推断
├── context.ts          # 上下文组装
├── prompt.ts           # 提示词构建
├── selectModel.ts      # 模型选择
├── llm.ts              # LLM 执行
├── interpret.ts        # 结果解释
├── actions.ts          # 动作执行
├── record.ts           # 执行记录
├── replay.ts           # 重放功能
└── index.ts            # 导出
```

## 核心概念

### AgentMode

三种运行模式：

- `chat`: AI 聊天模式（流式输出，无命令执行）
- `command`: 生成 shell 命令（需要确认）
- `command+exec`: **[EXPERIMENTAL/INTERNAL]** 生成并执行命令（仅限 replay/test）

### AgentInput

统一的输入接口：

```typescript
interface AgentInput {
  rawInput: string;           // 用户输入
  stdin?: string;             // 管道输入
  context?: AgentContext;     // 上下文
  options?: {
    model?: string;           // 指定模型
    stream?: boolean;         // 是否流式
    autoYes?: boolean;        // [UNSAFE] 自动确认 (仅限测试环境)
    verbose?: boolean;        // 详细输出
  };
}
```

### AgentContext

上下文信息：

```typescript
interface AgentContext {
  files?: Array<{           // 文件上下文
    path: string;
    content: string;
  }>;
  gitDiff?: string;         // Git 差异
  history?: AIRequestMessage[];  // 对话历史
}
```

## 使用示例

### 基础用法

```typescript
import { AgentPipeline } from './agent';

const agent = new AgentPipeline();

// Chat 模式
await agent.run(
  { rawInput: "解释一下冒泡排序" },
  'chat'
);

// Command 模式
await agent.run(
  { rawInput: "列出当前目录的所有文件" },
  'command'
);
```

### 高级用法

```typescript
// 带上下文的查询
await agent.run(
  {
    rawInput: "这个文件有什么问题？",
    context: {
      files: [{
        path: 'src/index.ts',
        content: fs.readFileSync('src/index.ts', 'utf8')
      }]
    },
    options: {
      model: 'gemini-2.0-flash-exp',
      verbose: true
    }
  },
  'chat'
);
```

## 执行记录与重放

### 执行记录

每次 Agent 运行都会自动保存执行记录：

```typescript
interface ExecutionRecord {
  id: string;                 // 唯一 ID
  timestamp: number;          // 时间戳
  mode: AgentMode;            // 运行模式
  input: AgentInput;          // 输入
  prompt: AgentPrompt;        // 提示词
  model: string;              // 使用的模型
  llmResult: LLMResult;       // LLM 结果
  action: AgentAction;        // 执行的动作
}
```

### 重放功能

```typescript
import { replay, getRecordById } from './agent/replay';

// 获取记录
const record = getRecordById('some-uuid');

// 重放执行
if (record) {
  await replay(record);
}
```

## 能力系统集成

Agent Pipeline 完全集成了现有的 Capability System：

- **Intent Analysis**: 自动推断所需能力
- **Model Selection**: 根据能力选择最佳模型
- **Execution Record**: 记录能力匹配结果

## 扩展性

### 添加新的 Action 类型

```typescript
// 在 types.ts 中扩展 AgentAction
export type AgentAction =
  | { type: 'print'; content: string }
  | { type: 'confirm'; next: AgentAction }
  | { type: 'execute'; command: string; risk: 'low' | 'medium' | 'high' }
  | { type: 'custom'; handler: () => Promise<void> };  // 新类型

// 在 actions.ts 中实现
if (action.type === 'custom') {
  await action.handler();
}
```

### 添加新的 Context 来源

```typescript
// 在 context.ts 中扩展
export function buildContext(input: AgentInput): AgentContext {
  return {
    files: getFiles(),
    gitDiff: getGitDiff(),
    history: getHistory(),
    // 新增
    systemInfo: getSystemInfo(),
    recentCommands: getRecentCommands(),
  };
}
```

## 下一步计划

根据 todo.md，后续将实现：

1. **Planner / Tool Calling**: 多步 Agent 执行
2. **Agent Memory**: 长期记忆与摘要
3. **成本 / Token 可视化**: 执行指标追踪
4. **风险策略**: 高风险命令强制多确认
5. **Multi-Agent**: Planner / Executor / Critic 分体
6. **UI 化**: Timeline + Replay + Diff

## 迁移指南

### 从旧系统迁移

旧的 `handleAICommand` 和 `handleAIChat` 仍然可用，但建议逐步迁移到 Agent Pipeline：

```typescript
// 旧方式
await handleAICommand(question, { execute: false, model });

// 新方式
const agent = new AgentPipeline();
await agent.run(
  { rawInput: question, options: { model } },
  'command'
);
```

### 兼容性

- ✅ 完全向后兼容现有 CLI 命令
- ✅ 复用现有的 Capability System
- ✅ 复用现有的 AI Client
- ✅ 复用现有的 Context Buffer

## 贡献

欢迎贡献新的 Agent 能力和扩展！请参考 `src/agent/` 目录下的代码结构。
