# Project Documentation

- **Generated at:** 2026-01-18 16:25:16
- **Root Dir:** `.`
- **File Count:** 64
- **Total Size:** 187.69 KB

## 📂 File List
- `.gitignore` (0.15 KB)
- `.yuangs.test.json` (0.12 KB)
- `example.json` (0.06 KB)
- `package.json` (1.41 KB)
- `poeapi_go.code-workspace` (0.08 KB)
- `src/agent/AgentPipeline.ts` (3.05 KB)
- `src/agent/actions.ts` (1.58 KB)
- `src/agent/context.ts` (0.65 KB)
- `src/agent/index.ts` (0.07 KB)
- `src/agent/intent.ts` (0.94 KB)
- `src/agent/interpret.ts` (1.29 KB)
- `src/agent/llm.ts` (2.61 KB)
- `src/agent/plan.ts` (0.30 KB)
- `src/agent/planExecutor.ts` (2.70 KB)
- `src/agent/prompt.ts` (2.08 KB)
- `src/agent/record.ts` (0.73 KB)
- `src/agent/replay.ts` (0.88 KB)
- `src/agent/selectModel.ts` (0.50 KB)
- `src/agent/skills.ts` (3.95 KB)
- `src/agent/types.ts` (1.26 KB)
- `src/ai/client.ts` (4.14 KB)
- `src/ai/prompt.ts` (2.22 KB)
- `src/ai/types.ts` (0.09 KB)
- `src/cli.ts` (19.24 KB)
- `src/cli.ts.backup` (15.27 KB)
- `src/commands/capabilityCommands.ts` (4.84 KB)
- `src/commands/contextBuffer.ts` (1.84 KB)
- `src/commands/contextStorage.ts` (0.69 KB)
- `src/commands/gitContext.ts` (0.77 KB)
- `src/commands/handleAIChat.ts` (24.44 KB)
- `src/commands/handleAICommand.ts` (8.07 KB)
- `src/commands/handleConfig.ts` (2.28 KB)
- `src/commands/shellCompletions.ts` (13.64 KB)
- `src/core/apps.ts` (1.63 KB)
- `src/core/autofix.ts` (0.61 KB)
- `src/core/capabilities.ts` (1.90 KB)
- `src/core/capabilityInference.ts` (0.93 KB)
- `src/core/capabilitySystem.ts` (3.17 KB)
- `src/core/configMerge.ts` (3.09 KB)
- `src/core/executionRecord.ts` (2.29 KB)
- `src/core/executionStore.ts` (2.44 KB)
- `src/core/executor.ts` (0.97 KB)
- `src/core/fileReader.ts` (2.03 KB)
- `src/core/macros.ts` (2.36 KB)
- `src/core/modelMatcher.ts` (2.65 KB)
- `src/core/os.ts` (1.00 KB)
- `src/core/replayEngine.ts` (3.88 KB)
- `src/core/risk.ts` (0.48 KB)
- `src/core/validation.ts` (4.52 KB)
- `src/index.ts` (0.14 KB)
- `src/types.d.ts` (0.17 KB)
- `src/utils/confirm.ts` (0.44 KB)
- `src/utils/history.ts` (0.89 KB)
- `src/utils/syntaxHandler.ts` (8.14 KB)
- `test/fileReader.test.js` (5.94 KB)
- `test/macros.test.js` (3.48 KB)
- `test/risk-validation.test.js` (2.43 KB)
- `test/test_agent_pipeline.js` (2.54 KB)
- `test/test_logic.js` (0.92 KB)
- `tsconfig.json` (0.50 KB)
- `verify.sh` (2.79 KB)
- `yuangs.config.example.json` (0.39 KB)
- `yuangs.config.example.yaml` (0.78 KB)
- `yuangs.config.json` (2.25 KB)

---

## 📄 `.gitignore`

````text
# dependencies
node_modules/
**/*.map

# editor
.vscode/

# local tools / caches
.weaver/
.sisyphus/

# AI / temp workflow drafts
# .github/workflows/*.ai/

````

## 📄 `.yuangs.test.json`

````json
{"models":[{"name":"custom-model","provider":"custom","atomicCapabilities":["text_generation","reasoning","code_generation"]}]}

````

## 📄 `example.json`

````json
{
  "name": "example",
  "version": 1,
  "enabled": true
}

````

## 📄 `package.json`

````json
{
  "name": "yuangs",
  "version": "2.11.0",
  "description": "苑广山的个人应用集合 CLI（彩色版）",
  "author": "苑广山",
  "license": "ISC",
  "bin": {
    "yuangs": "dist/cli.js"
  },
  "main": "dist/cli.js",
  "types": "dist/cli.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "ts-node src/cli.ts",
    "build": "tsc",
    "prepare": "npm run build",
    "prepublishOnly": "npm run build",
    "test": "jest",
    "verify": "./verify.sh"
  },
  "keywords": [
    "yuangs",
    "cli",
    "tools",
    "colorful"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yuanguangshan/npm_yuangs.git"
  },
  "bugs": {
    "url": "https://github.com/yuanguangshan/npm_yuangs/issues"
  },
  "homepage": "https://github.com/yuanguangshan/npm_yuangs#readme",
  "dependencies": {
    "axios": "^1.13.2",
    "chalk": "^4.1.2",
    "commander": "^13.1.0",
    "js-yaml": "^4.1.0",
    "json5": "^2.2.3",
    "marked": "^15.0.12",
    "marked-terminal": "^7.3.0",
    "ora": "^6.3.1",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/json5": "^0.0.30",
    "@types/marked": "^5.0.2",
    "@types/marked-terminal": "^6.1.1",
    "@types/node": "^20.11.30",
    "@types/ora": "^3.1.0",
    "jest": "^29.7.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=18"
  },
  "publishConfig": {
    "access": "public"
  }
}

````

## 📄 `poeapi_go.code-workspace`

````text
{
	"folders": [
		{
			"name": "npm_yuangs",
			"path": "."
		}
	],
	"settings": {}
}
````

## 📄 `src/agent/AgentPipeline.ts`

````typescript
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

        // 5. LLM Execution
        const result = await runLLM({
            prompt,
            model,
            stream: mode === 'chat',
            onChunk: mode === 'chat'
                ? (s) => process.stdout.write(s)
                : undefined,
        });

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
            } : { type: 'print', content: result.rawText }, // For backward compatibility with record.action
        });

        // 8. Plan Execution
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

````

## 📄 `src/agent/actions.ts`

````typescript
import { AgentAction } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import readline from 'readline';

const execAsync = promisify(exec);

export async function executeAction(
    action: AgentAction,
    options?: { autoYes?: boolean }
): Promise<void> {
    if (action.type === 'print') {
        console.log(action.content);
        return;
    }

    if (action.type === 'confirm') {
        const ok = options?.autoYes || await confirm('Execute this action?');
        if (ok) {
            await executeAction(action.next, options);
        }
        return;
    }

    if (action.type === 'execute') {
        try {
            console.log(chalk.cyan(`\nExecuting: ${action.command}\n`));
            const { stdout, stderr } = await execAsync(action.command, {
                shell: typeof process.env.SHELL === 'string' ? process.env.SHELL : undefined
            });
            if (stdout) console.log(stdout);
            if (stderr) console.error(chalk.yellow(stderr));
        } catch (error: any) {
            console.error(chalk.red(`Execution failed: ${error.message}`));
            throw error;
        }
    }
}

async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(chalk.cyan(`${message} (y/N): `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

````

## 📄 `src/agent/context.ts`

````typescript
import { AgentInput, AgentContext } from './types';
import { ContextBuffer } from '../commands/contextBuffer';

// Create a singleton instance for the agent
const globalContextBuffer = new ContextBuffer();

export function buildContext(input: AgentInput): AgentContext {
    const items = globalContextBuffer.export();

    return {
        files: items.map(item => ({
            path: item.path,
            content: item.content,
        })),
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}

export function getAgentContextBuffer(): ContextBuffer {
    return globalContextBuffer;
}

````

## 📄 `src/agent/index.ts`

````typescript
export { AgentPipeline } from './AgentPipeline';
export * from './types';

````

## 📄 `src/agent/intent.ts`

````typescript
import { AgentInput, AgentIntent, AgentMode } from './types';
import { inferCapabilityRequirement } from '../core/capabilityInference';
import { AtomicCapability } from '../core/capabilities';

export function inferIntent(
    input: AgentInput,
    mode: AgentMode
): AgentIntent {
    if (mode === 'chat') {
        return {
            type: 'chat',
            capabilities: {
                reasoning: true,
                streaming: true,
                longContext: true,
            },
        };
    }

    // For command mode, use the existing capability inference
    const capReq = inferCapabilityRequirement(input.rawInput);

    return {
        type: 'shell',
        capabilities: {
            reasoning: capReq.required.includes(AtomicCapability.REASONING),
            code: capReq.required.includes(AtomicCapability.CODE_GENERATION),
            longContext: capReq.required.includes(AtomicCapability.LONG_CONTEXT),
        },
    };
}

````

## 📄 `src/agent/interpret.ts`

````typescript
import { AgentIntent, AgentMode, LLMResult } from './types';
import { AgentPlan } from './plan';

export function interpretResultToPlan(
    result: LLMResult,
    intent: AgentIntent,
    mode: AgentMode,
    alreadyStreamed: boolean = false
): AgentPlan {
    if (mode === 'chat') {
        const tasks = alreadyStreamed ? [] : [{
            id: 'chat-response',
            description: '输出 AI 回答',
            type: 'custom' as const,
            status: 'pending' as const,
            payload: { kind: 'print', text: result.rawText }
        }];

        return {
            goal: '回答用户咨询',
            tasks: tasks
        };
    }

    const aiPlan = result.parsed;
    if (!aiPlan || (!aiPlan.command && !aiPlan.macro)) {
        throw new Error('AI 未能生成有效的执行计划');
    }

    const command = aiPlan.command || aiPlan.macro; // 暂时简化处理

    return {
        goal: aiPlan.plan || '执行 Shell 命令',
        tasks: [
            {
                id: 'exec-shell',
                description: `执行命令: ${command}`,
                type: 'shell',
                status: 'pending',
                payload: {
                    command: command,
                    risk: aiPlan.risk ?? 'medium'
                }
            }
        ]
    };
}

````

## 📄 `src/agent/llm.ts`

````typescript
import { AgentPrompt, LLMResult } from './types';
import { callAI_Stream } from '../ai/client';
import axios from 'axios';
import { DEFAULT_AI_PROXY_URL, DEFAULT_MODEL, DEFAULT_ACCOUNT_TYPE, type AIRequestMessage } from '../core/validation';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { safeParseJSON } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

function getUserConfig(): any {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content);
        } catch (e) { }
    }
    return {};
}

export async function runLLM({
    prompt,
    model,
    stream,
    onChunk,
}: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string) => void;
}): Promise<LLMResult> {
    const start = Date.now();

    if (stream) {
        let raw = '';
        await callAI_Stream(prompt.messages, model, (chunk) => {
            raw += chunk;
            onChunk?.(chunk);
        });
        return {
            rawText: raw,
            latencyMs: Date.now() - start,
        };
    }

    // Non-streaming mode with optional schema
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    const data = {
        model: model || config.defaultModel || DEFAULT_MODEL,
        messages: prompt.messages,
        stream: false
    };

    try {
        const response = await axios.post(url, data, { headers });
        const rawText = response.data.choices[0]?.message?.content || '';

        let parsed = undefined;
        if (prompt.outputSchema) {
            const parseResult = safeParseJSON(rawText, prompt.outputSchema, {});
            if (parseResult.success) {
                parsed = parseResult.data;
            }
        }

        return {
            rawText,
            parsed,
            latencyMs: Date.now() - start,
        };
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}

````

## 📄 `src/agent/plan.ts`

````typescript
export interface AgentPlan {
    goal: string;
    tasks: AgentTask[];
}

export interface AgentTask {
    id: string;
    description: string;
    type: 'llm' | 'shell' | 'custom';
    dependsOn?: string[];
    payload?: any;
    status: 'pending' | 'running' | 'success' | 'failed';
    result?: any;
}

````

## 📄 `src/agent/planExecutor.ts`

````typescript
import { AgentPlan, AgentTask } from './plan';
import { executeAction } from './actions';
import chalk from 'chalk';

export interface PlanExecutionSummary {
    success: boolean;
    completedCount: number;
    totalCount: number;
}

export async function executePlan(
    plan: AgentPlan,
    options?: { autoYes?: boolean; verbose?: boolean }
): Promise<PlanExecutionSummary> {
    const completed = new Set<string>();
    const failed = new Set<string>();

    if (options?.verbose) {
        console.log(chalk.bold.cyan(`\n🚀 开始执行计划: ${plan.goal}`));
        console.log(chalk.gray(`共 ${plan.tasks.length} 个任务\n`));
    }

    for (const task of plan.tasks) {
        // 检查依赖
        if (task.dependsOn?.some(depId => !completed.has(depId))) {
            if (options?.verbose) {
                console.log(chalk.yellow(`⏭️ 跳过任务 ${task.id}: 依赖未完成`));
            }
            continue;
        }

        if (failed.has(task.id)) continue;

        try {
            task.status = 'running';
            if (options?.verbose) {
                console.log(chalk.cyan(`⚙️ 执行任务 ${task.id}: ${task.description}`));
            }

            await executeTask(task, options);

            task.status = 'success';
            completed.add(task.id);
        } catch (error: any) {
            task.status = 'failed';
            failed.add(task.id);
            console.error(chalk.red(`❌ 任务 ${task.id} 失败: ${error.message}`));
            // 如果一个任务失败，后续依赖它的任务都会被跳过
        }
    }

    if (options?.verbose) {
        console.log(chalk.bold.green(`\n✅ 计划执行完成 (${completed.size}/${plan.tasks.length} 成功)\n`));
    }

    return {
        success: failed.size === 0 && completed.size > 0,
        completedCount: completed.size,
        totalCount: plan.tasks.length
    };
}

async function executeTask(
    task: AgentTask,
    options?: { autoYes?: boolean }
): Promise<void> {
    switch (task.type) {
        case 'shell':
            await executeAction({
                type: 'confirm',
                next: {
                    type: 'execute',
                    command: task.payload.command,
                    risk: task.payload.risk || 'medium'
                }
            }, options);
            break;

        case 'custom':
            if (task.payload?.kind === 'print' && task.payload?.text) {
                console.log(task.payload.text);
            }
            break;

        case 'llm':
            // 未来可以支持任务中再次调用 LLM (Recursive Agent)
            console.log(chalk.gray(`[LLM Task] ${task.description} (Not implemented in MVP)`));
            break;
    }
}

````

## 📄 `src/agent/prompt.ts`

````typescript
import {
    AgentIntent,
    AgentContext,
    AgentMode,
    AgentPrompt,
} from './types';
import { buildCommandPrompt as buildCommandPromptString } from '../ai/prompt';
import { getOSProfile } from '../core/os';
import { getMacros } from '../core/macros';
import { aiCommandPlanSchema } from '../core/validation';
import { getRelevantSkills } from './skills';

export function buildPrompt(
    intent: AgentIntent,
    context: AgentContext,
    mode: AgentMode,
    input: string
): AgentPrompt {
    if (mode === 'chat') {
        return buildChatPrompt(context, input);
    }

    return buildCommandPromptObject(input, context);
}

function buildChatPrompt(
    context: AgentContext,
    input: string
): AgentPrompt {
    const messages: any[] = [
        ...(context.history ?? []),
    ];

    // Add context files if available
    if (context.files && context.files.length > 0) {
        const contextDesc = context.files.map(f =>
            `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
        ).join('\n\n');

        messages.push({
            role: 'system',
            content: `Context:\n${contextDesc}`,
        });
    }

    messages.push({
        role: 'user',
        content: input,
    });

    return {
        system: 'You are a helpful AI assistant with expertise in software development, system administration, and problem-solving.',
        messages,
    };
}

function buildCommandPromptObject(
    input: string,
    context: AgentContext
): AgentPrompt {
    const os = getOSProfile();
    const macros = getMacros();
    const skills = getRelevantSkills(input);
    let promptText = buildCommandPromptString(input, os, macros);

    if (skills.length > 0) {
        const skillList = skills.map(s => `- ${s.name}: 当遇到 "${s.whenToUse}" 时，你可以参考计划: ${s.planTemplate.goal}`).join('\n');
        promptText = `【参考技能库】\n${skillList}\n\n${promptText}`;
    }

    return {
        messages: [
            {
                role: 'user',
                content: promptText,
            },
        ],
        outputSchema: aiCommandPlanSchema,
    };
}

````

## 📄 `src/agent/record.ts`

````typescript
import {
    AgentInput,
    AgentMode,
    AgentPrompt,
    LLMResult,
    AgentAction,
} from './types';

export interface ExecutionRecord {
    id: string;
    timestamp: number;
    mode: AgentMode;
    input: AgentInput;
    prompt: AgentPrompt;
    model: string;
    llmResult: LLMResult;
    action: AgentAction;
}

const records: ExecutionRecord[] = [];

export function saveRecord(record: ExecutionRecord) {
    records.push(record);
    // Keep only last 100 records in memory
    if (records.length > 100) {
        records.shift();
    }
}

export function getRecords(): ExecutionRecord[] {
    return [...records];
}

export function getRecordById(id: string): ExecutionRecord | undefined {
    return records.find(r => r.id === id);
}

````

## 📄 `src/agent/replay.ts`

````typescript
import { ExecutionRecord } from './record';
import { runLLM } from './llm';
import { interpretResultToPlan } from './interpret';
import { AgentIntent } from './types';

export async function replay(record: ExecutionRecord) {
    console.log(`\nReplaying execution: ${record.id}`);
    console.log(`Original timestamp: ${new Date(record.timestamp).toISOString()}`);
    console.log(`Mode: ${record.mode}\n`);

    const result = await runLLM({
        prompt: record.prompt,
        model: record.model,
        stream: record.mode === 'chat',
        onChunk: record.mode === 'chat'
            ? (s) => process.stdout.write(s)
            : undefined,
    });

    // Create a minimal intent for interpretation
    const intent: AgentIntent = {
        type: record.mode === 'chat' ? 'chat' : 'shell',
        capabilities: {},
    };

    return interpretResultToPlan(result, intent, record.mode);
}

````

## 📄 `src/agent/selectModel.ts`

````typescript
import { AgentIntent } from './types';

export function selectModel(
    intent: AgentIntent,
    override?: string
): string {
    if (override) return override;

    const caps = intent.capabilities;

    // Long context + reasoning = most powerful model
    if (caps.longContext && caps.reasoning) {
        return 'gemini-2.0-flash-exp';
    }

    // Code-focused tasks
    if (caps.code) {
        return 'gemini-2.5-flash-lite';
    }

    // Default to balanced model
    return 'gemini-2.5-flash-lite';
}

````

## 📄 `src/agent/skills.ts`

````typescript
import { AgentPlan } from './plan';
import { ExecutionRecord } from './record';

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

let skillLibrary: Skill[] = [];

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
}

export function getAllSkills(): Skill[] {
    return [...skillLibrary];
}

````

## 📄 `src/agent/types.ts`

````typescript
import type { AIRequestMessage } from '../core/validation';
import { AgentPlan } from './plan';

export type AgentMode = 'chat' | 'command' | 'command+exec';

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

export interface AgentContext {
    files?: Array<{ path: string; content: string }>;
    gitDiff?: string;
    history?: AIRequestMessage[];
}

export interface AgentIntent {
    type: 'chat' | 'shell' | 'analysis';
    capabilities: {
        reasoning?: boolean;
        code?: boolean;
        longContext?: boolean;
        streaming?: boolean;
    };
}

export interface AgentPrompt {
    system?: string;
    messages: AIRequestMessage[];
    outputSchema?: any;
}

export interface LLMResult {
    rawText: string;
    parsed?: any;
    plan?: AgentPlan;
    latencyMs: number;
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    costUsd?: number;
}

export type AgentAction =
    | { type: 'print'; content: string }
    | { type: 'confirm'; next: AgentAction }
    | { type: 'execute'; command: string; risk: 'low' | 'medium' | 'high' };

````

## 📄 `src/ai/client.ts`

````typescript
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { DEFAULT_AI_PROXY_URL, DEFAULT_MODEL, DEFAULT_ACCOUNT_TYPE, type UserConfig, type AIRequestMessage } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

let conversationHistory: AIRequestMessage[] = [];

export function addToConversationHistory(role: 'system' | 'user' | 'assistant', content: string) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
}

export function clearConversationHistory() {
    conversationHistory = [];
}

export function getConversationHistory() {
    return conversationHistory;
}

export function getUserConfig(): UserConfig {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content) as UserConfig;
        } catch (e) { }
    }
    return {};
}

export async function askAI(prompt: string, model?: string): Promise<string> {
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    const data = {
        model: model || config.defaultModel || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };

    try {
        const response = await axios.post(url, data, { headers });
        const content = response.data?.choices?.[0]?.message?.content;
        return content || '';
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}

export async function callAI_Stream(messages: AIRequestMessage[], model: string | undefined, onChunk: (content: string) => void): Promise<void> {
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const response = await axios({
        method: 'post',
        url: url,
        data: {
            model: model || config.defaultModel || DEFAULT_MODEL,
            messages: messages,
            stream: true
        },
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'npm_yuangs',
            'Origin': 'https://cli.want.biz',
            'Referer': 'https://cli.want.biz/',
            'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json'
        }
    });

    return new Promise((resolve, reject) => {
        let buffer = '';
        response.data.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') {
                        resolve();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) onChunk(content);
                    } catch (e) { }
                }
            }
        });
        response.data.on('error', reject);
        response.data.on('end', () => {
            resolve();
        });
    });
}

````

## 📄 `src/ai/prompt.ts`

````typescript
import { OSProfile } from '../core/os';
import type { Macro } from '../core/validation';

export function buildCommandPrompt(
    userInput: string,
    os: OSProfile,
    macros?: Record<string, Macro>
): string {
    const macroContext = macros && Object.keys(macros).length > 0
        ? `
【可复用的快捷指令 (Macros)】
以下是可以直接复用的已验证命令。优先复用这些指令，而不是生成新命令：

${Object.entries(macros).map(([name, macro]) => `  - ${name}: ${macro.description || '(无描述)'}`).join('\n')}

当用户的需求与某个 Macro 匹配或相似时：
1. 优先使用该 Macro
2. 在 JSON 输出中使用 "macro" 字段指定 Macro 名称，而不是 "command" 字段
3. 仅在没有合适 Macro 时才生成新命令
`
        : '';

    return `
你是一个专业的命令行专家。

【系统环境】
- 操作系统: ${os.name}
- Shell: ${os.shell}
- find 实现: ${os.find}
- stat 实现: ${os.stat}

【规则】
- 命令必须与当前系统兼容。
- 如果是 macOS (BSD):
  - 不允许使用 find -printf
  - 优先使用 stat -f
- 如果是 Linux (GNU):
  - 可使用 find -printf
- 默认不使用 sudo。
- 确保输出的命令是单行或者使用 && 连接。
- 不要解释，只输出符合以下 JSON 结构的文本。
- 优先复用已验证的快捷指令（Macros），每个 Macro 都是经过人工验证的可靠命令。在生成新命令前，检查是否已有 Macro 可以完成任务。

${macroContext}

【输出 JSON 结构】
{
  "plan": "简要说明你准备执行的步骤",
  "command": "可直接执行的 shell 命令（仅当没有合适 Macro 时提供）",
  "macro": "要复用的 Macro 名称（优先使用，与 command 二选一）",
  "risk": "low | medium | high"
}

【用户需求】
${userInput}
`;
}

export function buildFixPrompt(
    originalCmd: string,
    stderr: string,
    os: OSProfile
): string {
    return `
该命令在 ${os.name} 上执行失败：

命令：
${originalCmd}

错误信息：
${stderr}

请生成一个 **${os.name} 兼容** 的等价命令。
依然只输出 JSON 格式。注意：这是修复命令，不需要检查 Macro。

{
  "plan": "修复说明",
  "command": "修复后的命令",
  "risk": "low | medium | high"
}
`;
}

````

## 📄 `src/ai/types.ts`

````typescript
export { AICommandPlan, type AICommandPlan as AICommandPlanType } from '../core/validation';

````

## 📄 `src/cli.ts`

````typescript
#!/usr/bin/env node
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Command } from 'commander';
import { handleAICommand } from './commands/handleAICommand';
import { handleAIChat } from './commands/handleAIChat';
import { handleConfig } from './commands/handleConfig';
import { registerCapabilityCommands } from './commands/capabilityCommands';
import { loadAppsConfig, openUrl, DEFAULT_APPS } from './core/apps';
import { getMacros, saveMacro, runMacro } from './core/macros';
import { getCommandHistory } from './utils/history';
import { handleSpecialSyntax } from './utils/syntaxHandler';

// Mandatory Node.js version check
const majorVersion = Number(process.versions.node.split('.')[0]);
if (majorVersion < 18) {
    console.error(chalk.red(`Error: yuangs requires Node.js >= 18. Current version: ${process.version}`));
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

const program = new Command();

program
    .name('yuangs')
    .description('苑广山的个人命令行工具')
    .version(version, '-V, --version');

async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        // Simple timeout to avoid hanging if no input
        setTimeout(() => resolve(data), 2000);
    });
}

function parseOptionsFromArgs(args: string[]): {
    exec: boolean;
    model?: string;
    withContent: boolean;
} {
    return {
        exec: args.includes('-e') || args.includes('--exec'),
        model: getArgValue(args, ['-m', '--model']) || getModelFromShortcuts(args),
        withContent: args.includes('-w') || args.includes('--with-content')
    };
}

function getModelFromShortcuts(args: string[]): string | undefined {
    if (args.includes('-p')) return 'gemini-2.5-flash-lite';
    if (args.includes('-f')) return 'gemini-2.5-flash-lite';
    if (args.includes('-l')) return 'gemini-2.5-flash-lite';
    return undefined;
}

function getArgValue(args: string[], flags: string[]): string | undefined {
    for (let i = 0; i < args.length; i++) {
        for (const flag of flags) {
            if (args[i] === flag && i + 1 < args.length && !args[i + 1].startsWith('-')) {
                return args[i + 1];
            }
        }
    }
    return undefined;
}

program
    .command('ai [question...]')
    .description('向 AI 提问')
    .option('-e, --exec', '生成并执行 Linux 命令')
    .option('-m, --model <model>', '指定 AI 模型')
    .option('-p', '使用 Pro 模型 (gemini-2.5-flash-lite)')
    .option('-f', '使用 Flash 模型 (gemini-2.5-flash-lite)')
    .option('-l', '使用 Lite 模型 (gemini-2.5-flash-lite)')
    .option('-w, --with-content', '在管道模式下读取文件内容')
    .option('--verbose', '详细输出（显示 Capability 匹配详情）')
    .action(async (questionArgs, options) => {
        const stdinData = await readStdin();
        let question = Array.isArray(questionArgs) ? questionArgs.join(' ').trim() : questionArgs || '';

        if (stdinData) {
            if (options.withContent) {
                const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                const filePaths = parseFilePathsFromLsOutput(stdinData);
                const contentMap = readFilesContent(filePaths);
                question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
            } else {
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
        }

        let model = options.model;
        if (options.p) model = 'gemini-2.5-flash-lite';
        if (options.f) model = 'gemini-2.5-flash-lite';
        if (options.l) model = 'gemini-2.5-flash-lite';

        if (options.exec) {
            await handleAICommand(question, { execute: false, model, verbose: options.verbose });
        } else {
            await handleAIChat(question || null, model);
        }
    });

program
    .command('list')
    .description('列出所有应用')
    .action(() => {
        const apps = loadAppsConfig();
        console.log(chalk.bold.cyan('\n📱 应用列表\n'));
        Object.entries(apps).forEach(([key, url]) => {
            console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(10))} ${chalk.blue(url)}`);
        });
    });

program
    .command('history')
    .description('查看及执行命令历史')
    .option('-l, --last', '执行上一条命令')
    .action(async (options) => {
        const history = getCommandHistory();
        if (history.length === 0) {
            console.log(chalk.gray('暂无命令历史\n'));
            return;
        }

        if (options.last) {
            const lastItem = history[0]; // history is unshift-ed, so 0 is latest
            console.log(chalk.bold.cyan('\n📋 上一次执行的命令:\n'));
            console.log(chalk.white(`${lastItem.command}`));
            console.log(chalk.gray(`问题: ${lastItem.question}\n`));

            const rlLast = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const confirmLast = await rlLast.question(chalk.cyan('确认再次执行? (y/N): '));
            rlLast.close();

            if (confirmLast.toLowerCase() === 'y' || confirmLast.toLowerCase() === 'yes') {
                const { exec } = require('child_process');
                console.log(chalk.bold.cyan('执行中...\n'));
                exec(lastItem.command, (error: any, stdout: string, stderr: string) => {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(chalk.red(stderr));
                    if (error) console.error(chalk.red(error.message));
                    process.exit(0);
                });
                return;
            } else {
                console.log(chalk.gray('已取消执行'));
            }
            return;
        }

        console.log(chalk.bold.cyan('\n📋 命令历史\n'));
        history.forEach((item, index) => {
            console.log(`${index + 1}. ${chalk.white(item.command)}`);
            console.log(chalk.gray(`   问题: ${item.question}\n`));
        });

        const rlHistory = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const indexInput = await rlHistory.question(chalk.cyan('输入序号选择命令 (直接回车取消): '));
        rlHistory.close();

        if (indexInput.trim()) {
            const index = parseInt(indexInput) - 1;
            if (index >= 0 && index < history.length) {
                const targetCommand = history[index].command;
                console.log(chalk.yellow(`\n即将执行: ${targetCommand}\n`));
                const rlConfirm = require('node:readline/promises').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const confirm = await rlConfirm.question(chalk.cyan('确认执行? (y/N): '));
                rlConfirm.close();

                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    const { exec } = require('child_process');
                    console.log(chalk.bold.cyan('执行中...\n'));
                    exec(targetCommand, (error: any, stdout: string, stderr: string) => {
                        if (stdout) console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));
                        if (error) console.error(chalk.red(error.message));
                        process.exit(0);
                    });
                    return;
                } else {
                    console.log(chalk.gray('已取消执行'));
                }
            } else {
                console.log(chalk.red('无效的序号'));
            }
        }
    });

program
    .command('config')
    .description('管理本地配置 (~/.yuangs.json)')
    .argument('[action]', 'get, set, list')
    .argument('[key]', '配置项名称')
    .argument('[value]', '配置项值')
    .action(handleConfig);

program
    .command('macros')
    .description('查看所有快捷指令')
    .action(() => {
        const allMacros = getMacros();
        console.log(chalk.bold.cyan('\n🚀 快捷指令列表\n'));
        Object.keys(allMacros).forEach(name => {
            console.log(`  ${chalk.white(name)}: ${chalk.gray(allMacros[name].commands)}`);
        });
    });

program
    .command('save <name>')
    .description('保存快捷指令')
    .option('-l, --from-last', 'save last executed AI command')
    .option('-g, --global', 'add alias to ~/.zshrc')
    .action(async (name, options) => {
        const addToZshrc = (aliasName: string) => {
            const zshrcPath = path.join(os.homedir(), '.zshrc');
            if (fs.existsSync(zshrcPath)) {
                const aliasLine = `alias ${aliasName}="yuangs run ${aliasName}"`;
                try {
                    const content = fs.readFileSync(zshrcPath, 'utf8');
                    if (!content.includes(aliasLine)) {
                        fs.appendFileSync(zshrcPath, `\n${aliasLine}\n`);
                        console.log(chalk.green(`✓ 已添加 alias 到 ~/.zshrc`));
                        console.log(chalk.yellow(`ℹ️  请运行 "source ~/.zshrc" 以生效`));
                    } else {
                        console.log(chalk.yellow(`ℹ️  Alias "${aliasName}" 已存在于 ~/.zshrc`));
                    }
                } catch (err) {
                    console.error(chalk.red(`❌ 无法写入 ~/.zshrc: ${(err as Error).message}`));
                }
            } else {
                console.log(chalk.red(`❌ 未找到 ~/.zshrc`));
            }
        };

        if (options.fromLast) {
            const history = getCommandHistory();
            if (history.length === 0) {
                console.log(chalk.red('❌ 暂无 AI 命令历史'));
                return;
            }
            const lastItem = history[0];

            saveMacro(name, lastItem.command, `Saved from: ${lastItem.question}`);
            console.log(chalk.green(`✓ 已将最近一条 AI 命令保存为 "${name}"`));
            console.log(chalk.gray(`  Command: ${lastItem.command}`));

            if (options.global) {
                addToZshrc(name);
            }
            return;
        }

        const rl = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const cmd = await rl.question(chalk.cyan('请输入要保存的命令: '));
        saveMacro(name, cmd);
        console.log(chalk.green(`✓ 快捷指令 "${name}" 已保存`));
        rl.close();

        if (options.global) {
            addToZshrc(name);
        }
    });

program
    .command('run <name>')
    .description('执行快捷指令')
    .action((name) => {
        if (runMacro(name)) {
            console.log(chalk.green(`✓ 正在执行 "${name}"...`));
        } else {
            console.log(chalk.red(`错误: 快捷指令 "${name}" 不存在`));
        }
    });

registerCapabilityCommands(program);

program
    .command('help')
    .description('显示帮助信息')
    .action(() => {
        console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
        console.log(chalk.yellow(`当前版本: ${version}`));
        console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
        console.log(chalk.bold('命令列表:'));
        console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问`);
        console.log(`    ${chalk.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
        console.log(`  ${chalk.green('list')}              列出所有应用`);
        console.log(`  ${chalk.green('history')}           查看命令历史`);
        console.log(`  ${chalk.green('config')}            管理本地配置 (~/.yuangs.json)`);
        console.log(`  ${chalk.green('macros')}            查看所有快捷指令`);
        console.log(`  ${chalk.green('save')} <名称>      保存快捷指令`);
        console.log(`  ${chalk.green('run')} <名称>        执行快捷指令`);
        console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
    });

const apps = loadAppsConfig();

program
    .command('shici')
    .description('打开古诗词 PWA')
    .action(() => {
        const url = apps['shici'] || DEFAULT_APPS['shici'];
        console.log(chalk.green(`✓ 正在打开 shici...`));
        openUrl(url);
    });

program
    .command('dict')
    .description('打开英语词典')
    .action(() => {
        const url = apps['dict'] || DEFAULT_APPS['dict'];
        console.log(chalk.green(`✓ 正在打开 dict...`));
        openUrl(url);
    });

program
    .command('pong')
    .description('打开 Pong 游戏')
    .action(() => {
        const url = apps['pong'] || DEFAULT_APPS['pong'];
        console.log(chalk.green(`✓ 正在打开 pong...`));
        openUrl(url);
    });

program
    .argument('[command]', '自定义应用命令')
    .action((command) => {
        if (command && apps[command]) {
            openUrl(apps[command]);
        } else {
            program.outputHelp();
        }
    });

async function main() {
    const args = process.argv.slice(2);

    const knownCommands = ['ai', 'list', 'history', 'config', 'macros', 'save', 'run', 'help', 'shici', 'dict', 'pong', 'capabilities'];
    const globalFlags = ['-h', '--help', '-V', '--version', '-v'];
    const firstArg = args[0];
    const isKnownCommand = firstArg && knownCommands.includes(firstArg);
    const isGlobalFlag = firstArg && globalFlags.includes(firstArg);

    if (!isKnownCommand && !isGlobalFlag) {
        const stdinData = await readStdin();

        if (stdinData || args.length > 0) {
            const options = parseOptionsFromArgs(args);
            let question = args.filter(arg => !arg.startsWith('-')).join(' ');

            if (stdinData) {
                // 检查 stdin 数据是否是特殊语法
                const stdinTrimmed = stdinData.trim();
                const isStdinSpecialSyntax = stdinTrimmed.startsWith('@') ||
                                           stdinTrimmed.startsWith('#') ||
                                           stdinTrimmed === ':ls' ||
                                           stdinTrimmed === ':clear';

                if (isStdinSpecialSyntax) {
                    const result = await handleSpecialSyntax(stdinData, '');

                    if (result.processed) {
                        // 如果特殊语法被处理，使用处理结果作为问题
                        if (result.result) {
                            question = result.result;
                        } else {
                            // 如果没有结果，可能只是执行了命令，直接退出
                            process.exit(0);
                        }
                    } else {
                        // 如果没有被处理，继续使用原始问题
                        console.log('警告: 未能处理特殊语法，使用原始输入');
                        if (options.withContent) {
                            const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                            const filePaths = parseFilePathsFromLsOutput(stdinData);
                            const contentMap = readFilesContent(filePaths);
                            question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                        } else {
                            question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                        }
                    }
                } else {
                    if (options.withContent) {
                        const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                        const filePaths = parseFilePathsFromLsOutput(stdinData);
                        const contentMap = readFilesContent(filePaths);
                        question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                    } else {
                        question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                    }
                }
            }

            // 如果 question 本身包含特殊语法（没有 stdin 或 stdin 不是特殊语法）
            if (!stdinData || !(stdinData.trim().startsWith('@') || stdinData.trim().startsWith('#') || stdinData.trim() === ':ls' || stdinData.trim() === ':clear')) {
                const questionTrimmed = (question || '').trim();
                const isQuestionSpecialSyntax = questionTrimmed.startsWith('@') ||
                                              questionTrimmed.startsWith('#') ||
                                              questionTrimmed === ':ls' ||
                                              questionTrimmed === ':clear';

                if (isQuestionSpecialSyntax) {
                    const result = await handleSpecialSyntax(question, stdinData);

                    if (result.processed) {
                        // 如果特殊语法被处理
                        if (result.result) {
                            // 检查是否是管理命令（如 :ls, :clear），这些命令的结果应该直接输出
                            const isManagementCommand = question.trim() === ':ls' || question.trim() === ':clear';

                            if (isManagementCommand) {
                                // 直接输出结果并退出
                                console.log(result.result);
                                process.exit(0);
                            } else {
                                // 对于文件/目录引用，将结果作为问题传递给AI
                                question = result.result;
                            }
                        } else {
                            // 如果没有结果，可能只是执行了命令，直接退出
                            process.exit(0);
                        }
                    } else {
                        // 如果没有被处理，继续使用原始问题
                        console.log('警告: 未能处理特殊语法，使用原始输入');
                    }
                }
            }

            let model = options.model;
            if (options.exec) {
                await handleAICommand(question, { execute: false, model, verbose: options.withContent });
            } else {
                await handleAIChat(question || null, model);
            }
            process.exit(0);
        }
    }

    program.parse();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

````

## 📄 `src/cli.ts.backup`

````text
#!/usr/bin/env node
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Command } from 'commander';
import { handleAICommand } from './commands/handleAICommand';
import { handleAIChat } from './commands/handleAIChat';
import { handleConfig } from './commands/handleConfig';
import { registerCapabilityCommands } from './commands/capabilityCommands';
import { loadAppsConfig, openUrl, DEFAULT_APPS } from './core/apps';
import { getMacros, saveMacro, runMacro } from './core/macros';
import { getCommandHistory } from './utils/history';

// Mandatory Node.js version check
const majorVersion = Number(process.versions.node.split('.')[0]);
if (majorVersion < 18) {
    console.error(chalk.red(`Error: yuangs requires Node.js >= 18. Current version: ${process.version}`));
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

const program = new Command();

program
    .name('yuangs')
    .description('苑广山的个人命令行工具')
    .version(version, '-V, --version');

async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        // Simple timeout to avoid hanging if no input
        setTimeout(() => resolve(data), 2000);
    });
}

function parseOptionsFromArgs(args: string[]): {
    exec: boolean;
    model?: string;
    withContent: boolean;
} {
    return {
        exec: args.includes('-e') || args.includes('--exec'),
        model: getArgValue(args, ['-m', '--model']) || getModelFromShortcuts(args),
        withContent: args.includes('-w') || args.includes('--with-content')
    };
}

function getModelFromShortcuts(args: string[]): string | undefined {
    if (args.includes('-p')) return 'gemini-2.5-flash-lite';
    if (args.includes('-f')) return 'gemini-2.5-flash-lite';
    if (args.includes('-l')) return 'gemini-2.5-flash-lite';
    return undefined;
}

function getArgValue(args: string[], flags: string[]): string | undefined {
    for (let i = 0; i < args.length; i++) {
        for (const flag of flags) {
            if (args[i] === flag && i + 1 < args.length && !args[i + 1].startsWith('-')) {
                return args[i + 1];
            }
        }
    }
    return undefined;
}

program
    .command('ai [question...]')
    .description('向 AI 提问')
    .option('-e, --exec', '生成并执行 Linux 命令')
    .option('-m, --model <model>', '指定 AI 模型')
    .option('-p', '使用 Pro 模型 (gemini-2.5-flash-lite)')
    .option('-f', '使用 Flash 模型 (gemini-2.5-flash-lite)')
    .option('-l', '使用 Lite 模型 (gemini-2.5-flash-lite)')
    .option('-w, --with-content', '在管道模式下读取文件内容')
    .option('--verbose', '详细输出（显示 Capability 匹配详情）')
    .action(async (questionArgs, options) => {
        const stdinData = await readStdin();
        let question = Array.isArray(questionArgs) ? questionArgs.join(' ').trim() : questionArgs || '';

        if (stdinData) {
            if (options.withContent) {
                const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                const filePaths = parseFilePathsFromLsOutput(stdinData);
                const contentMap = readFilesContent(filePaths);
                question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
            } else {
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
        }

        let model = options.model;
        if (options.p) model = 'gemini-2.5-flash-lite';
        if (options.f) model = 'gemini-2.5-flash-lite';
        if (options.l) model = 'gemini-2.5-flash-lite';

        if (options.exec) {
            await handleAICommand(question, { execute: false, model, verbose: options.verbose });
        } else {
            await handleAIChat(question || null, model);
        }
    });

program
    .command('list')
    .description('列出所有应用')
    .action(() => {
        const apps = loadAppsConfig();
        console.log(chalk.bold.cyan('\n📱 应用列表\n'));
        Object.entries(apps).forEach(([key, url]) => {
            console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(10))} ${chalk.blue(url)}`);
        });
    });

program
    .command('history')
    .description('查看及执行命令历史')
    .option('-l, --last', '执行上一条命令')
    .action(async (options) => {
        const history = getCommandHistory();
        if (history.length === 0) {
            console.log(chalk.gray('暂无命令历史\n'));
            return;
        }

        if (options.last) {
            const lastItem = history[0]; // history is unshift-ed, so 0 is latest
            console.log(chalk.bold.cyan('\n📋 上一次执行的命令:\n'));
            console.log(chalk.white(`${lastItem.command}`));
            console.log(chalk.gray(`问题: ${lastItem.question}\n`));

            const rlLast = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const confirmLast = await rlLast.question(chalk.cyan('确认再次执行? (y/N): '));
            rlLast.close();

            if (confirmLast.toLowerCase() === 'y' || confirmLast.toLowerCase() === 'yes') {
                const { exec } = require('child_process');
                console.log(chalk.bold.cyan('执行中...\n'));
                exec(lastItem.command, (error: any, stdout: string, stderr: string) => {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(chalk.red(stderr));
                    if (error) console.error(chalk.red(error.message));
                    process.exit(0);
                });
                return;
            } else {
                console.log(chalk.gray('已取消执行'));
            }
            return;
        }

        console.log(chalk.bold.cyan('\n📋 命令历史\n'));
        history.forEach((item, index) => {
            console.log(`${index + 1}. ${chalk.white(item.command)}`);
            console.log(chalk.gray(`   问题: ${item.question}\n`));
        });

        const rlHistory = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const indexInput = await rlHistory.question(chalk.cyan('输入序号选择命令 (直接回车取消): '));
        rlHistory.close();

        if (indexInput.trim()) {
            const index = parseInt(indexInput) - 1;
            if (index >= 0 && index < history.length) {
                const targetCommand = history[index].command;
                console.log(chalk.yellow(`\n即将执行: ${targetCommand}\n`));
                const rlConfirm = require('node:readline/promises').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const confirm = await rlConfirm.question(chalk.cyan('确认执行? (y/N): '));
                rlConfirm.close();

                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    const { exec } = require('child_process');
                    console.log(chalk.bold.cyan('执行中...\n'));
                    exec(targetCommand, (error: any, stdout: string, stderr: string) => {
                        if (stdout) console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));
                        if (error) console.error(chalk.red(error.message));
                        process.exit(0);
                    });
                    return;
                } else {
                    console.log(chalk.gray('已取消执行'));
                }
            } else {
                console.log(chalk.red('无效的序号'));
            }
        }
    });

program
    .command('config')
    .description('管理本地配置 (~/.yuangs.json)')
    .argument('[action]', 'get, set, list')
    .argument('[key]', '配置项名称')
    .argument('[value]', '配置项值')
    .action(handleConfig);

program
    .command('macros')
    .description('查看所有快捷指令')
    .action(() => {
        const allMacros = getMacros();
        console.log(chalk.bold.cyan('\n🚀 快捷指令列表\n'));
        Object.keys(allMacros).forEach(name => {
            console.log(`  ${chalk.white(name)}: ${chalk.gray(allMacros[name].commands)}`);
        });
    });

program
    .command('save <name>')
    .description('保存快捷指令')
    .option('-l, --from-last', 'save last executed AI command')
    .option('-g, --global', 'add alias to ~/.zshrc')
    .action(async (name, options) => {
        const addToZshrc = (aliasName: string) => {
            const zshrcPath = path.join(os.homedir(), '.zshrc');
            if (fs.existsSync(zshrcPath)) {
                const aliasLine = `alias ${aliasName}="yuangs run ${aliasName}"`;
                try {
                    const content = fs.readFileSync(zshrcPath, 'utf8');
                    if (!content.includes(aliasLine)) {
                        fs.appendFileSync(zshrcPath, `\n${aliasLine}\n`);
                        console.log(chalk.green(`✓ 已添加 alias 到 ~/.zshrc`));
                        console.log(chalk.yellow(`ℹ️  请运行 "source ~/.zshrc" 以生效`));
                    } else {
                        console.log(chalk.yellow(`ℹ️  Alias "${aliasName}" 已存在于 ~/.zshrc`));
                    }
                } catch (err) {
                    console.error(chalk.red(`❌ 无法写入 ~/.zshrc: ${(err as Error).message}`));
                }
            } else {
                console.log(chalk.red(`❌ 未找到 ~/.zshrc`));
            }
        };

        if (options.fromLast) {
            const history = getCommandHistory();
            if (history.length === 0) {
                console.log(chalk.red('❌ 暂无 AI 命令历史'));
                return;
            }
            const lastItem = history[0];

            saveMacro(name, lastItem.command, `Saved from: ${lastItem.question}`);
            console.log(chalk.green(`✓ 已将最近一条 AI 命令保存为 "${name}"`));
            console.log(chalk.gray(`  Command: ${lastItem.command}`));

            if (options.global) {
                addToZshrc(name);
            }
            return;
        }

        const rl = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const cmd = await rl.question(chalk.cyan('请输入要保存的命令: '));
        saveMacro(name, cmd);
        console.log(chalk.green(`✓ 快捷指令 "${name}" 已保存`));
        rl.close();

        if (options.global) {
            addToZshrc(name);
        }
    });

program
    .command('run <name>')
    .description('执行快捷指令')
    .action((name) => {
        if (runMacro(name)) {
            console.log(chalk.green(`✓ 正在执行 "${name}"...`));
        } else {
            console.log(chalk.red(`错误: 快捷指令 "${name}" 不存在`));
        }
    });

registerCapabilityCommands(program);

program
    .command('help')
    .description('显示帮助信息')
    .action(() => {
        console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
        console.log(chalk.yellow(`当前版本: ${version}`));
        console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
        console.log(chalk.bold('命令列表:'));
        console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问`);
        console.log(`    ${chalk.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
        console.log(`  ${chalk.green('list')}              列出所有应用`);
        console.log(`  ${chalk.green('history')}           查看命令历史`);
        console.log(`  ${chalk.green('config')}            管理本地配置 (~/.yuangs.json)`);
        console.log(`  ${chalk.green('macros')}            查看所有快捷指令`);
        console.log(`  ${chalk.green('save')} <名称>      保存快捷指令`);
        console.log(`  ${chalk.green('run')} <名称>        执行快捷指令`);
        console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
    });

const apps = loadAppsConfig();

program
    .command('shici')
    .description('打开古诗词 PWA')
    .action(() => {
        const url = apps['shici'] || DEFAULT_APPS['shici'];
        console.log(chalk.green(`✓ 正在打开 shici...`));
        openUrl(url);
    });

program
    .command('dict')
    .description('打开英语词典')
    .action(() => {
        const url = apps['dict'] || DEFAULT_APPS['dict'];
        console.log(chalk.green(`✓ 正在打开 dict...`));
        openUrl(url);
    });

program
    .command('pong')
    .description('打开 Pong 游戏')
    .action(() => {
        const url = apps['pong'] || DEFAULT_APPS['pong'];
        console.log(chalk.green(`✓ 正在打开 pong...`));
        openUrl(url);
    });

program
    .argument('[command]', '自定义应用命令')
    .action((command) => {
        if (command && apps[command]) {
            openUrl(apps[command]);
        } else {
            program.outputHelp();
        }
    });

async function main() {
    const args = process.argv.slice(2);

    const knownCommands = ['ai', 'list', 'history', 'config', 'macros', 'save', 'run', 'help', 'shici', 'dict', 'pong', 'capabilities'];
    const globalFlags = ['-h', '--help', '-V', '--version', '-v'];
    const firstArg = args[0];
    const isKnownCommand = firstArg && knownCommands.includes(firstArg);
    const isGlobalFlag = firstArg && globalFlags.includes(firstArg);

    if (!isKnownCommand && !isGlobalFlag) {
        const stdinData = await readStdin();

        if (stdinData || args.length > 0) {
            const options = parseOptionsFromArgs(args);
            let question = args.filter(arg => !arg.startsWith('-')).join(' ');

            if (stdinData) {
                if (options.withContent) {
                    const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                    const filePaths = parseFilePathsFromLsOutput(stdinData);
                    const contentMap = readFilesContent(filePaths);
                    question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                } else {
                    question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                }
            }

            let model = options.model;
            if (options.exec) {
                await handleAICommand(question, { execute: false, model, verbose: options.withContent });
            } else {
                await handleAIChat(question || null, model);
            }
            process.exit(0);
        }
    }

    program.parse();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

````

## 📄 `src/commands/capabilityCommands.ts`

````typescript
import chalk from 'chalk';
import { Command } from 'commander';
import { AtomicCapability, COMPOSITE_CAPABILITIES } from '../core/capabilities';
import { CapabilitySystem } from '../core/capabilitySystem';
import { CapabilityRequirement } from '../core/modelMatcher';
import { listExecutionRecords } from '../core/executionStore';
import { ReplayMode } from '../core/replayEngine';

export function registerCapabilityCommands(program: Command): void {
  const capProgram = program.command('capabilities').description('Capability system commands (new architecture)');

  capProgram
    .command('explain')
    .description('Explain current configuration with sources')
    .action(() => {
      const system = new CapabilitySystem();
      console.log(chalk.bold.cyan('\n📋 Configuration Snapshot\n'));
      console.log(system.explainConfig());
    });

  capProgram
    .command('match')
    .description('Test capability matching')
    .argument('<capabilities...>', 'Required capabilities (e.g., text_generation reasoning)')
    .action((capabilities) => {
      const system = new CapabilitySystem();

      const { AtomicCapability } = require('../core/capabilities');

      const requirement: CapabilityRequirement = {
        required: capabilities as any,
        preferred: [],
      };

      const result = system.matchCapability(requirement);

      console.log(chalk.bold.cyan('\n🤖 Capability Match Result\n'));

      if (!result.selected) {
        console.log(chalk.red('❌ No model satisfies requirements\n'));
        result.candidates.forEach(c => {
          console.log(chalk.yellow(`${c.modelName} (${c.provider}):`));
          console.log(chalk.gray(`  ${c.reason}\n`));
        });
        return;
      }

      console.log(chalk.green(`✅ Selected: ${result.selected.name} (${result.selected.provider})\n`));

      console.log(chalk.bold('Capability coverage:'));
      result.selected.atomicCapabilities.forEach(cap => {
        console.log(chalk.green(`  ✓ ${cap}`));
      });

      if (result.fallbackOccurred) {
        console.log(chalk.yellow('\n⚠️  Fallback was used'));
      }

      console.log(chalk.bold('\nAll candidates:'));
      result.candidates.forEach(c => {
        const icon = c.hasRequired ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${c.modelName} (${c.provider})`);
        console.log(chalk.gray(`    ${c.reason}\n`));
      });
    });

  capProgram
    .command('list')
    .description('List all available capabilities')
    .action(() => {
      console.log(chalk.bold.cyan('\n📦 Available Capabilities\n'));

      console.log(chalk.bold('Atomic Capabilities:'));
      Object.values(AtomicCapability).forEach(cap => {
        console.log(`  - ${chalk.green(cap)}`);
      });

      console.log(chalk.bold('\nComposite Capabilities:'));
      COMPOSITE_CAPABILITIES.forEach(comp => {
        console.log(`  - ${chalk.cyan(comp.name)}`);
        console.log(chalk.gray(`    Composed of: ${comp.composedOf.join(', ')}`));
      });
    });

  capProgram
    .command('history')
    .description('List execution history')
    .option('-l, --limit <n>', 'Limit number of records', '10')
    .action((options) => {
      const limit = parseInt(options.limit);
      const records = listExecutionRecords(limit);

      if (records.length === 0) {
        console.log(chalk.gray('📭 No execution history found\n'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📋 Execution History (last ${records.length})\n`));

      records.forEach((record, idx) => {
        const status = record.outcome.success
          ? chalk.green('✓')
          : chalk.red('✗');
        const model = record.decision.selectedModel?.name || 'N/A';
        const time = new Date(record.meta.timestamp).toLocaleString();

        console.log(`${status} ${chalk.white(record.id)}`);
        console.log(chalk.gray(`  Command: ${record.meta.commandName}`));
        console.log(chalk.gray(`  Model: ${model}`));
        console.log(chalk.gray(`  Time: ${time}\n`));
      });
    });

  capProgram
    .command('replay <id>')
    .description('Replay an execution')
    .option('-s, --strict', 'Strict replay (use exact model)')
    .option('-c, --compatible', 'Compatible replay (allow fallback)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (id, options) => {
      const system = new CapabilitySystem();

      let mode: ReplayMode = 'strict';
      if (options.compatible) mode = 'compatible';

      const result = await system.replayExecution(id, {
        mode,
        skipAI: true,
        verbose: options.verbose,
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ ${result.message}\n`));
        if (result.executedModel) {
          console.log(chalk.gray(`Model: ${result.executedModel}`));
        }
      } else {
        console.log(chalk.red(`\n❌ ${result.message}\n`));
      }
    });
}

````

## 📄 `src/commands/contextBuffer.ts`

````typescript
export type ContextItem = {
    type: 'file' | 'directory';
    path: string;
    alias?: string;
    content: string;
    summary?: string;
    tokens: number;
};

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export class ContextBuffer {
    private items: ContextItem[] = [];
    private maxTokens = 8000;

    add(item: Omit<ContextItem, 'tokens'>, bypassTokenLimit: boolean = false) {
        const tokens = estimateTokens(item.content);
        this.items.push({ ...item, tokens });
        if (!bypassTokenLimit) {
            this.trimIfNeeded();
        }
    }

    clear() {
        this.items = [];
    }

    list() {
        return this.items.map((item, i) => ({
            index: i + 1,
            type: item.type,
            path: item.path,
            alias: item.alias,
            tokens: item.tokens,
            summary: item.summary
        }));
    }

    isEmpty() {
        return this.items.length === 0;
    }

    export() {
        return this.items;
    }

    import(items: ContextItem[]) {
        this.items = items;
    }

    private totalTokens() {
        return this.items.reduce((sum, i) => sum + i.tokens, 0);
    }

    private trimIfNeeded() {
        while (this.totalTokens() > this.maxTokens) {
            this.items.shift();
        }
    }

    buildPrompt(userInput: string): string {
        const contextBlock = this.items.map(item => {
            const title = item.alias
                ? `${item.type}：${item.alias} (${item.path})`
                : `${item.type}：${item.path}`;

            const body = item.summary ?? item.content;

            return `${title}\n\`\`\`\n${body}\n\`\`\``;
        }).join('\n\n');

        return `
你正在基于以下上下文回答问题：

${contextBlock}

用户问题：
${userInput}
`;
    }
}
// Test change for git diff
// Another test change (unstaged)

````

## 📄 `src/commands/contextStorage.ts`

````typescript
import fs from 'fs/promises';
import path from 'path';
import { ContextItem } from './contextBuffer';

const CONTEXT_DIR = path.resolve(process.cwd(), '.ai');
const CONTEXT_FILE = path.join(CONTEXT_DIR, 'context.json');

export async function loadContext(): Promise<ContextItem[]> {
    try {
        const raw = await fs.readFile(CONTEXT_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function saveContext(items: ContextItem[]) {
    await fs.mkdir(CONTEXT_DIR, { recursive: true });
    await fs.writeFile(CONTEXT_FILE, JSON.stringify(items, null, 2));
}

export async function clearContextStorage() {
    await fs.rm(CONTEXT_FILE, { force: true });
}

````

## 📄 `src/commands/gitContext.ts`

````typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function run(cmd: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 });
        return stdout.trim() || null;
    } catch {
        return null;
    }
}

export async function getGitContext() {
    const staged = await run('git diff --staged');
    const unstaged = await run('git diff');

    if (!staged && !unstaged) return null;

    let result = `以下是 Git 变更内容：\n`;

    if (staged) {
        result += `\n【已暂存】\n\`\`\`diff\n${staged}\n\`\`\`\n`;
    }

    if (unstaged) {
        result += `\n【未暂存】\n\`\`\`diff\n${unstaged}\n\`\`\`\n`;
    }

    return result;
}

````

## 📄 `src/commands/handleAIChat.ts`

````typescript
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';
import * as marked from 'marked';
import TerminalRenderer from 'marked-terminal';
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
    updateGhost,
    clearGhost,
    renderGhost,
    listPlugins
} from './shellCompletions';
const execAsync = promisify(exec);

function findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

async function executeCommand(filePath: string, command?: string) {
    const fullPath = path.resolve(filePath);
    const commandStr = command || '';

    if (command) {
        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(fullPath) });
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    } else {
        const { stdout, stderr } = await exec(fullPath, { cwd: process.cwd() });
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    }
}

async function readFileContent(filePath: string): Promise<string> {
    const fullPath = path.resolve(filePath);
    return await fs.promises.readFile(fullPath, 'utf-8');
}

async function showFileSelector(rl: readline.Interface): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);

            if (files.length === 0) {
                console.log(chalk.yellow('当前目录为空\n'));
                resolve(null);
                return;
            }

            console.log(chalk.bold.cyan('📁 当前目录文件列表:\n'));

            files.forEach((file, index) => {
                const fullPath = path.join(currentDir, file);
                const isDir = fs.statSync(fullPath).isDirectory();
                const icon = isDir ? chalk.cyan('📁') : chalk.green('📄');
                const padding = (index + 1).toString().padStart(2);
                console.log(`  [${padding}] ${icon} ${file}`);
            });
            console.log();

            rl.question(chalk.cyan('请选择文件 (输入序号，或按 Enter 返回): '), (choice) => {
                if (choice.trim() === '') {
                    console.log(chalk.gray('已取消选择\n'));
                    resolve(null);
                    return;
                }

                const index = parseInt(choice) - 1;
                if (isNaN(index) || index < 0 || index >= files.length) {
                    console.log(chalk.red('无效的序号\n'));
                    resolve(null);
                    return;
                }

                const selectedFile = files[index];
                console.log(chalk.green(`✓ 已选择: ${selectedFile}\n`));
                resolve(selectedFile);
            });
        } catch (error) {
            console.error(chalk.red(`读取目录失败: ${error}\n`));
            resolve(null);
        }
    });
}

async function handleFileReference(filePath: string, question?: string): Promise<string> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        console.log(chalk.red(`错误: 文件 "${filePath}" 不存在或不是一个文件\n`));
        return question || '';
    }

    const spinner = ora(chalk.cyan('正在读取文件...')).start();

    try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(process.cwd(), fullPath);

        const contentMap = new Map<string, string>();
        contentMap.set(relativePath, content);

        const prompt = buildPromptWithFileContent(
            `文件: ${relativePath}`,
            [relativePath],
            contentMap,
            question || `请分析文件: ${relativePath}`
        );

        spinner.stop();
        console.log(chalk.green(`✓ 已读取文件: ${relativePath}\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取文件失败: ${error}\n`));
        return question || '';
    }
}

async function handleFileReferenceInput(input: string): Promise<string> {
    const match = input.match(/^@\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: @文件路径 [问题]\n'));
        return '';
    }

    const filePath = match[1].trim();
    const question = match[2] ? match[2].trim() : '';
    return handleFileReference(filePath, question);
}

async function handleDirectoryReference(input: string): Promise<string> {
    const match = input.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: # 目录路径 [问题]\n'));
        return input;
    }

    const dirPath = match[1].trim();
    const question = match[2] ? match[2].trim() : '请分析这个目录下的文件';

    const fullPath = path.resolve(dirPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
        return question;
    }

    const spinner = ora(chalk.cyan('正在读取文件...')).start();

    try {
        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;

        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);

        spinner.stop();

        if (filePaths.length === 0) {
            console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
            return question;
        }

        const contentMap = readFilesContent(filePaths);

        const prompt = buildPromptWithFileContent(
            `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
            filePaths.map(p => path.relative(process.cwd(), p)),
            contentMap,
            question
        );

        console.log(chalk.green(`✓ 已读取 ${contentMap.size} 个文件\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取目录失败: ${error}\n`));
        return question;
    }
}

export async function handleAIChat(initialQuestion: string | null, model?: string) {
    if (initialQuestion) {
        await askOnceStream(initialQuestion, model);
        return;
    }

    console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));

    const contextBuffer = new ContextBuffer();
    const persisted = await loadContext();
    contextBuffer.import(persisted);

    if (persisted.length > 0) {
        console.log(chalk.yellow(`📦 已恢复 ${persisted.length} 条上下文\n`));
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer: createCompleter(),
        historySize: 1000
    });

    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'r') {
            rl.write(null, { ctrl: true, name: 'r' });
        }
    });

    // Helper to wrap rl.question in a Promise
    const ask = (query: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(query, (answer) => {
                resolve(answer);
            });
        });
    };

    try {
        while (true) {
            const input = await ask(chalk.green('你：'));
            const trimmed = input.trim();

            if (trimmed.startsWith('@')) {
                rl.pause();
                try {
                    // 新增：支持执行命令的语法
                    // @ filename:command - 添加并执行命令
                    // @!filename - 添加并立即执行文件

                    const execMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^].*)?$/);
                    const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);

                    if (execMatch && execMatch[2]) {
                        // @ filename:command - 添加并执行命令
                        const filePath = execMatch[1].trim();
                        const commandStr = execMatch[2].trim();

                        const content = await readFileContent(filePath);

                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            content
                        });

                        const displayName = filePath;
                        console.log(chalk.green(`✓ 已加入文件上下文: ${displayName}\n`));
                        
                        await saveContext(contextBuffer.export());
                        
                        console.log(chalk.cyan(`⚡️  正在执行: ${commandStr}\n`));
                        
                        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(filePath) });
                        console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));

                        await saveContext(contextBuffer.export());
                        console.log(chalk.green(`✓ 执行完成\n`));

                        rl.resume();
                        continue;
                    }

                    if (immediateExecMatch) {
                        // @!filename - 添加并立即执行文件
                        const filePath = immediateExecMatch[1].trim();
                        const content = await readFileContent(filePath);
                        
                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            content
                        });

                        const displayName = filePath;
                        console.log(chalk.green(`✓ 已加入文件上下文: ${displayName}\n`));
                        
                        await saveContext(contextBuffer.export());
                        
                        console.log(chalk.cyan(`⚡️  正在执行: ${filePath}\n`));
                        
                        const { stdout, stderr } = await exec(filePath, { cwd: process.cwd() });
                        console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));

                        await saveContext(contextBuffer.export());
                        console.log(chalk.green(`✓ 执行完成\n`));

                        rl.resume();
                        continue;
                    }

                    // 增强的匹配模式，支持行号指定: @ filepath:startLine-endLine as alias
                    const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);
                    const filePath = match?.[1] ?? (await showFileSelector(rl));
                    const lineStart = match?.[2] ? parseInt(match[2]) : null;
                    const lineEnd = match?.[3] ? parseInt(match[3]) : null;
                    const alias = match?.[4];

                    if (!filePath) continue;

                    const absolutePath = path.resolve(filePath);
                    let content = await fs.promises.readFile(absolutePath, 'utf-8');

                    // 如果指定了行号范围，则提取相应行
                    if (lineStart !== null) {
                        const lines = content.split('\n');

                        // 验证行号范围
                        if (lineStart < 1 || lineStart > lines.length) {
                            console.log(chalk.red(`\n错误: 起始行号 ${lineStart} 超出文件范围 (文件共有 ${lines.length} 行)\n`));
                            rl.resume();
                            continue;
                        }

                        const startIdx = lineStart - 1; // 转换为数组索引（从0开始）
                        let endIdx = lineEnd ? Math.min(lineEnd, lines.length) : lines.length; // 如果未指定结束行，则到文件末尾

                        if (lineEnd && (lineEnd < lineStart || lineEnd > lines.length)) {
                            console.log(chalk.red(`\n错误: 结束行号 ${lineEnd} 超出有效范围 (应在 ${lineStart}-${lines.length} 之间)\n`));
                            rl.resume();
                            continue;
                        }

                        // 提取指定范围的行
                        content = lines.slice(startIdx, endIdx).join('\n');

                        // 更新路径显示，包含行号信息
                        const rangeInfo = lineEnd ? `${lineStart}-${lineEnd}` : `${lineStart}`;
                        const pathWithRange = `${filePath}:${rangeInfo}`;

                        contextBuffer.add({
                            type: 'file',
                            path: pathWithRange,
                            alias,
                            content
                        }, true); // bypassTokenLimit = true
                    } else {
                        // 原始行为：添加整个文件
                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            alias,
                            content
                        });
                    }

                    await saveContext(contextBuffer.export());
                    const displayName = alias ? `${alias} (${filePath}${lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''})` :
                        (filePath + (lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''));
                    console.log(chalk.green(`✅ 已加入文件上下文: ${displayName}\n`));
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}\n`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            if (trimmed.startsWith('#')) {
                rl.pause();
                try {
                    const match = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
                    if (!match) {
                        console.log(chalk.yellow('格式错误，正确用法: # 目录路径\n'));
                        rl.resume();
                        continue;
                    }

                    const dirPath = match[1].trim();
                    const fullPath = path.resolve(dirPath);

                    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
                        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
                        rl.resume();
                        continue;
                    }

                    const findCommand = process.platform === 'darwin' || process.platform === 'linux'
                        ? `find "${fullPath}" -type f`
                        : `dir /s /b "${fullPath}"`;

                    const { stdout } = await execAsync(findCommand);
                    const filePaths = stdout.trim().split('\n').filter(f => f);

                    if (filePaths.length === 0) {
                        console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
                        rl.resume();
                        continue;
                    }

                    const contentMap = readFilesContent(filePaths);
                    const prompt = buildPromptWithFileContent(
                        `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
                        filePaths.map(p => path.relative(process.cwd(), p)),
                        contentMap,
                        ''
                    );

                    contextBuffer.add({
                        type: 'directory',
                        path: dirPath,
                        content: prompt
                    });

                    await saveContext(contextBuffer.export());
                    console.log(chalk.green(`✅ 已加入目录上下文: ${dirPath}\n`));
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}\n`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log(chalk.cyan('👋 再见！'));
                break;
            }

            if (trimmed === '/clear') {
                clearConversationHistory();
                console.log(chalk.yellow('✓ 对话历史已清空\n'));
                continue;
            }

            if (trimmed === '/history') {
                const history = getConversationHistory();
                if (history.length === 0) {
                    console.log(chalk.gray('暂无对话历史\n'));
                } else {
                    history.forEach((msg) => {
                        const prefix = msg.role === 'user' ? chalk.green('你: ') : chalk.blue('AI: ');
                        console.log(prefix + msg.content);
                    });
                }
                continue;
            }

            if (trimmed === ':ls') {
                const list = contextBuffer.list();
                if (list.length === 0) {
                    console.log(chalk.gray('📭 当前没有上下文\n'));
                } else {
                    console.table(list);
                }
                continue;
            }

            if (trimmed === ':clear') {
                contextBuffer.clear();
                await clearContextStorage();
                console.log(chalk.yellow('🧹 上下文已清空（含持久化）\n'));
                continue;
            }

            if (trimmed === ':plugins') {
                const plugins = listPlugins();
                if (plugins.length === 0) {
                    console.log(chalk.gray('📭 当前没有加载的插件\n'));
                } else {
                    console.log(chalk.cyan('已加载的插件:\n'));
                    plugins.forEach(p => console.log(chalk.green(`  - ${p}`)));
                    console.log();
                }
                continue;
            }

            if (!trimmed) continue;

            const mode = detectMode(trimmed);

            if (mode === 'command') {
                rl.pause();
                try {
                    await shellExecuteCommand(trimmed, (code) => {
                        if (code !== 0) {
                            console.log(chalk.red(`\n[command exited with code ${code}]\n`));
                        }
                    });
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[Command Error]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            let finalPrompt = contextBuffer.isEmpty()
                ? trimmed
                : contextBuffer.buildPrompt(trimmed);

            const gitContext = await getGitContext();

            if (gitContext) {
                finalPrompt = `
${gitContext}

${finalPrompt}
`;
            }

            try {
                rl.pause();
                await askOnceStream(finalPrompt, model);

                contextBuffer.clear();
                await saveContext([]);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(chalk.red(`\n[AI execution error]: ${message}`));
            } finally {
                rl.resume();
            }
        }
    } catch (criticalErr: unknown) {
        const message = criticalErr instanceof Error ? criticalErr.message : String(criticalErr);
        console.error(chalk.red(`\n[Critical Loop Error]: ${message}`));
    } finally {
        rl.close();
    }
}

// 配置 marked 使用 TerminalRenderer
marked.setOptions({
    renderer: new TerminalRenderer({
        tab: 2,
        width: process.stdout.columns || 80,
        showSectionPrefix: false
    }) as any
});

async function askOnceStream(question: string, model?: string) {
    const startTime = Date.now();
    const messages = [...getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    let fullResponse = '';
    const BOT_PREFIX = chalk.bold.blue('🤖 AI：');



    try {
        let isFirstOutput = true;
        await callAI_Stream(messages, model, (chunk) => {
            if (spinner.isSpinning) {
                spinner.stop();
                if (isFirstOutput) {
                    process.stdout.write(BOT_PREFIX);
                    isFirstOutput = false;
                }
            }
            fullResponse += chunk;
            process.stdout.write(chunk);
        });

        const formatted = (marked.parse(fullResponse, { async: false }) as string).trim();

        if (process.stdout.isTTY) {
            // TTY模式（交互模式）
            // 1. 先输出原本的流式内容（Raw）
            // 2. 结束时，计算 Raw 内容的高度（Visual Line Count）
            // 3. 向上清除相应行数
            // 4. 输出渲染后的 Markdown 内容

            const screenWidth = process.stdout.columns || 80;
            const totalContent = BOT_PREFIX + fullResponse;
            let lineCount = getVisualLineCount(totalContent, screenWidth);

            // 清除 Raw Output
            // 移至当前行开头并清除
            process.stdout.write('\r\x1b[K');
            // 向上移动并清除
            for (let i = 0; i < lineCount - 1; i++) {
                process.stdout.write('\x1b[A\x1b[K');
            }

            // 输出格式化的 Markdown 内容
            process.stdout.write(BOT_PREFIX + formatted + '\n');
        } else {
            // 非TTY模式（如管道模式）
            // 只输出格式化内容，不执行清除逻辑，避免转义序列可见
            if (spinner.isSpinning) {
                spinner.stop();
            }
            process.stdout.write(BOT_PREFIX + formatted + '\n');
        }

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);

        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\n' + chalk.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}

function getVisualLineCount(text: string, screenWidth: number): number {
    const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        // Expand tabs (assuming 8 spaces)
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            // Most characters > 255 are 2 cells (CJK, Emojis, etc.)
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

````

## 📄 `src/commands/handleAICommand.ts`

````typescript
import chalk from 'chalk';
import ora from 'ora';
import { getOSProfile } from '../core/os';
import { buildCommandPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { exec } from '../core/executor';
import { assessRisk } from '../core/risk';
import { autoFixCommand } from '../core/autofix';
import { confirm } from '../utils/confirm';
import { saveHistory } from '../utils/history';
import { safeParseJSON, AICommandPlan, AIFixPlan } from '../core/validation';
import { getMacros, runMacro } from '../core/macros';
import { CapabilitySystem } from '../core/capabilitySystem';
import { inferCapabilityRequirement } from '../core/capabilityInference';
import { CapabilityMatchResult } from '../core/modelMatcher';

function validateAIPlan(obj: any): obj is AICommandPlan {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.plan === 'string' &&
        ['low', 'medium', 'high'].includes(obj.risk) &&
        (typeof obj.command === 'string' || typeof obj.macro === 'string')
    );
}

export async function handleAICommand(
    userInput: string,
    options: { execute: boolean; model?: string; dryRun?: boolean; autoYes?: boolean; verbose?: boolean }
) {
    const os = getOSProfile();
    const macros = getMacros();
    const capabilitySystem = new CapabilitySystem();
    const spinner = ora(chalk.cyan('🧠 AI 正在规划中...')).start();

    const startTime = Date.now();

    try {
        const requirement = inferCapabilityRequirement(userInput);

        let matchResult: CapabilityMatchResult;
        let selectedModel: string;

        if (options.model) {
            matchResult = {
                selected: null,
                candidates: [],
                fallbackOccurred: false,
            };

            selectedModel = options.model;
        } else {
            matchResult = capabilitySystem.matchCapability(requirement);
            selectedModel = matchResult.selected?.name || 'gemini-2.5-flash-lite';
        }

        spinner.stop();

        const prompt = buildCommandPrompt(userInput, os, macros);
        const raw = await askAI(prompt, selectedModel);

        const { aiCommandPlanSchema } = require('../core/validation');
        const parseResult = safeParseJSON(raw, aiCommandPlanSchema, {} as AICommandPlan);

        if (!parseResult.success) {
            console.log(chalk.red('\n❌ AI 输出不是合法 JSON:'));
            console.log(raw);
            console.log(chalk.gray('\n验证错误: ' + parseResult.error.issues.map((e: any) => e.message).join(', ')));
            return { code: 1 };
        }

        const plan = parseResult.data;

        const isUsingMacro = !!plan.macro;
        let actualCommand = plan.macro ? macros[plan.macro]?.commands : plan.command;

        if (!actualCommand) {
            console.log(chalk.red('\n❌ 无效的计划：'));
            if (plan.macro) {
                console.log(chalk.red(`未找到名为 "${plan.macro}" 的 Macro`));
            } else {
                console.log(chalk.red('未提供有效的命令'));
            }
            return { code: 1 };
        }

        const commandToExecute: string = actualCommand;
        const finalRisk = assessRisk(commandToExecute, plan.risk);

        console.log(chalk.bold.cyan('\n🧠 计划: ') + plan.plan);

        if (isUsingMacro) {
            console.log(chalk.bold.green('✨ 复用 Macro: ') + chalk.yellow(plan.macro!));
            console.log(chalk.gray('   (已验证的命令，无需重新生成)'));
        } else {
            console.log(chalk.bold.green('💻 命令: ') + chalk.yellow(commandToExecute));
        }

        const riskColor = finalRisk === 'high' ? chalk.red : (finalRisk === 'medium' ? chalk.yellow : chalk.green);
        console.log(chalk.bold('⚠️  风险判断: ') + riskColor(finalRisk.toUpperCase()));

        if (options.verbose) {
            console.log(chalk.bold.cyan('\n🔍 Capability 匹配详情:'));
            console.log(chalk.gray(`  用户意图能力: ${requirement.required.join(', ')}`));
            console.log(chalk.gray(`  使用的模型: ${selectedModel}`));

            if (matchResult.selected) {
                console.log(chalk.gray(`  模型能力覆盖: ${matchResult.selected.atomicCapabilities.join(', ')}`));
            }

            if (matchResult.fallbackOccurred) {
                console.log(chalk.yellow('  ⚠️  触发了 Fallback'));
            }

            matchResult.candidates.forEach(c => {
                const icon = c.hasRequired ? chalk.green('✓') : chalk.red('✗');
                console.log(chalk.gray(`  ${icon} ${c.modelName}: ${c.reason}`));
            });
        }

        if (options.dryRun) {
            console.log(chalk.gray('\n[Dry Run] 仅模拟，不执行命令。'));
            return { code: 0 };
        }

        console.log(chalk.gray('─'.repeat(50)));
        if (isUsingMacro) {
            console.log(chalk.yellow('⚠️  注意: AI 正在复用已验证的 Macro。'));
        } else {
            console.log(chalk.yellow('⚠️  注意: 以上命令由 AI 生成，请在执行前仔细检查。'));
            console.log(chalk.gray('   AI 可能会犯错，安全由您掌控。'));
        }
        console.log(chalk.gray('─'.repeat(50)));

        let shouldExecute = options.execute || options.autoYes;

        if (!shouldExecute) {
            shouldExecute = await confirm('是否执行该命令？');
        }

        if (!shouldExecute) {
            console.log(chalk.gray('执行已取消。'));
            return { code: 1 };
        }

        console.log(chalk.gray('\n执行中...\n'));
        let result: { code: number | null; stdout?: string; stderr?: string };

        if (isUsingMacro) {
            const macroSuccess = runMacro(plan.macro!);
            result = { code: 0, stdout: '', stderr: '' };
            console.log(chalk.green('✓ Macro 已执行'));
        } else {
            result = await exec(commandToExecute);
        }

        const latencyMs = Date.now() - startTime;

        if (!isUsingMacro && result.code !== 0 && result.code !== null) {
            console.log(chalk.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await autoFixCommand(
                commandToExecute,
                result.stderr!,
                os,
                selectedModel
            );

            if (fixedPlan && fixedPlan.command) {
                console.log(chalk.bold.cyan('🔁 修复方案: ') + fixedPlan.plan);
                console.log(chalk.bold.green('💻 修复命令: ') + chalk.yellow(fixedPlan.command));

                const retry = await confirm('是否执行修复后的命令？');
                if (retry) {
                    console.log(chalk.gray('\n正在重试...\n'));
                    result = await exec(fixedPlan.command);
                    if (result.code === 0) {
                        saveHistory({
                            question: userInput,
                            command: fixedPlan.command,
                        });
                        console.log(chalk.green('\n✓ 修复命令执行成功并已存入历史库'));
                        return result;
                    }
                }
            }
        }

        if (result.code === 0) {
            saveHistory({
                question: userInput,
                command: commandToExecute,
            });

            if (isUsingMacro) {
                console.log(chalk.green('\n✓ Macro 执行成功并已存入历史库'));
            } else {
                console.log(chalk.green('\n✓ 执行成功并已存入历史库'));
            }

            if (!isUsingMacro) {
                capabilitySystem.createAndSaveExecutionRecord(
                    'ai-command',
                    requirement,
                    matchResult,
                    commandToExecute
                );
            }
        }

        return result;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red('发生错误: ' + message));
        return { code: 1 };
    }
}

````

## 📄 `src/commands/handleConfig.ts`

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { parseUserConfig, userConfigSchema, type UserConfig } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

export function handleConfig(args: string[]) {
    const action = args[0]; // get, set, list

    if (!action || action === 'list') {
        const config = readConfig();
        console.log(chalk.bold.cyan('\n⚙️  当前配置 (~/.yuangs.json):\n'));
        if (Object.keys(config).length === 0) {
            console.log(chalk.gray('  (配置文件不存在或为空)'));
        } else {
            Object.entries(config).forEach(([key, value]) => {
                console.log(`  ${chalk.white(key)}: ${chalk.green(value)}`);
            });
        }
        console.log('\n使用方法:');
        console.log(chalk.gray('  yuangs config set <key> <value>'));
        console.log(chalk.gray('  yuangs config get <key>\n'));
        return;
    }

    if (action === 'set') {
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
            console.log(chalk.red('错误: 请提供 key 和 value。例如: yuangs config set defaultModel gemini-2.5-flash-lite'));
            return;
        }
        const config = readConfig();
        config[key] = value;
        writeConfig(config);
        console.log(chalk.green(`✓ 已将 ${key} 设置为 ${value}`));
        return;
    }

    if (action === 'get') {
        const key = args[1];
        if (!key) {
            console.log(chalk.red('错误: 请提供 key。例如: yuangs config get defaultModel'));
            return;
        }
        const config = readConfig();
        if (config[key] !== undefined) {
            console.log(config[key]);
        } else {
            console.log(chalk.yellow(`配置项 ${key} 不存在`));
        }
        return;
    }
}

function readConfig(): UserConfig {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return parseUserConfig(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function writeConfig(config: UserConfig) {
    const validated = userConfigSchema.parse(config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
}

````

## 📄 `src/commands/shellCompletions.ts`

````typescript
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { execSync } from 'child_process';

/* ========================================
   TYPE DEFINITIONS
   ======================================== */

export type Mode = 'chat' | 'file' | 'dir' | 'command';

export interface CompletionContext {
    line: string;
    cursor: number;
    mode: Mode;
    cwd: string;
}

export interface CommandPlugin {
    command: string;
    complete(args: string[], context: CompletionContext): string[];
}

/* ========================================
   PROJECT CONTEXT
   ======================================== */

let PROJECT_ROOT: string | null = null;

export function findProjectRoot(start = process.cwd()): string {
    if (PROJECT_ROOT) return PROJECT_ROOT;

    let dir = start;
    const MAX_DEPTH = 10;
    let depth = 0;

    while (dir !== path.dirname(dir) && depth < MAX_DEPTH) {
        if (fs.existsSync(path.join(dir, 'package.json')) ||
            fs.existsSync(path.join(dir, '.git'))) {
            PROJECT_ROOT = dir;
            return dir;
        }
        dir = path.dirname(dir);
        depth++;
    }

    PROJECT_ROOT = start;
    return start;
}

const PRIORITY_DIRS = ['src', 'packages', 'apps', 'lib', 'components'];

export function sortEntries(entries: fs.Dirent[]): fs.Dirent[] {
    return entries.sort((a, b) => {
        const ai = PRIORITY_DIRS.indexOf(a.name);
        const bi = PRIORITY_DIRS.indexOf(b.name);

        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}

/* ========================================
   CACHING SYSTEM
   ======================================== */

interface CacheEntry<T> {
    ts: number;
    value: T;
}

const cache = new Map<string, CacheEntry<any>>();
const TTL = 2000; // 2 seconds

export function cached<T>(key: string, fn: () => T): T {
    const now = Date.now();
    const hit = cache.get(key);

    if (hit && now - hit.ts < TTL) {
        return hit.value;
    }

    const value = fn();
    cache.set(key, { ts: now, value });
    return value;
}

export function clearCache(): void {
    cache.clear();
}

/* ========================================
   MODE DETECTION
   ======================================== */

export function detectMode(line: string): Mode {
    const trimmed = line.trimStart();

    // Check for explicit command prefixes
    if (trimmed.startsWith('$') || trimmed.startsWith('!')) {
        return 'command';
    }

    const tokens = line.split(/\s+/);
    const last = tokens[tokens.length - 1];

    // Check for file reference (@)
    if (last?.startsWith('@')) {
        return 'file';
    }

    // Check for directory reference (#)
    if (last?.startsWith('#')) {
        return 'dir';
    }

    // Check if first token is a command (fish-style)
    const first = tokens[0];
    if (first) {
        const commands = loadCommands();
        if (commands.includes(first)) {
            return 'command';
        }
    }

    // Default to chat mode
    return 'chat';
}

/* ========================================
   COMMAND COMPLETION (PATH)
   ======================================== */

let commandCache: string[] | null = null;

// Common shell builtins that should always be available
const SHELL_BUILTINS = [
    'cd', 'pwd', 'ls', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'cat',
    'echo', 'grep', 'find', 'head', 'tail', 'less', 'more',
    'chmod', 'chown', 'touch', 'ln', 'df', 'du', 'free',
    'ps', 'top', 'kill', 'killall', 'bg', 'fg', 'jobs',
    'export', 'unset', 'env', 'alias', 'unalias',
    'history', 'type', 'which', 'whereis', 'man',
    'sleep', 'wait', 'date', 'cal', 'uptime', 'uname',
    'tar', 'gzip', 'gunzip', 'zip', 'unzip',
    'curl', 'wget', 'ssh', 'scp', 'rsync'
];

export function loadCommands(): string[] {
    return cached('PATH_COMMANDS', () => {
        const paths = process.env.PATH?.split(path.delimiter) ?? [];
        const cmds = new Set<string>(SHELL_BUILTINS);

        for (const p of paths) {
            try {
                for (const f of fs.readdirSync(p)) {
                    cmds.add(f);
                }
            } catch {
                // Ignore directories we can't read
            }
        }

        commandCache = [...cmds];
        return commandCache;
    });
}

export function completeCommands(partial: string): string[] {
    return loadCommands().filter(cmd => cmd.startsWith(partial));
}

/* ========================================
   FILE/DIRECTORY COMPLETION
   ======================================== */

function splitToken(line: string): { prefix: string; token: string } {
    const match = line.match(/(.+?\s)?([^\s]*)$/);
    return {
        prefix: match?.[1] ?? '',
        token: match?.[2] ?? ''
    };
}

export function completePath(
    raw: string,
    type: 'file' | 'dir'
): string[] {
    // Remove sigil (@ or #)
    const withoutSigil = raw.slice(1);

    // Handle case: only sigil (e.g., "@")
    if (!withoutSigil) {
        const currentDir = process.cwd();
        try {
            let entries = fs.readdirSync(currentDir, { withFileTypes: true });
            entries = sortEntries(entries);
            return entries
                .filter(e => type === 'file' ? e.isFile() : e.isDirectory())
                .map(e => (type === 'file' ? '@' : '#') + e.name);
        } catch {
            return [];
        }
    }

    // Extract base directory and partial name
    const baseDir = withoutSigil.includes(path.sep)
        ? path.dirname(withoutSigil)
        : '.';

    const partial = withoutSigil.includes(path.sep)
        ? path.basename(withoutSigil)
        : withoutSigil;

    const resolvedBase = path.resolve(baseDir);

    if (!fs.existsSync(resolvedBase) || !fs.statSync(resolvedBase).isDirectory()) {
        return [];
    }

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(resolvedBase, { withFileTypes: true });
        entries = sortEntries(entries);
    } catch {
        return [];
    }

    return entries
        .filter(e => {
            const matchesPrefix = e.name.startsWith(partial);
            if (!matchesPrefix) return false;
            return type === 'file' ? e.isFile() : e.isDirectory();
        })
        .map(e => {
            const fullName = (baseDir === '.' ? '' : baseDir + path.sep) + e.name;
            const sigil = type === 'file' ? '@' : '#';
            return sigil + fullName;
        });
}

/* ========================================
   FILE:LINE COMPLETION
   ======================================== */

export function completeFileWithLine(token: string): string[] {
    const [filePath, linePart] = token.slice(1).split(':');

    if (!filePath) {
        return completePath('@' + token, 'file');
    }

    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        return [];
    }

    if (linePart !== undefined) {
        // Suggest common line numbers
        const lineNums = ['1', '10', '20', '50', '100', '200'];
        const matches = lineNums.filter(ln => ln.startsWith(linePart));
        return matches.map(ln => '@' + filePath + ':' + ln);
    }

    // File exists, add colon for line input
    return ['@' + filePath + ':'];
}

/* ========================================
   ARGUMENT COMPLETION (GIT, etc.)
   ======================================== */

export function completeGitArgs(args: string[]): string[] {
    try {
        if (args.length <= 1) {
            // Complete subcommands
            const subcommands = [
                'add', 'branch', 'checkout', 'commit', 'diff',
                'log', 'merge', 'pull', 'push', 'rebase',
                'status', 'reset', 'revert', 'stash'
            ];
            return subcommands.filter(cmd => cmd.startsWith(args[1] || ''));
        }

        if (args[1] === 'checkout' && args.length <= 2) {
            // Complete branches
            try {
                const branches = execSync('git branch --all', {
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                return branches
                    .split('\n')
                    .map(l => l.replace(/^[* ]+/, '').trim())
                    .filter(b => b && b.startsWith(args[2] || ''));
            } catch {
                return [];
            }
        }
    } catch {
        // Not in a git repo or git not available
    }

    return [];
}

/* ========================================
   SMART COMPLETER (Main Entry)
   ======================================== */

export function createCompleter(): readline.Completer {
    return (line: string) => {
        try {
            const mode = detectMode(line);
            const { prefix, token } = splitToken(line);

            if (mode === 'file' && token.startsWith('@')) {
                if (token.includes(':')) {
                    // File:line mode
                    const matches = completeFileWithLine(token);
                    return [matches, token];
                }

                // File completion
                const matches = completePath(token, 'file');
                return [matches, token];
            }

            if (mode === 'dir' && token.startsWith('#')) {
                // Directory completion
                const matches = completePath(token, 'dir');
                return [matches, token];
            }

            if (mode === 'command') {
                // Command completion
                const cmdLine = line.replace(/^[$!]/, '');
                const parts = cmdLine.split(/\s+/);
                const cmd = parts[0];
                const current = parts[parts.length - 1] || '';

                // Git argument completion
                if (cmd === 'git') {
                    const matches = completeGitArgs(parts);
                    const filtered = matches.filter(m => m.startsWith(current));
                    return [filtered, current];
                }

                // General command completion
                const matches = completeCommands(current);
                return [matches, current];
            }

            // Default: no completion in chat mode
            return [[], line];
        } catch (error) {
            // Fail gracefully
            return [[], line];
        }
    };
}

/* ========================================
   COMMAND EXECUTION
   ======================================== */

export async function executeCommand(
    cmdLine: string,
    onExit?: (code: number | null) => void
): Promise<void> {
    const trimmed = cmdLine.trim();
    const command = trimmed.replace(/^[$!]\s*/, '');

    const child = spawn(command, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
    });

    child.on('exit', (code) => {
        if (onExit) {
            onExit(code);
        }
    });

    child.on('error', (err) => {
        console.error(`\n[Command Error]: ${err.message}`);
        if (onExit) {
            onExit(1);
        }
    });

    return new Promise((resolve) => {
        child.on('close', () => resolve());
    });
}

/* ========================================
   GHOST TEXT (Suggestions)
   ======================================== */

let currentGhostText = '';

export function predictGhostText(line: string): string {
    const mode = detectMode(line);

    if (mode === 'command') {
        const cmdLine = line.replace(/^[$!]/, '');

        // Git suggestions
        if (cmdLine === 'git ch') return 'eckout';
        if (cmdLine === 'git st') return 'atus';
        if (cmdLine === 'git co') return 'mmit';

        // NPM suggestions
        if (cmdLine === 'npm r') return 'un dev';
        if (cmdLine === 'npm b') return 'uild';

        // LS suggestions
        if (cmdLine === 'ls -') return 'la';

        // Common patterns
        if (cmdLine === 'gi') return 't';
    }

    return '';
}

export function renderGhost(rl: readline.Interface): void {
    if (!currentGhostText) return;
    process.stdout.write(`\x1b[90m${currentGhostText}\x1b[0m`);
}

export function clearGhost(rl: readline.Interface): void {
    if (currentGhostText) {
        process.stdout.write(`\x1b[2K\r`);
        currentGhostText = '';
    }
}

export function updateGhost(line: string): void {
    currentGhostText = predictGhostText(line);
}

/* ========================================
   PLUGIN SYSTEM
   ======================================== */

const plugins = new Map<string, CommandPlugin>();
const PLUGIN_DIR = path.join(findProjectRoot(), '.shell', 'plugins');

export function loadPlugins(): void {
    if (!fs.existsSync(PLUGIN_DIR)) {
        try {
            fs.mkdirSync(PLUGIN_DIR, { recursive: true });
        } catch {
            // Can't create plugin directory
        }
        return;
    }

    try {
        for (const file of fs.readdirSync(PLUGIN_DIR)) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                try {
                    const pluginPath = path.join(PLUGIN_DIR, file);
                    const plugin = require(pluginPath);
                    if (plugin.command && plugin.complete) {
                        plugins.set(plugin.command, plugin);
                    }
                } catch {
                    // Invalid plugin
                }
            }
        }
    } catch {
        // Can't read plugin directory
    }
}

export function getPlugin(command: string): CommandPlugin | undefined {
    return plugins.get(command);
}

export function listPlugins(): string[] {
    return [...plugins.keys()];
}

/* ========================================
   INITIALIZE
   ======================================== */

export function initialize(): void {
    findProjectRoot();
    loadPlugins();
    loadCommands();
}

// Auto-initialize on import
initialize();

````

## 📄 `src/core/apps.ts`

````typescript
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import os from 'os';
import { DEFAULT_APPS, parseAppsConfig } from './validation';

export { DEFAULT_APPS };

export function loadAppsConfig(): Record<string, string> {
    const configPaths = [
        path.join(process.cwd(), 'yuangs.config.json'),
        path.join(process.cwd(), 'yuangs.config.yaml'),
        path.join(process.cwd(), 'yuangs.config.yml'),
        path.join(process.cwd(), '.yuangs.json'),
        path.join(process.cwd(), '.yuangs.yaml'),
        path.join(process.cwd(), '.yuangs.yml'),
        path.join(os.homedir(), '.yuangs.json'),
        path.join(os.homedir(), '.yuangs.yaml'),
        path.join(os.homedir(), '.yuangs.yml'),
    ];

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                let config: Record<string, string>;
                if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
                    config = yaml.load(configContent) as Record<string, string>;
                } else {
                    config = parseAppsConfig(configContent);
                }
                return config;
            } catch (error) { }
        }
    }
    return DEFAULT_APPS;
}


export function openUrl(url: string) {
    let command;
    switch (process.platform) {
        case 'darwin': command = `open "${url}"`; break;
        case 'win32': command = `start "${url}"`; break;
        default: command = `xdg-open "${url}"`; break;
    }
    exec(command);
}

````

## 📄 `src/core/autofix.ts`

````typescript
import { OSProfile } from './os';
import { buildFixPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { safeParseJSON, AIFixPlan, aiFixPlanSchema } from './validation';

export async function autoFixCommand(
    originalCmd: string,
    stderr: string,
    os: OSProfile,
    model?: string
): Promise<AIFixPlan | null> {
    const prompt = buildFixPrompt(originalCmd, stderr, os);
    const raw = await askAI(prompt, model);

    const parseResult = safeParseJSON(raw, aiFixPlanSchema, {} as AIFixPlan);

    if (!parseResult.success) {
        return null;
    }

    return parseResult.data;
}

````

## 📄 `src/core/capabilities.ts`

````typescript
export enum AtomicCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  TOOL_CALLING = 'tool_calling',
  LONG_CONTEXT = 'long_context',
  REASONING = 'reasoning',
  STREAMING = 'streaming',
}

export interface CompositeCapability {
  name: string;
  composedOf: AtomicCapability[];
}

export const COMPOSITE_CAPABILITIES: CompositeCapability[] = [
  {
    name: 'interactive_agent',
    composedOf: [AtomicCapability.TOOL_CALLING, AtomicCapability.REASONING],
  },
  {
    name: 'large_repo_analysis',
    composedOf: [AtomicCapability.LONG_CONTEXT, AtomicCapability.REASONING],
  },
  {
    name: 'safe_code_editing',
    composedOf: [AtomicCapability.CODE_GENERATION, AtomicCapability.REASONING],
  },
];

export enum ConstraintCapability {
  PREFER_DETERMINISTIC = 'prefer_deterministic',
  LOW_COST = 'low_cost',
  FAST_RESPONSE = 'fast_response',
}

export const CAPABILITY_VERSION = '1.0';

export function isAtomicCapability(value: string): value is AtomicCapability {
  return Object.values(AtomicCapability).includes(value as AtomicCapability);
}

export function isConstraintCapability(value: string): value is ConstraintCapability {
  return Object.values(ConstraintCapability).includes(value as ConstraintCapability);
}

export function resolveCompositeCapability(name: string): AtomicCapability[] {
  const composite = COMPOSITE_CAPABILITIES.find(c => c.name === name);
  if (!composite) {
    throw new Error(`Unknown composite capability: ${name}`);
  }
  return composite.composedOf;
}

export function expandCapabilities(
  capabilities: Array<AtomicCapability | string>
): Set<AtomicCapability> {
  const result = new Set<AtomicCapability>();

  for (const cap of capabilities) {
    if (isAtomicCapability(cap)) {
      result.add(cap);
    } else {
      const atomicCaps = resolveCompositeCapability(cap);
      atomicCaps.forEach(c => result.add(c));
    }
  }

  return result;
}

````

## 📄 `src/core/capabilityInference.ts`

````typescript
import { AtomicCapability } from '../core/capabilities';
import type { CapabilityRequirement } from '../core/modelMatcher';

export function inferCapabilityRequirement(userInput: string): CapabilityRequirement {
  const required: AtomicCapability[] = [];

  const input = userInput.toLowerCase();

  if (input.includes('代码') || input.includes('script') || input.includes('文件') || input.includes('create') || input.includes('write')) {
    required.push(AtomicCapability.CODE_GENERATION);
  }

  if (input.includes('分析') || input.includes('理解') || input.includes('解释') || input.includes('推理')) {
    required.push(AtomicCapability.REASONING);
  }

  if (input.includes('长') || input.includes('large') || input.includes('仓库') || input.includes('目录') || input.includes('所有文件')) {
    required.push(AtomicCapability.LONG_CONTEXT);
  }

  return {
    required: Array.from(new Set(required)),
    preferred: [],
  };
}

````

## 📄 `src/core/capabilitySystem.ts`

````typescript
import {
  CapabilityRequirement,
  matchModelWithFallback,
  ModelCapabilities,
  CapabilityMatchResult,
} from './modelMatcher';
import {
  mergeConfigs,
  loadConfigAt,
  dumpConfigSnapshot,
  getConfigFilePaths,
  MergedConfig,
} from './configMerge';
import {
  createExecutionRecord,
  ExecutionRecord,
} from './executionRecord';
import {
  saveExecutionRecord,
  loadExecutionRecord,
  listExecutionRecords,
} from './executionStore';
import { replayEngine, ReplayOptions, ReplayResult } from './replayEngine';

export class CapabilitySystem {
  private primaryModels: ModelCapabilities[] = [];
  private fallbackModels: ModelCapabilities[] = [];

  constructor() {
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    // 初始化为空数组，让配置文件成为主要来源
    this.primaryModels = [];
    this.fallbackModels = [];
  }

  matchCapability(requirement: CapabilityRequirement): CapabilityMatchResult {
    const allModels = this.getAllModels();
    const primaryModels = [...this.primaryModels, ...this.loadCustomModels()];
    return matchModelWithFallback(
      primaryModels,
      this.fallbackModels,
      requirement
    );
  }

  loadMergedConfig(): MergedConfig {
    const builtin = {
      aiProxyUrl: 'https://aiproxy.want.biz/v1/chat/completions',
      defaultModel: 'gemini-2.5-flash-lite',
      accountType: 'free',
    };

    const filePaths = getConfigFilePaths();
    const projectConfig = filePaths.project ? loadConfigAt(filePaths.project) : null;
    const userGlobal = loadConfigAt(filePaths.userGlobal);

    return mergeConfigs(builtin, userGlobal, projectConfig, null);
  }

  loadCustomModels(): ModelCapabilities[] {
    const filePaths = getConfigFilePaths();
    const projectConfig = filePaths.project ? loadConfigAt(filePaths.project) : null;
    const userGlobal = loadConfigAt(filePaths.userGlobal);

    const customModelsArray = [];
    if (userGlobal?.models && Array.isArray(userGlobal.models)) {
      customModelsArray.push(...userGlobal.models as ModelCapabilities[]);
    }
    if (projectConfig?.models && Array.isArray(projectConfig.models)) {
      customModelsArray.push(...projectConfig.models as ModelCapabilities[]);
    }

    return customModelsArray;
  }

  getAllModels(): ModelCapabilities[] {
    const customModels = this.loadCustomModels();
    return [...this.primaryModels, ...this.fallbackModels, ...customModels];
  }

  createAndSaveExecutionRecord(
    commandName: string,
    requirement: CapabilityRequirement,
    matchResult: CapabilityMatchResult,
    command?: string
  ): string {
    const config = this.loadMergedConfig();
    const record = createExecutionRecord(
      commandName,
      requirement,
      config,
      matchResult,
      { success: matchResult.selected !== null },
      command
    );

    const filePath = saveExecutionRecord(record);
    return record.id;
  }

  replayExecution(recordId: string, options: ReplayOptions): Promise<ReplayResult> {
    return replayEngine.replay(recordId, options);
  }

  explainConfig(): string {
    const config = this.loadMergedConfig();
    return dumpConfigSnapshot(config);
  }
}

export const capabilitySystem = new CapabilitySystem();

````

## 📄 `src/core/configMerge.ts`

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

export type ConfigSource = 'built-in' | 'user-global' | 'project' | 'command-override';

export interface ConfigFieldSource<T = unknown> {
  value: T;
  source: ConfigSource;
  filePath?: string;
}

export interface MergedConfig {
  aiProxyUrl: ConfigFieldSource<string>;
  defaultModel: ConfigFieldSource<string>;
  accountType: ConfigFieldSource<'free' | 'pro'>;
  [key: string]: ConfigFieldSource<unknown>;
}

export function loadConfigAt(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      return yaml.load(content) as Record<string, unknown>;
    }
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load config from ${filePath}:`, error);
    return null;
  }
}

export function mergeConfigs(
  builtin: Record<string, unknown>,
  userGlobal: Record<string, unknown> | null,
  project: Record<string, unknown> | null,
  commandOverride: Record<string, unknown> | null
): MergedConfig {
  const merged: MergedConfig = {} as MergedConfig;

  const addField = (key: string, value: unknown, source: ConfigSource, filePath?: string) => {
    merged[key] = { value, source, filePath };
  };

  Object.entries(builtin).forEach(([key, value]) => {
    addField(key, value, 'built-in');
  });

  if (userGlobal) {
    Object.entries(userGlobal).forEach(([key, value]) => {
      addField(key, value, 'user-global', path.join(os.homedir(), '.yuangs.json'));
    });
  }

  if (project) {
    Object.entries(project).forEach(([key, value]) => {
      addField(key, value, 'project');
    });
  }

  if (commandOverride) {
    Object.entries(commandOverride).forEach(([key, value]) => {
      addField(key, value, 'command-override');
    });
  }

  return merged;
}

export function dumpConfigSnapshot(config: MergedConfig): string {
  const output: Record<string, any> = {};

  Object.entries(config).forEach(([key, field]) => {
    output[key] = {
      value: field.value,
      source: field.source,
      filePath: field.filePath,
    };
  });

  return JSON.stringify(output, null, 2);
}

function findProjectConfig(cwd = process.cwd()): string | null {
  let dir = cwd;
  const configFiles = ['.yuangs.json', '.yuangs.yaml', '.yuangs.yml', 'yuangs.config.json'];

  while (dir && dir !== path.dirname(dir)) {
    for (const filename of configFiles) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    dir = path.dirname(dir);
  }

  const root = path.parse(cwd).root;
  for (const filename of configFiles) {
    const rootCandidate = path.join(root, filename);
    if (fs.existsSync(rootCandidate)) {
      return rootCandidate;
    }
  }

  return null;
}

export function getConfigFilePaths(): {
  userGlobal: string;
  project: string | null;
} {
  return {
    userGlobal: path.join(os.homedir(), '.yuangs.json'),
    project: findProjectConfig(),
  };
}

````

## 📄 `src/core/executionRecord.ts`

````typescript
import { MergedConfig } from './configMerge';
import { ModelCapabilities, CapabilityMatchExplanation } from './modelMatcher';
import { CapabilityRequirement } from './modelMatcher';

export interface ExecutionMeta {
  commandName: string;
  timestamp: string;
  toolVersion: string;
  projectPath: string;
}

export interface CapabilityIntent {
  required: string[];
  preferred: string[];
  capabilityVersion: string;
}

export interface ModelDecision {
  candidateModels: CapabilityMatchExplanation[];
  selectedModel: ModelCapabilities | null;
  usedFallback: boolean;
  fallbackReason?: string;
}

export interface ExecutionOutcome {
  success: boolean;
  failureReason?: 'capability-mismatch' | 'provider-error' | 'user-abort' | 'timeout' | 'other';
  tokenCount?: number;
  latencyMs?: number;
}

export interface ExecutionRecord {
  id: string;
  meta: ExecutionMeta;
  intent: CapabilityIntent;
  configSnapshot: MergedConfig;
  decision: ModelDecision;
  outcome: ExecutionOutcome;
  command?: string;
}

export function createExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createExecutionRecord(
  commandName: string,
  requirement: CapabilityRequirement,
  config: MergedConfig,
  matchResult: any,
  outcome: Partial<ExecutionOutcome> = {},
  command?: string
): ExecutionRecord {
  const version = require('../../package.json').version;

  return {
    id: createExecutionId(),
    meta: {
      commandName,
      timestamp: new Date().toISOString(),
      toolVersion: version,
      projectPath: process.cwd(),
    },
    intent: {
      required: requirement.required.map(String),
      preferred: requirement.preferred.map(String),
      capabilityVersion: require('./capabilities').CAPABILITY_VERSION,
    },
    configSnapshot: config,
    decision: {
      candidateModels: matchResult.candidates || [],
      selectedModel: matchResult.selected,
      usedFallback: matchResult.fallbackOccurred,
    },
    outcome: {
      success: outcome.success ?? false,
      ...outcome,
    },
    command,
  };
}

export function serializeExecutionRecord(record: ExecutionRecord): string {
  return JSON.stringify(record, null, 2);
}

export function deserializeExecutionRecord(json: string): ExecutionRecord {
  return JSON.parse(json) as ExecutionRecord;
}

````

## 📄 `src/core/executionStore.ts`

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ExecutionRecord, serializeExecutionRecord, deserializeExecutionRecord } from './executionRecord';

const RECORD_DIR = path.join(os.homedir(), '.yuangs', 'executions');

export function ensureRecordDir(): void {
  if (!fs.existsSync(RECORD_DIR)) {
    fs.mkdirSync(RECORD_DIR, { recursive: true });
  }
}

export function saveExecutionRecord(record: ExecutionRecord): string {
  ensureRecordDir();

  const filename = `${record.id}.json`;
  const filepath = path.join(RECORD_DIR, filename);

  fs.writeFileSync(filepath, serializeExecutionRecord(record), 'utf8');

  return filepath;
}

export function loadExecutionRecord(id: string): ExecutionRecord | null {
  ensureRecordDir();

  const filename = `${id}.json`;
  const filepath = path.join(RECORD_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return deserializeExecutionRecord(content);
  } catch (error) {
    console.error(`Failed to load execution record ${id}:`, error);
    return null;
  }
}

export function listExecutionRecords(limit: number = 50): ExecutionRecord[] {
  ensureRecordDir();

  const files = fs.readdirSync(RECORD_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(RECORD_DIR, a));
      const statB = fs.statSync(path.join(RECORD_DIR, b));
      return statB.mtimeMs - statA.mtimeMs;
    })
    .slice(0, limit);

  const records: ExecutionRecord[] = [];

  for (const file of files) {
    const record = loadExecutionRecord(file.replace('.json', ''));
    if (record) {
      records.push(record);
    }
  }

  return records;
}

export function deleteExecutionRecord(id: string): boolean {
  ensureRecordDir();

  const filename = `${id}.json`;
  const filepath = path.join(RECORD_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return false;
  }

  try {
    fs.unlinkSync(filepath);
    return true;
  } catch (error) {
    console.error(`Failed to delete execution record ${id}:`, error);
    return false;
  }
}

export function clearAllExecutionRecords(): void {
  ensureRecordDir();

  const files = fs.readdirSync(RECORD_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filepath = path.join(RECORD_DIR, file);
    try {
      fs.unlinkSync(filepath);
    } catch (error) {
      console.error(`Failed to delete ${filepath}:`, error);
    }
  }
}

````

## 📄 `src/core/executor.ts`

````typescript
import { spawn } from 'child_process';

export type ExecResult = {
    stdout: string;
    stderr: string;
    code: number | null;
};

export async function exec(command: string): Promise<ExecResult> {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        // Use user's preferred shell back with full support for their environment
        const shell = process.env.SHELL || true;
        const child = spawn(command, [], { shell });

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });

        child.on('close', (code) => {
            resolve({ stdout, stderr, code });
        });

        child.on('error', (err) => {
            stderr += err.message;
            resolve({ stdout, stderr, code: 1 });
        });
    });
}

````

## 📄 `src/core/fileReader.ts`

````typescript
import fs from 'fs';
import path from 'path';

export function parseFilePathsFromLsOutput(output: string): string[] {
    const lines = output.trim().split('\n');
    const filePaths: string[] = [];

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1];
        
        if (lastPart && !lastPart.startsWith('-') && lastPart !== '.' && lastPart !== '..') {
            filePaths.push(lastPart);
        }
    }

    return filePaths;
}

export function readFilesContent(filePaths: string[]): Map<string, string> {
    const contentMap = new Map<string, string>();

    for (const filePath of filePaths) {
        try {
            const fullPath = path.resolve(filePath);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                contentMap.set(filePath, content);
            }
        } catch (error) {
            console.error(`无法读取文件: ${filePath}`);
        }
    }

    return contentMap;
}

export function buildPromptWithFileContent(
    originalOutput: string,
    filePaths: string[],
    contentMap: Map<string, string>,
    question?: string
): string {
    let prompt = '';

    prompt += '## 文件列表\n';
    prompt += '```\n';
    prompt += originalOutput;
    prompt += '```\n\n';

    if (contentMap.size > 0) {
        prompt += '## 文件内容\n\n';
        for (const [filePath, content] of contentMap) {
            prompt += `### ${filePath}\n`;
            prompt += '```\n';
            const maxChars = 5000;
            const truncated = content.length > maxChars 
                ? content.substring(0, maxChars) + '\n... (内容过长已截断)'
                : content;
            prompt += truncated;
            prompt += '\n```\n\n';
        }
    }

    if (question) {
        prompt += `\n## 我的问题\n${question}`;
    } else {
        prompt += '\n## 我的问题\n请分析以上文件列表和文件内容';
    }

    return prompt;
}

````

## 📄 `src/core/macros.ts`

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseMacros, type Macro } from './validation';

const USER_MACROS_FILE = path.join(os.homedir(), '.yuangs_macros.json');

export type { Macro };

function loadMacrosFromFile(filePath: string): Record<string, Macro> {
    if (fs.existsSync(filePath)) {
        try {
            return parseMacros(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { }
    }
    return {};
}

function findProjectMacros(cwd = process.cwd()): string | null {
    let dir = cwd;
    while (dir && dir !== path.dirname(dir)) {
        const candidate = path.join(dir, 'yuangs_macros.json');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        dir = path.dirname(dir);
    }
    // Check root one last time
    const rootCandidate = path.join(targetRoot(dir), 'yuangs_macros.json');
    if (fs.existsSync(rootCandidate)) return rootCandidate;
    
    return null;
}

// Helper to reliably stop at root (dirname('/') is '/')
function targetRoot(dir: string) {
    return path.parse(dir).root;
}

export function getMacros(): Record<string, Macro> {
    const userMacros = loadMacrosFromFile(USER_MACROS_FILE);
    
    const projectMacrosPath = findProjectMacros();
    const projectMacros = projectMacrosPath ? loadMacrosFromFile(projectMacrosPath) : {};

    return {
        ...userMacros,
        ...projectMacros // Project overrides User
    };
}

export function saveMacro(name: string, commands: string, description: string = '') {
    // Only load USER macros for saving
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}

export function deleteMacro(name: string) {
    // Only delete from USER macros
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    if (macros[name]) {
        delete macros[name];
        fs.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
        return true;
    }
    return false;
}

export function runMacro(name: string) {
    const macros = getMacros();
    const macro = macros[name];
    if (!macro) return false;

    const { spawn } = require('child_process');
    spawn(macro.commands, [], { shell: true, stdio: 'inherit' });
    return true;
}

````

## 📄 `src/core/modelMatcher.ts`

````typescript
import { AtomicCapability, ConstraintCapability, expandCapabilities } from './capabilities';

export interface ModelCapabilities {
  name: string;
  provider: string;
  atomicCapabilities: AtomicCapability[];
  contextWindow?: number;
  costProfile?: 'low' | 'medium' | 'high';
}

export interface CapabilityRequirement {
  required: AtomicCapability[];
  preferred: AtomicCapability[];
  constraints?: ConstraintCapability[];
}

export interface CapabilityMatchExplanation {
  modelName: string;
  provider: string;
  hasRequired: boolean;
  hasPreferred: AtomicCapability[];
  missingRequired: AtomicCapability[];
  reason: string;
}

export interface CapabilityMatchResult {
  selected: ModelCapabilities | null;
  candidates: CapabilityMatchExplanation[];
  fallbackOccurred: boolean;
}

export function matchModel(
  models: ModelCapabilities[],
  requirement: CapabilityRequirement
): CapabilityMatchResult {
  const explanations: CapabilityMatchExplanation[] = [];

  for (const model of models) {
    const hasRequired = requirement.required.every(cap =>
      model.atomicCapabilities.includes(cap)
    );

    const missingRequired = requirement.required.filter(cap =>
      !model.atomicCapabilities.includes(cap)
    );

    const hasPreferred = requirement.preferred.filter(cap =>
      model.atomicCapabilities.includes(cap)
    );

    const explanation: CapabilityMatchExplanation = {
      modelName: model.name,
      provider: model.provider,
      hasRequired,
      hasPreferred,
      missingRequired,
      reason: hasRequired
        ? `Has all required capabilities. Matches ${hasPreferred.length}/${requirement.preferred.length} preferred.`
        : `Missing required capabilities: ${missingRequired.map(c => String(c)).join(', ')}`,
    };

    explanations.push(explanation);
  }

  const matchingModels = explanations.filter(e => e.hasRequired);

  if (matchingModels.length === 0) {
    return {
      selected: null,
      candidates: explanations,
      fallbackOccurred: false,
    };
  }

  const bestMatch = matchingModels[0];
  const selectedModel = models.find(m => m.name === bestMatch.modelName);

  return {
    selected: selectedModel || null,
    candidates: explanations,
    fallbackOccurred: false,
  };
}

export function matchModelWithFallback(
  models: ModelCapabilities[],
  fallbackModels: ModelCapabilities[],
  requirement: CapabilityRequirement
): CapabilityMatchResult {
  const primaryResult = matchModel(models, requirement);

  if (primaryResult.selected) {
    return primaryResult;
  }

  const fallbackResult = matchModel(fallbackModels, requirement);

  return {
    ...fallbackResult,
    fallbackOccurred: fallbackResult.selected !== null,
  };
}

````

## 📄 `src/core/os.ts`

````typescript
export type OSProfile = {
    name: string;
    shell: string;
    find: 'bsd' | 'gnu';
    stat: 'bsd' | 'gnu';
};

export function getOSProfile(): OSProfile {
    switch (process.platform) {
        case 'darwin':
            return {
                name: 'macOS',
                shell: 'zsh',
                find: 'bsd',
                stat: 'bsd',
            };
        case 'linux':
            return {
                name: 'Linux',
                shell: 'bash',
                find: 'gnu',
                stat: 'gnu',
            };
        case 'win32':
            return {
                name: 'Windows',
                shell: 'cmd',
                find: 'gnu', // Win32 find is different, but for AI context let's assume GNU style tools if they are there, or just label it.
                stat: 'gnu',
            };
        default:
            return {
                name: process.platform,
                shell: 'sh',
                find: 'gnu',
                stat: 'gnu',
            };
    }
}

````

## 📄 `src/core/replayEngine.ts`

````typescript
import chalk from 'chalk';
import { ExecutionRecord } from './executionRecord';
import { loadExecutionRecord } from './executionStore';

export type ReplayMode = 'strict' | 'compatible' | 're-evaluate';

export interface ReplayOptions {
  mode: ReplayMode;
  skipAI?: boolean;
  verbose?: boolean;
}

export interface ReplayResult {
  success: boolean;
  message: string;
  executedModel?: string;
  deviationReason?: string;
}

export class ReplayEngine {
  async replay(recordId: string, options: ReplayOptions = { mode: 'strict' }): Promise<ReplayResult> {
    const record = loadExecutionRecord(recordId);

    if (!record) {
      return {
        success: false,
        message: `Execution record ${recordId} not found`,
      };
    }

    if (options.mode === 'strict') {
      return this.strictReplay(record, options);
    }

    if (options.mode === 'compatible') {
      return this.compatibleReplay(record, options);
    }

    return this.reEvaluate(record, options);
  }

  private async strictReplay(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    const selectedModel = record.decision.selectedModel;

    if (options.verbose) {
      console.log(chalk.cyan('[Strict Replay]'));
      console.log(chalk.gray(`  Original Model: ${selectedModel?.name || 'N/A'}`));
      console.log(chalk.gray(`  Original Provider: ${selectedModel?.provider || 'N/A'}`));
      console.log(chalk.gray(`  Original Timestamp: ${record.meta.timestamp}`));
      console.log(chalk.gray(`  Original Command: ${record.meta.commandName}`));
    }

    if (options.skipAI) {
      return {
        success: true,
        message: 'Strict replay prepared (AI execution skipped)',
        executedModel: selectedModel?.name ?? undefined,
      };
    }

    if (!record.command) {
      return {
        success: false,
        message: 'Strict replay: No command to execute (command not stored in record)',
        executedModel: selectedModel?.name ?? undefined,
      };
    }

    const { exec } = require('./executor');

    try {
      console.log(chalk.gray('[Strict Replay] Executing with original parameters...'));
      const result = await exec(record.command);

      return {
        success: result.code === 0 || result.code === null,
        message: result.code === 0 || result.code === null
          ? 'Strict replay completed successfully'
          : `Strict replay failed with code ${result.code}`,
        executedModel: selectedModel?.name ?? undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Strict replay error: ${message}`,
        executedModel: selectedModel?.name ?? undefined,
      };
    }
  }

  private async compatibleReplay(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    const originalModel = record.decision.selectedModel;

    if (options.verbose) {
      console.log(chalk.cyan('[Compatible Replay]'));
      console.log(chalk.gray(`  Original Model: ${originalModel?.name || 'N/A'}`));
      console.log(chalk.gray(`  Will attempt fallback if original unavailable`));
    }

    return {
      success: false,
      message: 'Compatible replay not yet implemented in Phase 1',
      executedModel: originalModel?.name,
      deviationReason: 'Phase 1 only supports strict replay',
    };
  }

  private async reEvaluate(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    if (options.verbose) {
      console.log(chalk.cyan('[Re-evaluate]'));
      console.log(chalk.gray(`  Will re-run capability matching with current config`));
      console.log(chalk.gray(`  Original Intent: ${record.intent.required.join(', ')}`));
    }

    return {
      success: false,
      message: 'Re-evaluate not yet implemented in Phase 1',
    };
  }
}

export const replayEngine = new ReplayEngine();

````

## 📄 `src/core/risk.ts`

````typescript
export function assessRisk(command: string, aiRisk: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const HIGH_RISK_PATTERNS = [
        /\brm\b/i,
        /\bsudo\b/i,
        /\bmv\b/i,
        /\bdd\b/i,
        /\bchmod\b/i,
        /\bchown\b/i,
        />\s*\/dev\//,
        /:\(\)\s*\{.*\}/, // Fork bomb
        /\bmkfs\b/i,
    ];

    const hasHighRisk = HIGH_RISK_PATTERNS.some(pattern => pattern.test(command));

    if (hasHighRisk) return 'high';
    return aiRisk;
}

````

## 📄 `src/core/validation.ts`

````typescript
import { z } from 'zod';

export type UserConfig = {
    defaultModel?: string;
    aiProxyUrl?: string;
    accountType?: 'free' | 'pro';
    [key: string]: string | undefined;
};

export type AppsConfig = Record<string, string>;

export type AIRequestMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type AIResponse = {
    choices?: Array<{
        message?: {
            content?: string;
        };
        delta?: {
            content?: string;
        };
    }>;
};

export const DEFAULT_AI_PROXY_URL = 'https://aiproxy.want.biz/v1/chat/completions';
export const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
export const DEFAULT_ACCOUNT_TYPE = 'free' as const;

export const DEFAULT_APPS = {
    shici: 'https://wealth.want.biz/shici/index.html',
    dict: 'https://wealth.want.biz/pages/dict.html',
    pong: 'https://wealth.want.biz/pages/pong.html'
} as const;

export const aiCommandPlanSchema = z.object({
    plan: z.string().describe('Explanation of the command'),
    command: z.string().optional().describe('The shell command to execute'),
    macro: z.string().optional().describe('Name of an existing macro to reuse'),
    risk: z.enum(['low', 'medium', 'high']).describe('Risk level assessment')
}).refine(data => data.command || data.macro, {
    message: 'Either command or macro must be provided'
});

export type AICommandPlan = z.infer<typeof aiCommandPlanSchema>;

export const aiFixPlanSchema = z.object({
    plan: z.string().describe('Fix explanation'),
    command: z.string().describe('The fixed shell command (always required for fixes)'),
    risk: z.enum(['low', 'medium', 'high']).describe('Risk level assessment')
});

export type AIFixPlan = z.infer<typeof aiFixPlanSchema>;

export const userConfigSchema = z.object({
    defaultModel: z.string().optional(),
    aiProxyUrl: z.string().url().optional(),
    accountType: z.enum(['free', 'pro']).optional()
});

export const appsConfigSchema = z.record(z.string(), z.string());

export const macroSchema = z.object({
    commands: z.string(),
    description: z.string(),
    createdAt: z.string()
});

export type Macro = z.infer<typeof macroSchema>;

export const historyEntrySchema = z.object({
    question: z.string(),
    command: z.string(),
    time: z.string()
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export function extractJSON(raw: string): string {
    let jsonContent = raw.trim();

    if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
    }
    else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
    }

    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }

    return jsonContent;
}

export function safeParseJSON<T>(
    raw: string,
    schema: z.ZodSchema<T>,
    fallback: T
): { success: true; data: T } | { success: false; error: z.ZodError } {
    try {
        const jsonContent = extractJSON(raw);
        const result = schema.safeParse(JSON.parse(jsonContent));

        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error };
        }
        return {
            success: false,
            error: new z.ZodError([
                {
                    code: z.ZodIssueCode.custom,
                    message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
                    path: []
                }
            ])
        };
    }
}

export function parseUserConfig(content: string): UserConfig {
    return userConfigSchema.parse(JSON.parse(content));
}

export function parseAppsConfig(content: string): AppsConfig {
    return appsConfigSchema.parse(JSON.parse(content)) as AppsConfig;
}

export function parseMacros(content: string): Record<string, Macro> {
    const parsed = JSON.parse(content);
    const macros: Record<string, Macro> = {};

    for (const [name, value] of Object.entries(parsed)) {
        macros[name] = macroSchema.parse(value);
    }

    return macros;
}

export function parseCommandHistory(content: string): HistoryEntry[] {
    const parsed = JSON.parse(content);
    return z.array(historyEntrySchema).parse(parsed);
}

````

## 📄 `src/index.ts`

````typescript
// This file is empty because yuangs is a CLI-first project.
// We don't expose any public library APIs to avoid breaking changes.
export { };

````

## 📄 `src/types.d.ts`

````typescript
declare module 'marked-terminal' {
    import { Renderer } from 'marked';
    export default class TerminalRenderer extends Renderer {
        constructor(options?: any);
    }
}

````

## 📄 `src/utils/confirm.ts`

````typescript
import * as readline from 'node:readline/promises';
import chalk from 'chalk';

export async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const answer = await rl.question(chalk.yellow(`\n⚠️  ${message} (y/N) `));
        return answer.toLowerCase() === 'y';
    } finally {
        rl.close();
    }
}


````

## 📄 `src/utils/history.ts`

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseCommandHistory, type HistoryEntry } from '../core/validation';

const HISTORY_FILE = path.join(os.homedir(), '.yuangs_cmd_history.json');

export type { HistoryEntry };

export function getCommandHistory(): HistoryEntry[] {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            return parseCommandHistory(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) { }
    }
    return [];
}

export function saveHistory(entry: { question: string; command: string }) {
    let history = getCommandHistory();
    const newEntry: HistoryEntry = {
        ...entry,
        time: new Date().toLocaleString()
    };
    // Keep last 1000, unique commands
    history = [newEntry, ...history.filter(item => item.command !== entry.command)].slice(0, 1000);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

````

## 📄 `src/utils/syntaxHandler.ts`

````typescript
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { ContextBuffer } from '../commands/contextBuffer';
import { loadContext, saveContext } from '../commands/contextStorage';

const execAsync = promisify(exec);

/**
 * 解析并处理特殊语法（@、#、:ls 等）
 */
export async function handleSpecialSyntax(input: string, stdinData?: string): Promise<{ processed: boolean; result?: string }> {
    const trimmed = input.trim();

    // 处理 @ 文件引用语法
    if (trimmed.startsWith('@')) {
        // 检查是否是 @! 立即执行语法
        const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);
        if (immediateExecMatch) {
            const filePath = immediateExecMatch[1].trim();
            return await handleImmediateExec(filePath);
        }

        // 检查是否是带行号的语法 @file:start-end
        const lineRangeMatch = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?\s*(?:\n(.*))?$/s);
        if (lineRangeMatch) {
            const filePath = lineRangeMatch[1];
            const startLine = lineRangeMatch[2] ? parseInt(lineRangeMatch[2]) : null;
            const endLine = lineRangeMatch[3] ? parseInt(lineRangeMatch[3]) : null;
            const question = lineRangeMatch[4] || (stdinData ? `分析以下文件内容：\n\n${stdinData}` : '请分析这个文件');

            return await handleFileReference(filePath.trim(), startLine, endLine, question);
        }
    }

    // 处理 # 目录引用语法
    if (trimmed.startsWith('#')) {
        const dirMatch = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
        if (dirMatch) {
            const dirPath = dirMatch[1].trim();
            const question = dirMatch[2] || (stdinData ? `分析以下目录内容：\n\n${stdinData}` : '请分析这个目录');
            return await handleDirectoryReference(dirPath, question);
        }
    }

    // 处理 :ls 命令
    if (trimmed === ':ls') {
        return await handleListContext();
    }

    // 处理 :clear 命令
    if (trimmed === ':clear') {
        return await handleClearContext();
    }

    // 如果不是特殊语法，返回未处理
    return { processed: false };
}

async function handleFileReference(filePath: string, startLine: number | null = null, endLine: number | null = null, question?: string): Promise<{ processed: boolean; result: string }> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        return { 
            processed: true, 
            result: `错误: 文件 "${filePath}" 不存在或不是一个文件` 
        };
    }

    try {
        let content = fs.readFileSync(fullPath, 'utf-8');
        
        // 如果指定了行号范围，则提取相应行
        if (startLine !== null) {
            const lines = content.split('\n');
            
            // 验证行号范围
            if (startLine < 1 || startLine > lines.length) {
                return { 
                    processed: true, 
                    result: `错误: 起始行号 ${startLine} 超出文件范围 (文件共有 ${lines.length} 行)` 
                };
            }

            const startIdx = startLine - 1; // 转换为数组索引（从0开始）
            let endIdx = endLine ? Math.min(endLine, lines.length) : lines.length; // 如果未指定结束行，则到文件末尾

            if (endLine && (endLine < startLine || endLine > lines.length)) {
                return { 
                    processed: true, 
                    result: `错误: 结束行号 ${endLine} 超出有效范围 (应在 ${startLine}-${lines.length} 之间)` 
                };
            }

            // 提取指定范围的行
            content = lines.slice(startIdx, endIdx).join('\n');
        }

        const contentMap = new Map<string, string>();
        contentMap.set(filePath, content);

        const prompt = buildPromptWithFileContent(
            `文件: ${filePath}${startLine !== null ? `:${startLine}${endLine ? `-${endLine}` : ''}` : ''}`,
            [filePath],
            contentMap,
            question || `请分析文件: ${filePath}`
        );

        return { processed: true, result: prompt };
    } catch (error) {
        return { 
            processed: true, 
            result: `读取文件失败: ${error}` 
        };
    }
}

async function handleDirectoryReference(dirPath: string, question?: string): Promise<{ processed: boolean; result: string }> {
    const fullPath = path.resolve(dirPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        return { 
            processed: true, 
            result: `错误: 目录 "${dirPath}" 不存在或不是一个目录` 
        };
    }

    try {
        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;

        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);

        if (filePaths.length === 0) {
            return { 
                processed: true, 
                result: `目录 "${dirPath}" 下没有文件` 
            };
        }

        const contentMap = readFilesContent(filePaths);

        const prompt = buildPromptWithFileContent(
            `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
            filePaths.map(p => path.relative(process.cwd(), p)),
            contentMap,
            question
        );

        return { processed: true, result: prompt };
    } catch (error) {
        return { 
            processed: true, 
            result: `读取目录失败: ${error}` 
        };
    }
}

async function handleImmediateExec(filePath: string): Promise<{ processed: boolean; result: string }> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
        return { 
            processed: true, 
            result: `错误: 文件 "${filePath}" 不存在` 
        };
    }

    try {
        // 读取文件内容并添加到上下文
        const content = fs.readFileSync(fullPath, 'utf-8');
        const contextBuffer = new ContextBuffer();
        const persisted = await loadContext();
        contextBuffer.import(persisted);

        contextBuffer.add({
            type: 'file',
            path: filePath,
            content
        });

        await saveContext(contextBuffer.export());

        // 执行文件
        const { stdout, stderr } = await execAsync(`chmod +x "${fullPath}" && "${fullPath}"`, { cwd: process.cwd() });
        
        // 将命令输出作为上下文返回
        const result = `文件 "${filePath}" 已执行\n\n标准输出:\n${stdout}\n\n标准错误:\n${stderr}`;
        return { processed: true, result };
    } catch (error) {
        return { 
            processed: true, 
            result: `执行文件失败: ${error}` 
        };
    }
}

async function handleListContext(): Promise<{ processed: boolean; result: string }> {
    try {
        const persisted = await loadContext();
        const contextBuffer = new ContextBuffer();
        contextBuffer.import(persisted);

        if (contextBuffer.isEmpty()) {
            return { processed: true, result: '当前没有上下文' };
        }

        const list = contextBuffer.list();
        let result = '当前上下文列表：\n';
        list.forEach((item, index) => {
            result += `${index + 1}. ${item.type}: ${item.path} (${item.tokens} tokens)\n`;
        });

        return { processed: true, result };
    } catch (error) {
        return { 
            processed: true, 
            result: `读取上下文失败: ${error}` 
        };
    }
}

async function handleClearContext(): Promise<{ processed: boolean; result: string }> {
    try {
        // 清除持久化存储
        await saveContext([]);
        
        return { processed: true, result: '上下文已清空（含持久化）' };
    } catch (error) {
        return { 
            processed: true, 
            result: `清除上下文失败: ${error}` 
        };
    }
}

````

## 📄 `test/fileReader.test.js`

````javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
    parseFilePathsFromLsOutput,
    readFilesContent,
    buildPromptWithFileContent
} = require('../dist/core/fileReader');

jest.mock('fs');
jest.mock('path');

describe('Module: FileReader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        path.resolve.mockImplementation((p) => p);
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ isFile: () => true });
    });

    describe('parseFilePathsFromLsOutput', () => {
        test('should parse simple ls output', () => {
            const output = 'file1.txt\nfile2.ts\nfile3.js';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts', 'file3.js']);
        });

        test('should parse ls -l output', () => {
            const output = '-rw-r--r-- 1 user group 123 Jan 1 file1.txt\n-rw-r--r-- 1 user group 456 Jan 2 file2.ts';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts']);
        });

        test('should skip . and .. directories', () => {
            const output = '.\n..\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should skip permission strings', () => {
            const output = '-rw-r--r--\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should handle empty output', () => {
            const output = '';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual([]);
        });
    });

    describe('readFilesContent', () => {
        test('should read multiple files', () => {
            const mockContent = { 'file1.txt': 'content1', 'file2.ts': 'content2' };
            fs.readFileSync.mockImplementation((filePath) => mockContent[filePath] || '');

            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(2);
            expect(contentMap.get('file1.txt')).toBe('content1');
            expect(contentMap.get('file2.ts')).toBe('content2');
        });

        test('should skip directories', () => {
            fs.statSync.mockReturnValue({ isFile: () => false });

            const filePaths = ['file.txt', 'directory'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        test('should skip non-existent files', () => {
            fs.existsSync.mockImplementation((p) => p === 'exists.txt');

            const filePaths = ['exists.txt', 'notexists.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(1);
            expect(contentMap.has('exists.txt')).toBe(true);
            expect(contentMap.has('notexists.txt')).toBe(false);
        });

        test('should handle read errors gracefully', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const filePaths = ['error.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
        });

        test('should return empty map for empty input', () => {
            const contentMap = readFilesContent([]);
            expect(contentMap.size).toBe(0);
        });
    });

    describe('buildPromptWithFileContent', () => {
        test('should build prompt with all content', () => {
            const originalOutput = 'file1.txt\nfile2.ts';
            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = new Map([
                ['file1.txt', 'content1'],
                ['file2.ts', 'content2']
            ]);
            const question = 'Analyze these files';

            const prompt = buildPromptWithFileContent(originalOutput, filePaths, contentMap, question);

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('file1.txt\nfile2.ts');
            expect(prompt).toContain('## 文件内容');
            expect(prompt).toContain('### file1.txt');
            expect(prompt).toContain('content1');
            expect(prompt).toContain('### file2.ts');
            expect(prompt).toContain('content2');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).toContain('Analyze these files');
        });

        test('should truncate content longer than 5000 chars', () => {
            const longContent = 'x'.repeat(6000);
            const contentMap = new Map([['long.txt', longContent]]);
            const prompt = buildPromptWithFileContent('long.txt', ['long.txt'], contentMap);

            expect(prompt).toContain('... (内容过长已截断)');
            expect(prompt.length).toBeLessThan(longContent.length + 1000);
        });

        test('should use default question when not provided', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map([['file.txt', 'content']]));

            expect(prompt).toContain('请分析以上文件列表和文件内容');
        });

        test('should work with empty content map', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map(), 'Analyze');

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });

        test('should work with empty file paths', () => {
            const prompt = buildPromptWithFileContent('', [], new Map(), 'Analyze');

            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });
    });
});

````

## 📄 `test/macros.test.js`

````javascript
const fs = require('fs');
const yuangs = require('../dist/core/macros');
const path = require('path');
const os = require('os');

jest.mock('fs');

describe('Module: Macros', () => {
    const mockMacrosFile = path.join(os.homedir(), '.yuangs_macros.json');

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock implementation
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockReturnValue(undefined);
        // We need to unmock path and os if they were mocked, but we only mocked fs
    });

    test('should get empty macros when file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        const macros = yuangs.getMacros();
        expect(macros).toEqual({});
        expect(fs.existsSync).toHaveBeenCalledWith(mockMacrosFile);
    });

    test('should save a new macro', () => {
        fs.existsSync.mockReturnValue(false); // File doesn't exist yet
        
        const result = yuangs.saveMacro('test', 'echo hello', 'description');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        expect(filePath).toBe(mockMacrosFile);
        
        const data = JSON.parse(content);
        expect(data).toHaveProperty('test');
        expect(data.test.commands).toBe('echo hello');
        expect(data.test.description).toBe('description');
        expect(data.test).toHaveProperty('createdAt');
    });

    test('should retrieve existing macros', () => {
        const mockData = {
            "demo": {
                "commands": "ls -la",
                "description": "list files",
                "createdAt": "2024-01-01T00:00:00.000Z"
            }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const macros = yuangs.getMacros();
        expect(macros).toEqual(mockData);
    });

    test('should delete a macro', () => {
        const mockData = {
            "todelete": { "commands": "rm -rf /", "description": "dangerous", "createdAt": "2024-01-01T00:00:00.000Z" },
            "keep": { "commands": "echo safe", "description": "safe", "createdAt": "2024-01-01T00:00:00.000Z" }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = yuangs.deleteMacro('todelete');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(content);
        expect(savedData).not.toHaveProperty('todelete');
        expect(savedData).toHaveProperty('keep');
    });

    test('should return false when deleting non-existent macro', () => {
        fs.existsSync.mockReturnValue(false); // Or true with empty object
        
        const result = yuangs.deleteMacro('nonexistent');
        expect(result).toBe(false);
        // Should not write to disk if nothing changed (optional optimization, but current implementation reads first)
        // Actually current implementation:
        // const macros = getMacros();
        // if (macros[name]) { ... }
        // getMacros returns {} if file not exists. macros['nonexistent'] is undefined.
        // So it returns false and does NOT call writeFileSync.
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});

````

## 📄 `test/risk-validation.test.js`

````javascript
const { assessRisk } = require('../dist/core/risk');

describe('Risk Assessment', () => {
        test('should detect rm command as high risk', () => {
            expect(assessRisk('rm -rf file.txt', 'low')).toBe('high');
            expect(assessRisk('rm file.txt', 'low')).toBe('high');
        });

        test('should detect sudo command as high risk', () => {
            expect(assessRisk('sudo apt install package', 'low')).toBe('high');
            expect(assessRisk('SUDO apt install', 'low')).toBe('high');
        });

        test('should detect mv command as high risk', () => {
            expect(assessRisk('mv file1 file2', 'low')).toBe('high');
        });

        test('should detect dd command as high risk', () => {
            expect(assessRisk('dd if=/dev/zero of=file', 'low')).toBe('high');
        });

        test('should detect chmod command as high risk', () => {
            expect(assessRisk('chmod 777 file.txt', 'low')).toBe('high');
        });

        test('should detect chown command as high risk', () => {
            expect(assessRisk('chown user:group file', 'low')).toBe('high');
        });

        test('should detect mkfs command as high risk', () => {
            expect(assessRisk('mkfs.ext4 /dev/sda1', 'low')).toBe('high');
        });

        test('should detect fork bomb pattern as high risk', () => {
            expect(assessRisk(':(){ :|:& };:', 'low')).toBe('high');
        });

        test('should detect redirecting to /dev as high risk', () => {
            expect(assessRisk('echo "data" > /dev/sda', 'low')).toBe('high');
        });

        test('should return ai risk if no high risk patterns found', () => {
            expect(assessRisk('ls -la', 'low')).toBe('low');
            expect(assessRisk('cat file.txt', 'medium')).toBe('medium');
            expect(assessRisk('grep "pattern" file', 'high')).toBe('high');
        });

        test('should override ai risk if high risk pattern detected', () => {
            expect(assessRisk('rm -rf file', 'low')).toBe('high');
            expect(assessRisk('sudo ls', 'medium')).toBe('high');
            expect(assessRisk('chmod 777 file', 'medium')).toBe('high');
        });

        test('should be case insensitive for dangerous commands', () => {
            expect(assessRisk('RM file.txt', 'low')).toBe('high');
            expect(assessRisk('SUDO cmd', 'low')).toBe('high');
            expect(assessRisk('CHMOD 777 file', 'low')).toBe('high');
        });
});
````

## 📄 `test/test_agent_pipeline.js`

````javascript
#!/usr/bin/env node

/**
 * Agent Pipeline 测试脚本
 * 
 * 用法：
 *   node test_agent_pipeline.js
 */

const { AgentPipeline } = require('../dist/agent');

async function testChatMode() {
    console.log('\n=== 测试 Chat 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "简单解释一下什么是冒泡排序",
                options: {
                    verbose: true
                }
            },
            'chat'
        );

        console.log('\n✅ Chat 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Chat 模式测试失败:', error.message);
    }
}

async function testCommandMode() {
    console.log('\n=== 测试 Command 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "列出当前目录的所有 TypeScript 文件",
                options: {
                    verbose: true,
                    autoYes: false  // 不自动执行，只生成命令
                }
            },
            'command'
        );

        console.log('\n✅ Command 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Command 模式测试失败:', error.message);
    }
}

async function testExecutionRecord() {
    console.log('\n=== 测试执行记录 ===\n');

    const { getRecords } = require('../dist/agent/record');

    const records = getRecords();
    console.log(`当前共有 ${records.length} 条执行记录`);

    if (records.length > 0) {
        const latest = records[records.length - 1];
        console.log('\n最新记录:');
        console.log(`  ID: ${latest.id}`);
        console.log(`  模式: ${latest.mode}`);
        console.log(`  时间: ${new Date(latest.timestamp).toLocaleString()}`);
        console.log(`  模型: ${latest.model}`);
        console.log(`  延迟: ${latest.llmResult.latencyMs}ms`);
    }

    console.log('\n✅ 执行记录测试通过\n');
}

async function main() {
    console.log('🚀 开始测试 Agent Pipeline\n');

    // 注意：这些测试需要有效的 AI API 配置
    // 如果没有配置，测试会失败

    try {
        await testChatMode();
        // await testCommandMode();  // 取消注释以测试命令模式
        await testExecutionRecord();

        console.log('\n🎉 所有测试完成！\n');
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

````

## 📄 `test/test_logic.js`

````javascript
const getVisualLineCount = (text, columns = 20) => {
    const lines = text.split('\n');
    let totalLines = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        let visualWidth = 0;
        for (let j = 0; j < cleanLine.length; j++) {
            visualWidth += cleanLine.charCodeAt(j) > 255 ? 2 : 1;
        }
        const consumed = Math.max(1, Math.ceil(visualWidth / columns));
        totalLines += consumed;
        console.log(`Line ${i}: "${line}" (width ${visualWidth}) -> consumed ${consumed}`);
    }
    return totalLines;
};

console.log('--- Test 1: "Hello" ---');
console.log('Total:', getVisualLineCount('Hello'));

console.log('--- Test 2: "Hello\\n" ---');
console.log('Total:', getVisualLineCount('Hello\n'));

console.log('--- Test 3: 25 chars in 20 width ---');
console.log('Total:', getVisualLineCount('a'.repeat(25)));

````

## 📄 `tsconfig.json`

````json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "CommonJS",
        "moduleResolution": "node",
        "rootDir": "src",
        "outDir": "dist",
        "declaration": true,
        "sourceMap": true,
        "strict": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,
        "resolveJsonModule": true
    },
    "include": [
        "src"
    ],
    "exclude": [
        "node_modules",
        "**/*.test.ts"
    ]
}
````

## 📄 `verify.sh`

````bash
#!/bin/bash

# ==========================================
# yuangs CLI - 自动化构建与发布验证脚本
# ==========================================

# 设置遇到错误立即停止
set -e

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[Step] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[Warn] $1${NC}"
}

error() {
    echo -e "${RED}[Error] $1${NC}"
    exit 1
}

# 1. 环境清理
log "1. 清理旧构建产物..."
rm -rf dist/
rm -f *.tgz
# 确保根目录没有残留的 index.js (之前的历史遗留问题)
if [ -f "index.js" ]; then
    warn "发现根目录存在 index.js，正在删除以确保环境纯净..."
    rm index.js
fi

# 2. Node.js 版本检查
log "2. 检查 Node.js 版本..."
NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js 版本太低 (当前: $(node -v))，必须 >= 18"
fi

# 3. 安装依赖
log "3. 检查依赖..."
npm install

# 4. TypeScript 构建
log "4. 执行构建 (npm run build)..."
npm run build

# 验证构建产物是否存在
if [ ! -f "dist/cli.js" ]; then
    error "构建失败：dist/cli.js 未生成"
fi

# 5. 单元测试
log "5. 运行单元测试 (npm test)..."
# 注意：你的测试依赖于 dist/ 目录，所以必须在 build 之后运行
npm test

# 6. NPM 打包模拟
log "6. 模拟 NPM 打包 (npm pack)..."
npm pack

# 获取生成的 tgz 文件名
PACKAGE_FILE=$(ls yuangs-*.tgz | head -n 1)

if [ -z "$PACKAGE_FILE" ]; then
    error "打包失败：未找到 .tgz 文件"
fi

echo -e "📦 生成包文件: ${YELLOW}$PACKAGE_FILE${NC}"

# 7. 包内容验证 (防止源码泄漏)
log "7. 验证包内容结构..."
# 检查是否包含 dist 目录
if ! tar -tf "$PACKAGE_FILE" | grep -q "dist/cli.js"; then
    error "包结构错误：缺少 dist/cli.js"
fi

# 检查是否包含 src 目录 (不应该包含)
if tar -tf "$PACKAGE_FILE" | grep -q "^package/src/"; then
    error "包结构错误：包含了 src/ 源码目录 (请检查 package.json 的 files 字段)"
else
    echo "✅ 源码未泄漏 (src/ 目录未包含)"
fi

# 8. 执行冒烟测试 (运行构建后的 CLI)...
log "8. 执行冒烟测试 (运行构建后的 CLI)..."

# 测试 help 命令
echo "Testing: yuangs --help"
node dist/cli.js --help > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Help 命令正常"
else
    error "Help 命令执行失败"
fi

# 测试 version 命令
echo "Testing: yuangs --version"
VERSION_OUTPUT=$(node dist/cli.js --version)
echo "✅ 版本号显示: $VERSION_OUTPUT"

# 9. 完成
log "9. 完成验证"
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}🎉 验证通过！项目状态健康，随时可以发布。${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
````

## 📄 `yuangs.config.example.json`

````json
{
  "shici": "https://wealth.want.biz/shici/index.html",
  "dict": "https://wealth.want.biz/pages/dict.html",
  "pong": "https://wealth.want.biz/pages/pong.html",
  "github": "https://github.com",
  "calendar": "https://calendar.google.com",
  "mail": "https://mail.google.com",
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "defaultModel": "Assistant",
  "accountType": "free"
}
````

## 📄 `yuangs.config.example.yaml`

````yaml
# Example configuration file for yuangs CLI
# Add your custom applications here

shici: "https://wealth.want.biz/shici/index.html"
dict: "https://wealth.want.biz/pages/dict.html"
pong: "https://wealth.want.biz/pages/pong.html"
github: "https://github.com"
calendar: "https://calendar.google.com"
mail: "https://mail.google.com"

# AI Configuration
aiProxyUrl: "https://aiproxy.want.biz/v1/chat/completions"
defaultModel: "Assistant"
accountType: "free"

# You can also use the apps property if you prefer to group them
# apps:
#   shici: "https://wealth.want.biz/shici/index.html"
#   dict: "https://wealth.want.biz/pages/dict.html"
#   pong: "https://wealth.want.biz/pages/pong.html"
#   github: "https://github.com"
#   calendar: "https://calendar.google.com"
#   mail: "https://mail.google.com"

````

## 📄 `yuangs.config.json`

````json
{
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "defaultModel": "gemini-2.5-flash",
  "accountType": "paid",
  "models": [
    {
      "name": "gemini-2.5-flash",
      "provider": "gemini",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 1000000,
      "costProfile": "low"
    },
    {
      "name": "gemini-2.5-flash-lite",
      "provider": "gemini",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 1000000,
      "costProfile": "low"
    },
    {
      "name": "Assistant",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning"
      ],
      "contextWindow": 128000,
      "costProfile": "low"
    },
    {
      "name": "GPT-4o-mini",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "streaming"
      ],
      "contextWindow": 128000,
      "costProfile": "low"
    },
    {
      "name": "POE-DeepSeek-V3.2",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning"
      ],
      "contextWindow": 32768,
      "costProfile": "medium"
    },
    {
      "name": "POE-Gemini-3-Flash",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 2000000,
      "costProfile": "low"
    },
    {
      "name": "POE-Gemini-3-Pro",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 2000000,
      "costProfile": "high"
    },
    {
      "name": "GLM-4-Flash",
      "provider": "zhipu",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning"
      ],
      "contextWindow": 128000,
      "costProfile": "low"
    }
  ]
}

````
