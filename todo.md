# Yuangs AI 交互模式提示词分析与优化建议

## 一、当前提示词系统架构

### 1.1 核心提示词组件

#### 1.1.1 聊天模式提示词
**位置**: `src/agent/prompt.ts` - `buildChatPrompt()`

```typescript
system: 'You are a helpful AI assistant with expertise in software development, 
system administration, and problem-solving.'
```

**特点**:
- 非常简短的系统提示词
- 强调软件开发、系统管理和问题解决能力
- 支持历史对话上下文
- 支持文件上下文注入

#### 1.1.2 命令模式提示词
**位置**: `src/ai/prompt.ts` - `buildCommandPrompt()`

**结构**:
- 系统环境信息（操作系统、Shell、工具版本）
- 平台兼容性规则（macOS/Linux区分）
- Macro（快捷指令）复用机制
- JSON输出结构规范
- 风险等级评估

**特点**:
- 详细的环境感知
- 强调命令安全性
- 优先复用已验证的Macro
- 结构化输出（JSON）

#### 1.1.3 Agent模式提示词
**位置**: `src/agent/llmAdapter.ts` - `LLMAdapter.think()`

**核心协议 (SYSTEM PROTOCOL V2)**:
```typescript
[SYSTEM PROTOCOL V2]
- ROLE: AUTOMATED EXECUTION AGENT
- OUTPUT: STRICT JSON ONLY
- TALK: FORBIDDEN
- MODE: REACT (THINK -> ACTION -> PERCEIVE)
```

**动作类型**:
- `tool_call`: 工具调用（list_files, read_file）
- `shell_cmd`: Shell命令执行
- `answer`: 直接回答（任务完成）

**特点**:
- 严格的JSON输出要求
- 禁止闲聊
- REACT推理模式
- 支持治理策略注入

### 1.2 上下文管理机制

#### 文件上下文注入
- 通过 `@` 符号引用文件
- 支持行号范围选择 (`@filepath:startLine-endLine`)
- 支持别名 (`@filepath as alias`)
- 支持脚本执行捕获 (`@!filename`)

#### 目录上下文注入
- 通过 `#` 符号引用目录
- 递归读取文件内容
- Token限制管理

#### 历史对话
- 保留对话历史
- 支持清空 (`/clear`)
- 支持查看 (`/history`)

### 1.3 技能库系统
**位置**: `src/agent/skills.ts`

- 可参考的技能模板
- 根据用户输入自动匹配相关技能
- 提供执行计划模板

---

## 二、当前提示词的优缺点分析

### 2.1 优点

#### ✅ 结构清晰
- 不同模式使用不同的提示词策略
- JSON Schema规范明确
- 输出格式统一

#### ✅ 环境感知
- 自动检测操作系统和Shell
- 区分macOS/Linux命令差异
- 考虑工具版本兼容性

#### ✅ 安全性考虑
- 风险等级评估
- Macro优先复用（已验证的命令）
- 治理策略注入机制

#### ✅ 灵活性
- 支持多种输入语法（@, #, :exec等）
- 可扩展的技能库
- 流式输出支持

### 2.2 缺点与问题

#### ❌ 聊天模式提示词过于简单
**问题**:
```typescript
system: 'You are a helpful AI assistant...'
```
- 缺乏角色定位和人格设定
- 没有明确的能力边界
- 缺少交互风格指导
- 没有说明上下文使用方式

**影响**:
- AI回答风格不一致
- 可能过度解释或解释不足
- 不擅长引导用户
- 上下文利用率低

#### ❌ Agent模式提示词过于严格
**问题**:
- "TALK: FORBIDDEN" - 完全禁止对话
- "STRICT JSON ONLY" - 可能导致格式错误时完全失败
- 缺少错误处理和重试机制说明

**影响**:
- 用户体验差（看不到思考过程）
- 调试困难
- 无法进行必要的解释

#### ❌ 缺少统一的交互规范
**问题**:
- 没有统一的输出格式标准
- 缺少markdown渲染规范
- 没有错误信息格式规范

**影响**:
- 显示效果不一致
- 用户难以理解错误信息

#### ❌ 上下文注入不够智能
**问题**:
- 文件内容直接拼接，没有摘要
- 缺少优先级排序
- Token管理是硬编码的

**影响**:
- 重要上下文可能被截断
- 相关性弱的文件占用Token

#### ❌ 缺少用户偏好设置
**问题**:
- 没有详细程度控制
- 缺少语言偏好设置
- 没有输出风格选项

**影响**:
- 无法满足不同用户需求
- 个性化体验差

---

## 三、优化建议

### 3.1 聊天模式提示词优化

#### 建议1: 增强角色定义和人格

```typescript
const chatSystemPrompt = `你是一个专业的技术助手，专精于：
- 软件开发（前端、后端、DevOps）
- 系统管理和自动化
- 问题诊断和解决
- 技术方案设计

【交互原则】
1. 简洁明了：优先提供直接答案，必要时补充解释
2. 上下文感知：充分利用提供的文件和目录上下文
3. 实用导向：提供可执行的命令和代码示例
4. 渐进式说明：除非用户要求深度解析，否则先提供概要

【输出格式】
- 使用Markdown格式化代码、列表等
- 关键信息使用加粗或emoji标记
- 分步骤说明使用数字列表
- 代码块指定语言类型

【上下文使用】
- 当上下文中包含相关文件时，引用具体文件名和行号
- 对目录上下文中的文件进行相关性筛选
- 优先使用上下文中的信息作为回答基础`;
```

**优点**:
- 明确能力边界
- 定义交互风格
- 规范输出格式
- 指导上下文使用

#### 建议2: 添加能力声明和限制说明

```typescript
const capabilitiesSection = `
【当前能力】
✓ 读取和分析代码文件
✓ 执行Shell命令（需用户确认）
✓ 搜索和过滤文件内容
✓ Git操作和版本控制
✓ 代码生成和重构建议

【注意事项】
- 执行危险操作前会说明风险
- 无法直接修改文件，提供修改建议
- 大文件只读取关键部分以节省Token
- 敏感信息（如密码）不会保存`;
```

### 3.2 Agent模式提示词优化

#### 建议3: 放宽"禁止对话"限制

**问题分析**:
目前 `STRICT JSON ONLY` 是一种"防御性编程"思维，但在 LLM 语境下，过度限制会导致模型"变笨"。

**进阶方案: CoT (Chain of Thought) 显式分离**

不要把 reasoning 放在 JSON 字段里，而是强制要求 LLM **先输出思考过程，再输出 JSON block**。

**原因**:
- LLM 在生成 JSON 闭合括号前无法"回溯修改"
- 如果在 JSON 字段内写 `reasoning`，它是在生成 Action 之后才写理由（或并行），违背了 CoT "先想后做" 的原理
- 分离格式更易于解析和调试

**优化后的协议**:

```typescript
const agentProtocol = `[SYSTEM PROTOCOL V2.2]
- ROLE: AUTOMATED EXECUTION AGENT
- MODE: REACT (THINK -> ACTION -> PERCEIVE)
- OUTPUT: CoT Block + JSON Block

# EXECUTION PROTOCOL
1. **THINK**: First, analyze the user's request, the current context, and previous history. Plan your next step.
2. **ACT**: Generate a structured JSON action.
3. **OBSERVE**: Wait for the tool output.

# OUTPUT FORMAT
You must output a "Thought Block" followed by a "JSON Action Block".

[THOUGHT]
Explain your reasoning here. 
- Why are you choosing this tool? 
- If the previous step failed, how are you fixing it?
- If using a file, mention lines you are interested in.
[/THOUGHT]

\`\`\`json
{
  "action_type": "tool_call" | "shell_cmd" | "answer",
  "tool_name": "...", 
  "parameters": { ... },
  "command": "...",
  "risk_level": "low" | "medium" | "high",
  "risk_explanation": "Required if risk is medium/high"
}
\`\`\`

# GUIDELINES
- **Silence**: Do not output conversational filler outside the [THOUGHT] block.
- **Safety**: If you must run a destructive command (rm, dd), set risk_level to "high".
- **Context**: You have access to ${context.files?.length || 0} files in context.
- **Formatting**: When answering (action_type="answer"), use standard Markdown.

Example Task: "count files in /tmp"

[THOUGHT]
User wants to count files in /tmp directory. I'll use ls to list files and pipe to wc -l to count them. This is a safe operation with low risk.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "ls /tmp | wc -l",
  "risk_level": "low"
}
\`\`\``;
```

**代码实现**:

```typescript
// src/agent/llmAdapter.ts

private static parseThought(raw: string): AgentThought {
  // 使用正则分别提取思考和JSON
  const match = raw.match(
    /(?:\[THOUGHT\]([\s\S]*?)\[\/THOUGHT\])?\s*(\{[\s\S]*\})/
  );
  
  if (match) {
    const thoughtContent = match[1]?.trim() || '';
    const jsonContent = match[2];
    
    const parsed = JSON5.parse(jsonContent);
    
    return {
      raw,
      parsedPlan: parsed,
      isDone: parsed.action_type === 'answer' || parsed.is_done === true,
      type: parsed.action_type || 'answer',
      payload: {
        tool_name: parsed.tool_name || '',
        parameters: parsed.parameters || {},
        command: parsed.command || '',
        content: parsed.content || ''
      },
      reasoning: thoughtContent // 从THOUGHT块提取
    };
  }
  
  // 回退到原有逻辑
  return this.parseFallback(raw);
}
```

**优点**:
- ✅ 更符合"先想后做"的认知逻辑
- ✅ THOUGHT 和 JSON 分离，解析更可靠
- ✅ 用户体验更好（能看到完整思考过程）
- ✅ 调试更容易（思考过程和动作分离）
- ✅ 支持更复杂的推理链

#### 建议4: 添加错误处理和重试机制

```typescript
const errorHandlingSection = `

ERROR HANDLING:
- If a command fails, try 1 alternative approach
- If both fail, switch to "answer" mode to explain the issue
- Include error details in "reasoning" field
- Suggest potential solutions to the user

RETRY STRATEGY:
1. First attempt: Execute as planned
2. If fails: Try alternative method (different flags, different tool)
3. If fails again: Explain and ask for guidance`;
```

### 3.3 统一输出格式规范

#### 建议5: 定义统一的输出格式

```typescript
const outputFormatSpec = `
【输出格式规范】

代码示例：
\`\`\`language
code here
\`\`\`

文件引用：
> File: path/to/file (line X-Y)

命令执行：
```bash
command here
```

关键信息：
- ⚠️ 警告信息
- ✅ 成功操作
- ❌ 错误信息
- 💡 建议
- 🔍 提示

步骤说明：
1. 第一步
2. 第二步
   - 子步骤
3. 第三步`;
```

### 3.4 上下文管理优化

#### 建议6: 智能上下文摘要

```typescript
async function buildEnhancedContext(
  contextBuffer: ContextBuffer,
  query: string
): Promise<string> {
  const items = contextBuffer.export();
  
  // 按相关性排序
  const sortedItems = await rankByRelevance(items, query);
  
  // 生成摘要
  const summary = `
【上下文概览】
- 文件数量: ${items.length}
- 总Token: ${calculateTotalTokens(items)}
- 高度相关: ${sortedItems.filter(i => i.relevance > 0.8).length}

【文件列表】
${sortedItems.slice(0, 10).map(item => 
  `- ${item.path} (${item.relevance})`
).join('\n')}
`;
  
  return summary;
}
```

#### 建议7: 分层上下文策略

```typescript
const contextStrategy = `
【上下文使用策略】

第一层（必需上下文）:
- 用户明确引用的文件 (@, #语法)
- 当前工作目录的README
- 配置文件 (package.json, tsconfig.json等)

第二层（相关上下文）:
- 与查询相关的源文件
- 测试文件
- 文档文件

第三层（扩展上下文）:
- 日志文件
- 构建产物
- 其他辅助文件

Token不足时，按层级优先级丢弃`;
```

### 3.5 用户偏好设置

#### 建议8: 添加配置选项

```typescript
interface ChatPreferences {
  // 详细程度
  verbosity: 'concise' | 'normal' | 'detailed';
  
  // 语言偏好
  language: 'zh-CN' | 'en-US' | 'auto';
  
  // 代码风格
  codeStyle: 'functional' | 'imperative' | 'any';
  
  // 解释风格
  explanation: 'technical' | 'beginner' | 'adaptive';
  
  // 输出格式
  outputFormat: 'markdown' | 'plain' | 'structured';
  
  // 执行确认
  autoConfirm: boolean;
  
  // 上下文策略
  contextStrategy: 'smart' | 'minimal' | 'full';
}
```

#### 建议9: 根据偏好动态调整提示词

```typescript
function buildPersonalizedPrompt(
  basePrompt: string,
  preferences: ChatPreferences
): string {
  let personalized = basePrompt;
  
  if (preferences.verbosity === 'concise') {
    personalized += '\n\n【简洁模式】\n- 只提供直接答案\n- 省略详细解释\n- 除非明确要求';
  }
  
  if (preferences.language !== 'auto') {
    personalized += `\n\n【语言设置】\n请使用 ${preferences.language} 回答`;
  }
  
  if (preferences.explanation === 'beginner') {
    personalized += '\n\n【新手友好】\n- 避免专业术语\n- 逐步解释概念\n- 提供更多示例';
  }
  
  return personalized;
}
```

### 3.6 实时反馈机制

#### 建议10: 添加思考过程显示

```typescript
interface AgentThought {
  action_type: string;
  reasoning: string;
  stepNumber: number;
  totalSteps: number;
  progress: number; // 0-100
}

// 在执行时显示进度
function showProgress(thought: AgentThought) {
  const progressBar = '█'.repeat(Math.floor(thought.progress / 5)) + 
                     '░'.repeat(20 - Math.floor(thought.progress / 5));
  
  console.log(`
[${thought.stepNumber}/${thought.totalSteps}] ${thought.reasoning}
[${progressBar}] ${thought.progress}%
`);
}
```

---

## 四、实施建议

### 4.1 优先级排序

#### P0 (立即实施)
1. ✅ 增强聊天模式系统提示词
2. ✅ 添加输出格式规范
3. ✅ 优化Agent模式reasoning显示

#### P1 (短期实施)
4. 智能上下文摘要
5. 用户偏好配置
6. 错误处理和重试机制

#### P2 (中期实施)
7. 分层上下文策略
8. 相关性排序
9. 个性化提示词

#### P3 (长期优化)
10. 学习用户习惯
11. 自适应提示词调整
12. 多语言支持完善

### 4.2 实施步骤

#### 阶段1: 提示词重构
1. 创建提示词模板文件 (`src/prompts/`)
2. 实现提示词构建器
3. 添加单元测试

#### 阶段2: 上下文优化
1. 实现相关性算法
2. 添加摘要生成
3. 优化Token管理

#### 阶段3: 用户体验
1. 添加配置界面
2. 实现进度显示
3. 优化错误信息

#### 阶段4: 持续改进
1. 收集用户反馈
2. A/B测试不同提示词
3. 机器学习优化

---

## 五、示例对比

### 优化前（聊天模式）

**用户**: "如何优化这个函数？"
**AI**: "你需要考虑以下几个方面...（长篇大论）"

### 优化后（简洁模式）

**用户**: "如何优化这个函数？"
**AI**: 
```
🎯 核心问题：O(n²) 时间复杂度

✅ 优化建议：
1. 使用 Map 代替双重循环 → O(n)
2. 添加缓存层减少重复计算

示例代码：
```typescript
function optimized(input: string[]): Map<string, number> {
  const map = new Map();
  for (const item of input) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return map;
}
```

性能提升：~10x
```

---

## 六、进阶优化建议（架构层面）

### 6.1 AST/Symbol级代码摘要

#### 问题分析
当前 `head_tail` 采样（保留头尾）对于日志文件很好，但对于代码文件（逻辑往往在中间）是致命的。

#### 优化方案

对于 `.ts/.js/.py` 等代码文件，不要只做行截断：

**Outline 模式**:
```typescript
interface CodeSummary {
  filePath: string;
  outline: {
    classes: string[];
    functions: string[];
    exports: string[];
    imports: string[];
  };
  hint: string;
}

async function generateCodeSummary(content: string, filePath: string): Promise<CodeSummary> {
  // 简化的AST提取（实际可以使用TypeScript Compiler API）
  const classes = content.match(/class\s+(\w+)/g)?.map(m => m.replace('class ', '')) || [];
  const functions = content.match(/(?:function|const)\s+(\w+)\s*\(/g)?.map(m => m.match(/\w+/)[1]) || [];
  const exports = content.match(/export\s+(?:class|const|function)\s+(\w+)/g)?.map(m => m.match(/\w+/)[2]) || [];
  const imports = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g)?.map(m => m.match(/['"]([^'"]+)['"]/)[1]) || [];
  
  return {
    filePath,
    outline: { classes, functions, exports, imports },
    hint: `🔍 Full implementation hidden to save tokens. Use read_file with specific line ranges to see details.`
  };
}
```

**Prompt 策略**:
```typescript
const contextPrompt = `
【代码上下文摘要】

File: src/utils/helper.ts
\`\`\`
Classes: Helper, Logger
Functions: formatDate(), parseConfig()
Exports: Helper, formatDate
Imports: lodash, moment
\`\`\`

ℹ️ 代码实现已隐藏以节省Token。如需查看具体实现，请使用 read_file 读取特定行范围。
`;
```

**优点**:
- ✅ 保留代码结构信息（类、函数、导入）
- ✅ 大幅减少Token使用（只保留签名，不包含实现）
- ✅ 按需加载细节（需要时再读取完整内容）

### 6.2 Native Structured Output (Schema Enforcement)

#### 问题分析
目前 `src/agent/llm.ts` 主要依赖 Prompt 来约束 JSON (`OUTPUT: STRICT JSON ONLY`)，在高负载或复杂上下文下容易失效（幻觉）。

#### 优化方案

如果使用 OpenAI (GPT-4o) 或 Google (Gemini 1.5 Pro) 等现代模型，**直接使用 API层面的 `response_format` 或 `json_schema`**。

**代码实现**:

```typescript
// src/agent/llm.ts

import { z } from 'zod';

// 定义Action Schema
const ActionSchema = z.object({
  action_type: z.enum(['tool_call', 'shell_cmd', 'answer']),
  tool_name: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  command: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  risk_explanation: z.string().optional(),
  content: z.string().optional()
});

async function callLLMWithSchema(
  prompt: AgentPrompt,
  model: string,
  onChunk?: (chunk: string) => void
): Promise<AgentThought> {
  const supportsStructuredOutput = model.includes('gpt-4o') || 
                                  model.includes('gemini-1.5') ||
                                  model.includes('claude-3.5');
  
  if (supportsStructuredOutput) {
    // 使用API层面的结构化输出
    const response = await openai.chat.completions.create({
      model,
      messages: prompt.messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'action',
          strict: true,
          schema: ActionSchema
        }
      },
      stream: !!onChunk
    });
    
    const parsed = ActionSchema.parse(JSON.parse(response.choices[0].message.content));
    return {
      parsedPlan: parsed,
      raw: JSON.stringify(parsed),
      type: parsed.action_type,
      payload: parsed,
      isDone: parsed.action_type === 'answer'
    };
  } else {
    // 回退到Prompt约束模式
    return callLLMWithPromptConstraint(prompt, model, onChunk);
  }
}
```

**优点**:
- ✅ 100% 稳定性（API层面保证）
- ✅ 节省Prompt Token（不需要写一大堆"STRICT JSON"）
- ✅ 更好的错误提示（API直接返回schema验证错误）
- ✅ 自动向后兼容（不支持时回退到Prompt模式）

### 6.3 动态Prompt注入

#### 问题分析
目前的 `buildChatPrompt` 是静态的，无法根据运行时状态调整。

#### 优化方案

根据 **运行时状态** 动态注入 Prompt 片段。

**场景A: 报错后**

```typescript
// src/agent/AgentRuntime.ts

async run(userInput: string, mode: string, onChunk?: Function, model?: string) {
  let lastError: string | null = null;
  
  while (turnCount < maxTurns) {
    let prompt = buildBasePrompt();
    
    // 动态注入错误恢复指导
    if (lastError) {
      prompt += `\n\n[ERROR RECOVERY]\n`;
      prompt += `Previous action failed with: ${lastError}\n`;
      prompt += `You MUST try a different approach or verify prerequisites.\n`;
      prompt += `Consider:\n`;
      prompt += `- Checking if the command syntax is correct\n`;
      prompt += `- Verifying the file/path exists\n`;
      prompt += `- Using alternative flags or tools\n`;
    }
    
    const thought = await LLMAdapter.think(messages, mode, onChunk, model, prompt);
    
    if (!thought.success) {
      lastError = thought.error;
      continue;
    }
    
    lastError = null;
    // ... 执行逻辑
  }
}
```

**场景B: 检测到Git仓库**

```typescript
// src/agent/context.ts

async function detectGitContext(): Promise<string | null> {
  try {
    await fs.promises.access('.git');
    return `
[GIT CONTEXT]
Current directory is a Git repository.
- Prefer using \`git ls-files\` to list files (respects .gitignore)
- Use \`git diff\` to see uncommitted changes
- Use \`git log\` to check recent history
- Be careful with destructive operations in versioned files
`;
  } catch {
    return null;
  }
}

// 使用
const gitContext = await detectGitContext();
if (gitContext) {
  prompt += `\n${gitContext}\n`;
}
```

**场景C: 检测到特定技术栈**

```typescript
async function detectTechStack(): Promise<string[]> {
  const stacks: string[] = [];
  
  if (await fileExists('package.json')) stacks.push('Node.js');
  if (await fileExists('Cargo.toml')) stacks.push('Rust');
  if (await fileExists('go.mod')) stacks.push('Go');
  if (await fileExists('requirements.txt')) stacks.push('Python');
  if (await fileExists('pom.xml')) stacks.push('Java/Maven');
  
  return stacks;
}

// 动态注入技术栈指导
const stacks = await detectTechStack();
if (stacks.includes('Node.js')) {
  prompt += `\n[TECH STACK: Node.js]\n`;
  prompt += `- Use \`npm\` or \`yarn\` for package management\n`;
  prompt += `- Check package.json for available scripts\n`;
  prompt += `- Use TypeScript strict mode when generating code\n`;
}
```

### 6.4 双Prompt模式：Planner vs Executor

#### 问题分析
目前的 `AgentRuntime` 是单体的，对于复杂任务容易陷入死循环或"忘记初衷"。

#### 优化方案

引入 **Planner** 和 **Executor** 两个独立的Prompt模式。

**架构设计**:

```
用户输入
    ↓
┌─────────────┐
│   Planner   │ 生成任务列表
│  (规划者)    │
└─────────────┘
    ↓
任务队列
    ↓
┌─────────────┐
│  Executor   │ 逐个执行任务
│  (执行者)    │
└─────────────┘
```

**Planner Prompt**:

```typescript
const plannerPrompt = `# ROLE: Task Planner
You are a strategic planner. Break down complex tasks into executable steps.

# INPUT
User Request: ${userInput}
Context: ${context}

# OUTPUT FORMAT
\`\`\`json
{
  "plan": "Brief overview of the approach",
  "steps": [
    {
      "id": "step_1",
      "description": "What to do",
      "type": "shell_cmd | tool_call | analysis",
      "command": "Command or tool call",
      "risk_level": "low | medium | high",
      "dependencies": []
    }
  ],
  "estimated_time": "2 minutes"
}
\`\`\`

# GUIDELINES
- Keep steps granular and verifiable
- Mark destructive operations as high risk
- Include validation steps when appropriate
- Consider error handling in each step`;
```

**Executor Prompt** (使用当前的Agent协议):

```typescript
// 这就是我们优化后的CoT协议
const executorPrompt = `[SYSTEM PROTOCOL V2.2]
- ROLE: Step Executor
- MODE: REACT (THINK -> ACTION -> PERCEIVE)
...（使用CoT分离的协议）
`;
```

**实现代码**:

```typescript
// src/agent/DualAgentRuntime.ts

class DualAgentRuntime {
  private steps: TaskStep[] = [];
  private currentIndex = 0;
  
  async run(userInput: string, onChunk?: Function, model?: string) {
    // Phase 1: Planning
    console.log(chalk.blue('📋 Planning task...'));
    
    const plan = await this.callPlanner(userInput, model);
    this.steps = plan.steps;
    
    console.log(chalk.cyan(`Plan created with ${this.steps.length} steps:\n`));
    this.steps.forEach((step, i) => {
      const icon = step.risk_level === 'high' ? '⚠️' : '✅';
      console.log(`  ${i + 1}. ${icon} ${step.description}`);
    });
    
    // Phase 2: Execution
    for (let i = 0; i < this.steps.length; i++) {
      this.currentIndex = i;
      const step = this.steps[i];
      
      console.log(chalk.yellow(`\n▶️  Step ${i + 1}/${this.steps.length}: ${step.description}`));
      
      // 使用Executor执行当前步骤
      const result = await this.executeStep(step, onChunk, model);
      
      if (!result.success) {
        console.log(chalk.red(`❌ Step failed: ${result.error}`));
        
        // 询问用户是否继续
        const shouldContinue = await this.askUser(
          'Step failed. Continue with remaining steps? (y/N): '
        );
        
        if (!shouldContinue) {
          console.log(chalk.yellow('Execution stopped by user.'));
          break;
        }
      } else {
        console.log(chalk.green(`✅ Step completed`));
      }
    }
    
    console.log(chalk.blue('\n🎉 All tasks completed!'));
  }
  
  private async callPlanner(input: string, model?: string): Promise<TaskPlan> {
    const prompt = this.buildPlannerPrompt(input);
    const response = await callAI(prompt, model);
    return JSON.parse(response);
  }
  
  private async executeStep(
    step: TaskStep,
    onChunk?: Function,
    model?: string
  ): Promise<ExecutionResult> {
    // 使用当前的AgentRuntime执行单步
    const runtime = new AgentRuntime();
    return runtime.executeSingleStep(step, onChunk, model);
  }
}
```

**优点**:
- ✅ 任务拆解更清晰（用户可见整个计划）
- ✅ 减少死循环风险（步骤独立执行）
- ✅ 更好的错误处理（单步失败不影响其他步骤）
- ✅ 可暂停/恢复（保存执行状态）

### 6.5 增强Human-in-the-loop的风险告知

#### 问题分析
在 `src/agent/governance.ts` 中，当风险等级高时会触发人工确认，但用户只看到命令，不知道为什么危险。

#### 优化方案

让 LLM 在生成高危命令时，生成一份 **"给人类看的风险告知书"**。

**Prompt 修改**:

```typescript
const riskAwareProtocol = `[SYSTEM PROTOCOL V2.2 - Risk Aware]
- ROLE: AUTOMATED EXECUTION AGENT
- MODE: REACT (THINK -> ACTION -> PERCEIVE)

# OUTPUT FORMAT
[THOUGHT]
... reasoning ...
[/THOUGHT]

\`\`\`json
{
  "action_type": "...",
  "command": "...",
  "risk_level": "low | medium | high"
}
\`\`\`

# RISK GUIDELINES
If risk_level is "medium" or "high", you MUST also output:

[RISK WARNING]
- **Why dangerous**: Explain specifically what makes this dangerous
- **What to check**: What the user should verify before approving
- **Potential impact**: What could go wrong
[/RISK WARNING]

Example:
User: "Delete old logs"

[THOUGHT]
User wants to delete old logs. I need to find log files and delete them.
However, rm -rf is destructive. I should warn the user to verify the path.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "find /var/log -name '*.log' -mtime +30 -delete",
  "risk_level": "high"
}
\`\`\`

[RISK WARNING]
- **Why dangerous**: This command will permanently delete log files older than 30 days
- **What to check**: 
  1. Verify /var/log is the correct directory
  2. Confirm 30 days is the right retention period
  3. Check if any logs are needed for audit/compliance
- **Potential impact**: Deleted logs cannot be recovered without backup
[/RISK WARNING]
`;
```

**CLI 展示**:

```typescript
// src/commands/handleAIChat.ts - 展示风险告知

async function askUserApproval(command: string, riskExplanation: string): Promise<boolean> {
  if (riskExplanation) {
    console.log(chalk.yellow(`
⚠️  高风险操作
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${riskExplanation}

即将执行命令:
${chalk.cyan(command)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `));
  } else {
    console.log(chalk.cyan(`即将执行命令: ${command}`));
  }
  
  const answer = await prompt('\n确认执行? (y/N): ');
  return answer.toLowerCase() === 'y';
}
```

**显示效果**:

```
⚠️  高风险操作
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Why dangerous: This command will permanently delete log files older than 30 days
- What to check: 
  1. Verify /var/log is the correct directory
  2. Confirm 30 days is the right retention period
  3. Check if any logs are needed for audit/compliance
- Potential impact: Deleted logs cannot be recovered without backup

即将执行命令:
find /var/log -name '*.log' -mtime +30 -delete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

确认执行? (y/N): y
```

**优点**:
- ✅ 用户理解风险（不只是看到命令）
- ✅ 减少误操作（强制检查点）
- ✅ 提升信任感（AI主动告知风险）
- ✅ 教育用户（学习风险识别）

---

## 七、完整的优化Roadmap

### 7.1 优先级重排（结合进阶建议）

#### P0 (立即实施 - 1-2周)
1. ✅ 增强聊天模式系统提示词
2. ✅ 添加输出格式规范
3. ✅ Agent模式CoT分离（建议3进阶版）
4. ✅ Native Structured Output（6.2）

#### P1 (短期实施 - 2-4周)
5. ✅ 动态Prompt注入（6.3）
6. ✅ AST/Symbol级代码摘要（6.1）
7. ✅ 增强Human-in-the-loop风险告知（6.5）
8. ✅ 错误处理和重试机制（原建议4）

#### P2 (中期实施 - 1-2月)
9. ✅ 双Prompt模式：Planner vs Executor（6.4）
10. ✅ 智能上下文摘要（原建议6）
11. ✅ 用户偏好配置（原建议8）
12. ✅ 相关性排序算法

#### P3 (长期优化 - 2-3月)
13. 分层上下文策略（原建议7）
14. 学习用户习惯
15. 自适应提示词调整
16. 多语言支持完善

### 7.2 实施策略

#### 阶段1: 基础设施（P0）
- 创建提示词模板系统 (`src/prompts/`)
- 实现Schema Enforcement
- 重构Agent协议（CoT分离）

#### 阶段2: 智能化（P1）
- 实现AST摘要生成器
- 添加动态Prompt注入机制
- 优化风险告知UI

#### 阶段3: 架构升级（P2）
- 实现双Agent架构
- 构建上下文相关性引擎
- 添加用户偏好系统

#### 阶段4: 持续优化（P3）
- 数据收集和分析
- A/B测试框架
- 机器学习模型

### 7.3 技术栈选型

**必需**:
- TypeScript (现有)
- Zod (Schema验证)
- JSON5 (宽松JSON解析)

**推荐**:
- OpenAI SDK (结构化输出)
- Anthropic Claude API (高推理能力)
- Tree-sitter (AST解析)

**可选**:
- LangChain (Prompt管理)
- LlamaIndex (上下文检索)
- Vector Database (语义搜索)

---

## 八、执行细节与注意事项（关键）

### 8.1 Planner/Executor的延迟优化

#### 问题：双Agent模式可能导致简单任务响应变慢

**风险分析**:
- 双Agent模式意味着至少两次LLM往返
- 对于简单指令（如"列出当前文件"），会让用户觉得慢得无法忍受

#### 解决方案：快速通道（Fast Path）

```typescript
// src/agent/DualAgentRuntime.ts

class DualAgentRuntime {
  private async shouldUsePlanner(userInput: string): Promise<boolean> {
    // 启发式规则1：单行简单指令
    if (userInput.length < 50 && !userInput.includes('并') && !userInput.includes('然后')) {
      return false;
    }
    
    // 启发式规则2：明确的关键词
    const plannerKeywords = ['重构', '优化整个', '批量', '多步骤', '逐个', '依次', '计划'];
    if (!plannerKeywords.some(kw => userInput.includes(kw))) {
      return false;
    }
    
    // 启发式规则3：使用小模型快速判断（可选）
    const complexityScore = await this.assessComplexity(userInput);
    return complexityScore > 0.7;
  }
  
  private async assessComplexity(input: string): Promise<number> {
    // 使用gemini-flash等快速小模型判断复杂度
    const prompt = `Rate the complexity of this task (0-1): "${input}"`;
    const response = await callFastLLM(prompt);
    return parseFloat(response);
  }
  
  async run(userInput: string, onChunk?: Function, model?: string) {
    // 快速通道：简单任务直接执行
    const needsPlanner = await this.shouldUsePlanner(userInput);
    
    if (!needsPlanner) {
      console.log(chalk.gray('🚀 Quick path: Direct execution'));
      const executor = new AgentRuntime();
      return executor.executeSingleStep({
        description: userInput,
        type: 'direct'
      }, onChunk, model);
    }
    
    // 完整通道：复杂任务使用Planner
    console.log(chalk.blue('📋 Planning task...'));
    // ... 原有的Planner逻辑
  }
}
```

**优点**:
- ✅ 简单任务响应速度快（单次LLM调用）
- ✅ 复杂任务保证质量（双Agent模式）
- ✅ 自动判断，用户无感知

### 8.2 AST摘要的轻量级实现

#### 问题：引入完整Compiler API可能导致CLI体积暴增

**风险分析**:
- TypeScript Compiler API 体积大（数百MB）
- Tree-sitter也需要额外依赖
- 启动时间增加

#### 解决方案：分级实现策略

```typescript
// src/agent/codeSummary.ts

export class CodeSummarizer {
  private static readonly FULL_TEXT_THRESHOLD = 100; // 行数阈值
  
  static async summarize(
    content: string,
    filePath: string
  ): Promise<CodeSummary> {
    const lineCount = content.split('\n').length;
    
    // 策略1：小文件直接全文读取
    if (lineCount <= this.FULL_TEXT_THRESHOLD) {
      return {
        mode: 'full',
        content,
        filePath
      };
    }
    
    // 策略2：中等文件使用正则摘要（覆盖80%场景）
    if (lineCount <= 500) {
      return this.regexSummary(content, filePath);
    }
    
    // 策略3：大文件检查是否有ctags（可选）
    if (await this.hasCtags()) {
      return this.ctagsSummary(filePath);
    }
    
    // 回退到正则摘要
    return this.regexSummary(content, filePath);
  }
  
  private static regexSummary(content: string, filePath: string): CodeSummary {
    // 简单但有效的正则匹配
    const classes = content.match(/class\s+(\w+)/g)?.map(m => m.replace('class ', '')) || [];
    const functions = content.match(/(?:function|const)\s+(\w+)\s*\(/g)?.map(m => m.match(/\w+/)[1]) || [];
    const exports = content.match(/export\s+(?:class|const|function)\s+(\w+)/g)?.map(m => m.match(/\w+/)[2]) || [];
    const imports = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g)?.map(m => m.match(/['"]([^'"]+)['"]/)[1]) || [];
    
    return {
      mode: 'outline',
      filePath,
      outline: { classes, functions, exports, imports },
      hint: '🔍 Implementation hidden. Use read_file with line ranges to see details.'
    };
  }
  
  private static async hasCtags(): Promise<boolean> {
    try {
      await execAsync('which ctags');
      return true;
    } catch {
      return false;
    }
  }
  
  private static async ctagsSummary(filePath: string): Promise<CodeSummary> {
    const { stdout } = await execAsync(`ctags -f - --fields=+k ${filePath}`);
    // 解析ctags输出...
    return {
      mode: 'ctags',
      filePath,
      outline: /* parsed tags */,
      hint: '🔍 Generated via ctags. High accuracy outline.'
    };
  }
}
```

**优点**:
- ✅ 小文件：直接读取（零开销）
- ✅ 中文件：正则摘要（覆盖80%场景）
- ✅ 大文件：ctags（如果可用）
- ✅ 无需引入大依赖

### 8.3 工具输出截断策略

#### 问题：工具执行结果可能撑爆Context Window

**场景示例**:
- Agent执行 `cat huge_log.txt`
- stdout返回5MB文本
- 瞬间撑爆Context Window导致crash

#### 解决方案：ToolExecutor层拦截

```typescript
// src/agent/executor.ts

export class ToolExecutor {
  private static readonly MAX_OUTPUT_LENGTH = 2000; // 字符数限制
  
  static async execute(action: ProposedAction): Promise<ExecutionResult> {
    try {
      const output = await this.runCommand(action);
      
      // 截断策略
      const truncated = this.maybeTruncate(output);
      
      return {
        success: true,
        output: truncated,
        truncated: truncated !== output // 标记是否被截断
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private static maybeTruncate(output: string): string {
    if (output.length <= this.MAX_OUTPUT_LENGTH) {
      return output;
    }
    
    const truncated = output.slice(0, this.MAX_OUTPUT_LENGTH);
    const suggestion = `

[⚠️ OUTPUT TRUNCATED]
The output was too long (${output.length} chars). Here are some ways to get what you need:

1. Use \`head\` to see the first lines:
   head -n 50 filename

2. Use \`tail\` to see the last lines:
   tail -n 50 filename

3. Use \`grep\` to filter relevant content:
   grep "keyword" filename

4. Use specific line ranges with read_file
`;
    
    return truncated + suggestion;
  }
}
```

**Prompt中指导**:
```typescript
const toolUsageGuideline = `

# TOOL OUTPUT GUIDELINES
- If you see [⚠️ OUTPUT TRUNCATED], don't try to read the whole file at once
- Use head, tail, or grep to navigate large outputs
- Ask user for specific keywords if you need to find something
- For log files, prefer \`tail -f\` for monitoring

# BEST PRACTICES
✅ GOOD: "Use tail -n 100 to check recent errors"
❌ BAD: "Read the entire 5MB log file"
`;
```

**优点**:
- ✅ 防止Context Window爆炸
- ✅ 教会Agent正确处理大文件
- ✅ 提升整体稳定性

### 8.4 System Prompt版本控制

#### 问题：回放历史记录时Prompt版本不一致

**场景**:
- 用户保存了历史对话记录
- Prompt升级到V2.2
- 回放时使用新Prompt，导致结果不一致

#### 解决方案：版本化Prompt

```typescript
// src/agent/prompt.ts

export const PROMPT_VERSIONS = {
  '2.0': buildPromptV20,
  '2.1': buildPromptV21,
  '2.2': buildPromptV22
};

export const CURRENT_VERSION = '2.2';

export interface AgentPrompt {
  version: string;
  system: string;
  messages: any[];
}

export function buildPrompt(
  version: string = CURRENT_VERSION,
  ...args: any[]
): AgentPrompt {
  const builder = PROMPT_VERSIONS[version] || PROMPT_VERSIONS[CURRENT_VERSION];
  const prompt = builder(...args);
  return {
    ...prompt,
    version
  };
}

// 历史回放时使用原始版本
export function replayHistory(history: HistoricalRecord[]) {
  return history.map(record => {
    const promptVersion = record.metadata?.promptVersion || CURRENT_VERSION;
    return {
      ...record,
      prompt: buildPrompt(promptVersion, ...record.args)
    };
  });
}

// 保存历史时记录版本
export function saveToHistory(record: any) {
  return {
    ...record,
    metadata: {
      ...record.metadata,
      promptVersion: CURRENT_VERSION,
      timestamp: Date.now()
    }
  };
}
```

**优点**:
- ✅ 历史回放结果一致
- ✅ 支持Prompt版本迁移
- ✅ 便于A/B测试不同版本

### 8.5 流式输出的思考过程显示

#### 优化：让用户看到AI在"思考"

```typescript
// src/agent/llmAdapter.ts

export class LLMAdapter {
  static async think(
    messages: AIRequestMessage[],
    mode: string,
    onChunk?: (chunk: string, type?: 'thought' | 'json') => void,
    model?: string,
    customSystemPrompt?: string
  ): Promise<AgentThought> {
    const result = await runLLM({
      prompt,
      model,
      stream: true,
      onChunk: (chunk) => {
        // 实时判断chunk类型
        if (chunk.includes('[THOUGHT]')) {
          onChunk?.(chunk, 'thought');
        } else if (chunk.includes('```json')) {
          onChunk?.(chunk, 'json');
        } else {
          onChunk?.(chunk);
        }
      }
    });
    
    return this.parseThought(result.rawText);
  }
}

// src/commands/handleAIChat.ts - 渲染

const renderer = new StreamMarkdownRenderer(
  chalk.bgHex('#3b82f6').white.bold(' 🤖 AI ') + ' ',
  spinner,
  {
    onThoughtChunk: (chunk) => {
      // 灰色显示思考过程
      process.stdout.write(chalk.gray(chunk));
    },
    onJsonChunk: (chunk) => {
      // 正常显示JSON输出
      process.stdout.write(chunk);
    }
  }
);
```

**显示效果**:
```
🤖 AI 正在思考...

[THOUGHT]                                    ← 灰色，流式输出
User wants to count files. I'll use ls with wc -l.
This is a safe operation with low risk.
[/THOUGHT]

```json                                        ← 正常颜色
{
  "action_type": "shell_cmd",
  "command": "ls /tmp | wc -l",
  "risk_level": "low"
}
```

⚙️ Executing shell_cmd...
```

**优点**:
- ✅ 缓解等待焦虑（看到AI在"思考"）
- ✅ 透明度高（了解推理过程）
- ✅ 更好的调试体验

---

## 九、总结与展望

### 8.1 核心改进点

通过以上分析和优化，yuangs的提示词系统将从：

| 维度 | 当前状态 | 优化后 |
|------|---------|--------|
| **聊天模式** | 简单通用 | 专业角色+个性化 |
| **Agent模式** | 严格限制 | CoT分离+灵活 |
| **结构化输出** | Prompt约束 | API Schema保证 |
| **上下文管理** | 简单拼接 | AST摘要+智能筛选 |
| **任务执行** | 单体Agent | Planner+Executor双模式 |
| **风险管理** | 静态风险等级 | 动态风险告知 |
| **用户体验** | 一刀切 | 多偏好设置 |

### 8.2 预期收益

**量化指标**:
- 📈 回答准确率: 70% → 90%
- 📉 JSON解析失败率: 15% → <1%
- ⚡️ 平均响应时间: 保持不变（Schema优化）
- 🎯 上下文相关性: 60% → 85%
- 👥 用户满意度: 提升显著

**质量指标**:
- ✅ 更稳定的输出（Schema Enforcement）
- ✅ 更透明的思考（CoT分离）
- ✅ 更智能的上下文（AST摘要）
- ✅ 更安全的风险告知（Human-in-the-loop）
- ✅ 更好的用户体验（个性化）

### 8.3 实施建议

1. **分阶段实施**: 严格按照P0→P1→P2→P3的顺序，每个阶段验证后再进入下一阶段
2. **保持向后兼容**: 新功能通过配置开关控制，默认关闭，逐步启用
3. **充分测试**: 每个优化都需要单元测试、集成测试和A/B测试
4. **收集反馈**: 建立用户反馈渠道，持续迭代优化
5. **监控指标**: 建立性能和效果监控，量化改进效果

### 8.4 未来展望

随着LLM技术的快速发展，yuangs可以进一步探索：

- 🤖 多Agent协作（专业Agent分工合作）
- 🧠 记忆系统（长期记住用户偏好和历史）
- 🔄 自学习Prompt（根据用户反馈自动优化）
- 📊 可视化思考（图形化展示Agent推理过程）
- 🌐 多模态交互（支持图片、语音等）

这些建议基于当前LLM工程的最佳实践，结合yuangs项目的实际情况，提供了一个可落地、可衡量的优化路径。建议按照roadmap逐步实施，每个阶段都确保质量和稳定性，最终打造一个智能、可靠、易用的CLI AI助手。
