这是一次非常扎实且全面的升级！你不仅解决了之前的 Markdown 渲染问题，还引入了完整的 **Agent 架构**、**Shell 补全系统** 和 **技能学习机制**。

以下是对你代码的详细 Code Review，涵盖了你的优化点、架构亮点以及发现的几个潜在问题（特别是技能持久化方面）。

### 1. Markdown 流式渲染优化 (✅ 已解决)

你采用了 **“先输出 Raw 文本，流结束后回滚并替换为 Markdown”** 的策略。

**文件:** `src/commands/handleAIChat.ts`

**评价：**
这是 CLI 工具中最稳健的策略。相比于实时渲染部分 Markdown（容易导致格式错乱），这种“最终一致性”的方案体验最好。

*   **优点**：
    *   用户能立即看到响应（低延迟）。
    *   最终结果格式完美，支持语法高亮。
    *   `getVisualLineCount` 考虑了 ANSI 颜色代码和宽字符（中文字符），计算行高非常准确。
*   **代码细节**：
    ```typescript
    // TTY 模式下的回滚逻辑
    process.stdout.write('\r\x1b[K'); // 清除当前行
    for (let i = 0; i < lineCount - 1; i++) {
        process.stdout.write('\x1b[A\x1b[K'); // 上移一行并清除
    }
    ```
    这段逻辑写得很标准。

### 2. 新增 Agent 架构 (🌟 亮点)

你引入了 `src/agent/` 目录，实现了从简单的“问答”向“自主代理”的转变。

*   **Pipeline 设计 (`AgentPipeline.ts`)**:
    *   流程清晰：`Intent -> Context -> Prompt -> Model -> LLM -> Plan -> Execute -> Learn`。
    *   这是一个非常标准的现代 AI Agent 模式。
*   **规划与执行 (`plan.ts`, `planExecutor.ts`)**:
    *   将 AI 的输出解析为结构化的 `AgentTask`。
    *   支持任务依赖（`dependsOn`），为未来处理复杂多步任务（如：先 `grep` 查找文件，再 `sed` 修改）打下了基础。
*   **技能学习系统 (`skills.ts`)**:
    *   **Concept**: 引入了“成功率”、“新鲜度”、“置信度”的评分算法，非常先进。
    *   **Reaper**: 还有 `reapColdSkills` 机制自动淘汰低分技能，防止上下文膨胀。

### 3. Shell 增强功能 (✨ UX 提升)

**文件:** `src/commands/shellCompletions.ts`

*   **Ghost Text**: 实现了类似 `zsh-autosuggestions` 或 `fish` 的灰色预判文本（`predictGhostText`），极大地提升了交互时的专业感。
*   **智能补全**:
    *   支持 `@` 文件补全。
    *   支持 `#` 目录补全。
    *   支持 `git` 子命令补全。
    *   甚至支持从 `$PATH` 加载系统命令。

---

### ⚠️ 关键问题与修复建议

虽然架构很棒，但我发现了几个需要注意的问题，建议修复：

#### 1. 技能库未持久化 (Critical)

在 `src/agent/skills.ts` 中：
```typescript
let skillLibrary: Skill[] = []; // 仅仅是内存变量
```
你实现了非常棒的技能评分和淘汰机制，**但是**，`skillLibrary` 目前只存在于内存中。一旦 CLI 进程结束（用户退出），所有学习到的技能都会丢失。

**建议修复：**
仿照 `src/core/macros.ts` 或 `src/utils/history.ts`，添加 `loadSkills` 和 `saveSkills`。

```typescript
// src/agent/skills.ts 修改建议
import fs from 'fs';
import path from 'path';
import os from 'os';

const SKILLS_FILE = path.join(os.homedir(), '.yuangs_skills.json');

// 初始化时加载
try {
    if (fs.existsSync(SKILLS_FILE)) {
        skillLibrary = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf-8'));
    }
} catch (e) {}

function saveSkillsToDisk() {
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(skillLibrary, null, 2));
}

// 在 learnSkillFromRecord 和 reapColdSkills 末尾调用 saveSkillsToDisk()
```

#### 2. `AgentPipeline` 上下文单例问题

在 `src/agent/context.ts` 中：
```typescript
const globalContextBuffer = new ContextBuffer();
```
作为一个 CLI 工具，这是完全没问题的（因为是单用户单进程）。但如果未来你想把这个核心逻辑复用到 Server 端或者 VSCode 插件中，这个全局单例会造成状态污染。

**建议：** 将 ContextBuffer 作为 `AgentPipeline` 实例的成员变量，而不是模块级的全局变量。不过对于目前的 CLI `yuangs` 来说，现状是可以接受的。

#### 3. Agent 模式下的流式输出

在 `src/agent/AgentPipeline.ts` 中：
```typescript
// 5. LLM Execution
const result = await runLLM({
    // ...
    onChunk: mode === 'chat'
        ? (s) => process.stdout.write(s)
        : undefined,
});
```
如果 `mode === 'chat'`，你直接使用了 `process.stdout.write(s)`。这意味着 Agent 模式下，Markdown 的**渲染回滚优化**（你在 `handleAIChat.ts` 里做的那个）**没有生效**。

**建议：**
`AgentPipeline` 应该返回流或者 EventEmitter，让调用层（UI层）去决定如何渲染。或者将 `handleAIChat.ts` 中的渲染逻辑封装成一个通用的 `StreamingRenderer` 类，在 AgentPipeline 里调用。

#### 4. `package.json` 的 `files` 字段

```json
"files": [
  "dist"
]
```
你的 `verify.sh` 脚本里检查了是否包含 `src/`。目前的配置是正确的，只发布 `dist`。这很好。

### 总结

代码质量非常高，架构从单纯的“命令生成器”进化为了一个“具备即时学习能力的 Agent”。

**下一步行动清单：**

1.  **实现 `skills.ts` 的 JSON 文件读写**（最重要，否则 Agent 无法真正“学习”）。
2.  考虑将 `handleAIChat.ts` 中优秀的 Markdown 渲染逻辑抽取出来，让 `AgentPipeline` 的 Chat 模式也能享受到这个优化。
3.  运行 `npm run verify` 确保一切正常，然后发布！

非常棒的工作！💯这是针对你要求的完整代码实现方案。

### 1. 新增：`src/utils/renderer.ts`
我们将 Markdown 流式渲染逻辑抽离为一个独立的工具类，供 `handleAIChat` 和 `AgentPipeline` 复用。

```typescript
import chalk from 'chalk';
import * as marked from 'marked';
import TerminalRenderer from 'marked-terminal';
import ora from 'ora';

// 初始化 marked 配置
marked.setOptions({
    renderer: new TerminalRenderer({
        tab: 2,
        width: process.stdout.columns || 80,
        showSectionPrefix: false
    }) as any
});

export class StreamMarkdownRenderer {
    private fullResponse: string = '';
    private prefix: string;
    private isFirstOutput: boolean = true;
    private spinner: ora.Ora | null = null;
    private startTime: number;

    constructor(prefix: string = chalk.bold.blue('🤖 AI：'), spinner?: ora.Ora) {
        this.prefix = prefix;
        this.spinner = spinner || null;
        this.startTime = Date.now();
    }

    /**
     * 处理流式数据块
     */
    public onChunk(chunk: string) {
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }

        if (this.isFirstOutput) {
            process.stdout.write(this.prefix);
            this.isFirstOutput = false;
        }

        this.fullResponse += chunk;
        process.stdout.write(chunk);
    }

    /**
     * 流结束，执行回滚并渲染 Markdown
     */
    public finish(): string {
        // 如果 Spinner 还在转（说明没有任何输出），先停掉
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }

        const formatted = (marked.parse(this.fullResponse, { async: false }) as string).trim();

        if (process.stdout.isTTY && this.fullResponse.trim()) {
            const screenWidth = process.stdout.columns || 80;
            const totalContent = this.prefix + this.fullResponse;
            
            // 计算原始文本占用的可视行数
            const lineCount = this.getVisualLineCount(totalContent, screenWidth);

            // 1. 清除当前行剩余内容
            process.stdout.write('\r\x1b[K');
            // 2. 向上回滚并清除之前的行
            for (let i = 0; i < lineCount - 1; i++) {
                process.stdout.write('\x1b[A\x1b[K');
            }

            // 3. 输出格式化后的 Markdown
            process.stdout.write(this.prefix + formatted + '\n');
        } else {
            // 非 TTY 模式或无内容，直接补充换行（如果之前输出了内容）
            if (this.fullResponse.trim()) {
                // 如果没有 TTY 能力，无法回滚，只能在最后追加换行，
                // 或者我们可以选择不回滚，直接就这样展示（但没有高亮）。
                // 为了保持输出流的完整性，这里我们通常只能补一个换行。
                process.stdout.write('\n'); 
                // 注意：在非 TTY 模式下重新打印 Markdown 会导致内容重复，
                // 所以通常非 TTY 模式我们就不做“回滚-重绘”了，
                // 除非我们 buffer 所有内容不输出直到结束（但这违背了流式初衷）。
                // 这里我们假设非 TTY 用户只想要 raw text。
            }
        }

        // 输出耗时统计
        const elapsed = (Date.now() - this.startTime) / 1000;
        process.stdout.write('\n' + chalk.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));

        return this.fullResponse;
    }

    /**
     * 计算文本在终端的可视行数
     */
    private getVisualLineCount(text: string, screenWidth: number): number {
        const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

        const lines = text.split('\n');
        let totalLines = 0;

        for (const line of lines) {
            // Expand tabs
            const expandedLine = line.replace(/\t/g, '        ');
            const cleanLine = stripAnsi(expandedLine);

            let lineWidth = 0;
            for (const char of cleanLine) {
                const code = char.codePointAt(0) || 0;
                // 大部分宽字符（如中文）占 2 格
                lineWidth += code > 255 ? 2 : 1;
            }

            if (lineWidth === 0) {
                totalLines += 1;
            } else {
                totalLines += Math.ceil(lineWidth / screenWidth);
            }
        }

        return totalLines;
    }
}
```

### 2. 更新：`src/agent/skills.ts`
添加 JSON 持久化逻辑。

```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { AgentPlan } from './plan';
import { ExecutionRecord } from './record';
import chalk from 'chalk';

export interface Skill {
    id: string;
    name: string;
    description: string;
    whenToUse: string; // 触发场景描述
    planTemplate: AgentPlan;

    // 评价指标
    successCount: number;
    failureCount: number;
    confidence: number; // 0 ~ 1, 初始 0.5

    // 时间戳
    lastUsed: number;
    createdAt: number;
}

const SKILLS_FILE = path.join(os.homedir(), '.yuangs_skills.json');
let skillLibrary: Skill[] = [];

// === Persistence Logic ===

function loadSkills() {
    if (fs.existsSync(SKILLS_FILE)) {
        try {
            const data = fs.readFileSync(SKILLS_FILE, 'utf-8');
            skillLibrary = JSON.parse(data);
        } catch (e) {
            console.error(chalk.yellow(`Failed to load skills from ${SKILLS_FILE}, starting empty.`));
            skillLibrary = [];
        }
    }
}

function saveSkills() {
    try {
        fs.writeFileSync(SKILLS_FILE, JSON.stringify(skillLibrary, null, 2));
    } catch (e) {
        console.error(chalk.red(`Failed to save skills to ${SKILLS_FILE}`));
    }
}

// Initialize on load
loadSkills();

// === Existing Logic with Save Hooks ===

/**
 * 计算技能分 (0 ~ 1)
 */
function computeSkillScore(skill: Skill, now: number = Date.now()): number {
    const totalUses = skill.successCount + skill.failureCount;
    const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;

    // 时间衰减 (Freshness): 半衰期约 14 天
    const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);
    const freshness = Math.exp(-idleDays / 14);

    // 综合得分: 45% 成功率 + 35% 新鲜度 + 20% 置信度
    return (0.45 * successRate) + (0.35 * freshness) + (0.20 * skill.confidence);
}

/**
 * 更新技能状态 (执行后调用)
 */
export function updateSkillStatus(skillId: string, success: boolean) {
    const skill = skillLibrary.find(s => s.id === skillId);
    if (!skill) return;

    skill.lastUsed = Date.now();
    if (success) {
        skill.successCount++;
        // 成功奖励: 置信度缓慢提升
        skill.confidence = Math.min(1, skill.confidence + 0.05);
    } else {
        skill.failureCount++;
        // 失败惩罚: 惩罚力度大于奖励，防止系统“自嗨”
        skill.confidence = Math.max(0, skill.confidence - 0.1);
    }
    
    saveSkills(); // Persist changes
}

/**
 * 自动学习新技能
 */
export function learnSkillFromRecord(record: ExecutionRecord, success: boolean = true) {
    if (record.mode === 'chat' || !record.llmResult.plan) return;

    const existingSkill = skillLibrary.find(s => s.name === record.llmResult.plan?.goal);

    if (existingSkill) {
        updateSkillStatus(existingSkill.id, success);
        return;
    }

    // 只有成功的记录才被学为新技能
    if (!success) return;

    const now = Date.now();
    skillLibrary.push({
        id: record.id,
        name: record.llmResult.plan.goal,
        description: `自动学习的技能: ${record.llmResult.plan.goal}`,
        whenToUse: record.input.rawInput,
        planTemplate: record.llmResult.plan,
        successCount: 1,
        failureCount: 0,
        confidence: 0.5,
        lastUsed: now,
        createdAt: now
    });

    // 每学习一次，尝试清理一次“冷”技能
    reapColdSkills();
    
    saveSkills(); // Persist changes
}

/**
 * 筛选并排序技能 (用于注入 Prompt)
 */
export function getRelevantSkills(input: string, limit: number = 3): Skill[] {
    const now = Date.now();

    return skillLibrary
        // 1. 基础筛选: 剔除评分过低的技能 (硬淘汰阈值 0.3)
        .filter(s => computeSkillScore(s, now) >= 0.3)
        // 2. 排序: 按综合分排序
        .sort((a, b) => computeSkillScore(b, now) - computeSkillScore(a, now))
        // 3. 取上限
        .slice(0, limit);
}

/**
 * 清理过期或低质技能 (Reaper)
 */
export function reapColdSkills() {
    const now = Date.now();
    const initialCount = skillLibrary.length;

    skillLibrary = skillLibrary.filter(skill => {
        const score = computeSkillScore(skill, now);
        const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);

        // 满足以下任一条件则淘汰:
        // 1. 得分极低且长期不用
        if (score < 0.25 && idleDays > 30) return false;
        // 2. 失败率极高且尝试过一定次数
        if (skill.failureCount > 5 && (skill.successCount / (skill.successCount + skill.failureCount)) < 0.2) return false;

        return true;
    });

    // 强制保持容量
    if (skillLibrary.length > 100) {
        // 如果还超标，移除得分最低的那个
        skillLibrary.sort((a, b) => computeSkillScore(a, now) - computeSkillScore(b, now));
        skillLibrary.shift();
    }
    
    if (skillLibrary.length !== initialCount) {
        saveSkills(); // Persist if changes happened
    }
}

export function getAllSkills(): Skill[] {
    return [...skillLibrary];
}
```

### 3. 更新：`src/commands/handleAIChat.ts`
使用新的 `StreamMarkdownRenderer` 简化代码。

```typescript
// ... (保留之前的 import)
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';
// Remove direct marked imports, use renderer
import fs from 'fs';
import path from 'path';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ContextBuffer } from './contextBuffer';
import { loadContext, saveContext, clearContextStorage } from './contextStorage';
import { getGitContext } from './gitContext';
import {
    Mode,
    detectMode,
    createCompleter,
    executeCommand as shellExecuteCommand,
    listPlugins
} from './shellCompletions';
import { StreamMarkdownRenderer } from '../utils/renderer'; // Import new renderer

const execAsync = promisify(exec);

// ... (保留 findCommonPrefix, executeCommand, readFileContent, showFileSelector, handleFileReference 等辅助函数)
// ... (这些函数不需要修改)

// ... (HandleAIChat Main Logic)
export async function handleAIChat(initialQuestion: string | null, model?: string) {
    if (initialQuestion) {
        await askOnceStream(initialQuestion, model);
        return;
    }
    
    // ... (保留之前的 CLI 交互逻辑循环，直到调用 askOnceStream)
    // 注意：这里代码太长，只展示核心替换部分，其他保持不变
    // 关键是 askOnceStream 的实现
    
    // ... Inside the while loop ...
            try {
                rl.pause();
                await askOnceStream(finalPrompt, model); // Call updated function

                contextBuffer.clear();
                await saveContext([]);
            } catch (err: unknown) {
                // ...
            } finally {
                rl.resume();
            }
    // ...
}

// Updated askOnceStream using StreamMarkdownRenderer
async function askOnceStream(question: string, model?: string) {
    const messages = [...getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    
    // 初始化渲染器
    const renderer = new StreamMarkdownRenderer(chalk.bold.blue('🤖 AI：'), spinner);

    try {
        await callAI_Stream(messages, model, (chunk) => {
            renderer.onChunk(chunk);
        });

        const fullResponse = renderer.finish();

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}
```

### 4. 更新：`src/agent/AgentPipeline.ts`
让 Agent 模式也享受到渲染优化。

```typescript
import {
    AgentInput,
    AgentMode,
} from './types';

import { inferIntent } from './intent';
import { buildContext } from './context';
import { buildPrompt } from './prompt';
import { selectModel } from './selectModel';
import { runLLM } from './llm';
import { interpretResultToPlan } from './interpret';
import { executePlan } from './planExecutor';
import { saveRecord } from './record';
import { learnSkillFromRecord } from './skills';
import { randomUUID } from 'crypto';
import { StreamMarkdownRenderer } from '../utils/renderer'; // Import renderer
import ora from 'ora';
import chalk from 'chalk';

export class AgentPipeline {
    async run(input: AgentInput, mode: AgentMode): Promise<void> {
        const id = randomUUID();

        // 1. Intent Analysis
        const intent = inferIntent(input, mode);

        // 2. Context Assembly
        const context = buildContext(input);

        // 3. Prompt Construction
        const prompt = buildPrompt(intent, context, mode, input.rawInput);

        // 4. Model Selection
        const model = selectModel(intent, input.options?.model);

        // Setup Renderer if in Chat Mode
        let renderer: StreamMarkdownRenderer | undefined;
        let spinner: ora.Ora | undefined;

        if (mode === 'chat') {
            spinner = ora(chalk.cyan('Thinking...')).start();
            renderer = new StreamMarkdownRenderer(chalk.bold.blue('🤖 AI: '), spinner);
        }

        // 5. LLM Execution
        const result = await runLLM({
            prompt,
            model,
            stream: mode === 'chat',
            onChunk: mode === 'chat' && renderer
                ? (s) => renderer!.onChunk(s)
                : undefined,
        });

        // Finish rendering if chat mode
        if (mode === 'chat' && renderer) {
            renderer.finish();
        }

        // 6. Result Interpretation -> Plan
        const isStreaming = mode === 'chat';
        const plan = interpretResultToPlan(result, intent, mode, isStreaming);
        result.plan = plan; // Attach plan to result for recording

        // 7. Save Execution Record (before execution for safety)
        saveRecord({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText }, 
        });

        // 8. Plan Execution
        // Note: For chat, execution usually is just "printing", which happened via stream.
        // interpretResultToPlan handles ignoring tasks if streamed.
        const summary = await executePlan(plan, input.options);

        // 9. Post-execution: Learn Skill if successful
        learnSkillFromRecord({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText },
        }, summary.success);

        // Log execution metrics if verbose
        if (input.options?.verbose) {
            console.log(`\n${'-'.repeat(50)}`);
            console.log(`Execution ID: ${id}`);
            console.log(`Model: ${model}`);
            console.log(`Latency: ${result.latencyMs}ms`);
            if (result.tokens) {
                console.log(`Tokens: ${result.tokens.total}`);
            }
            console.log(`${'-'.repeat(50)}\n`);
        }
    }
}
```

### 5. 验证脚本：`verify.sh`
保持你的 `verify.sh` 不变即可，确保所有文件更新后运行它。

### 发布建议

1.  **覆盖文件**：将上述代码覆盖对应的源文件。
2.  **创建新文件**：确保 `src/utils/renderer.ts` 创建成功。
3.  **运行验证**：
    ```bash
    chmod +x verify.sh
    ./verify.sh
    ```
4.  **手动测试**：
    *   运行 `yuangs ai "Hello"` 测试 Chat 模式的 Markdown 渲染。
    *   运行 `yuangs ai -e "create a file"` 测试 Command 模式。
    *   检查 `~/.yuangs_skills.json` 是否在执行成功后生成（需要先让 Agent 学习，例如多次执行命令）。
5.  **发布**：
    ```bash
    npm publish --access public
    ```