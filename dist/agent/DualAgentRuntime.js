"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DualAgentRuntime = void 0;
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
const executor_1 = require("./executor");
const contextManager_1 = require("./contextManager");
const client_1 = require("../ai/client");
const modelRouterIntegration_1 = require("./modelRouterIntegration");
class DualAgentRuntime {
    context;
    executionId;
    steps = [];
    currentIndex = 0;
    constructor(initialContext) {
        this.context = new contextManager_1.ContextManager(initialContext);
        this.executionId = (0, crypto_1.randomUUID)();
    }
    async run(userInput, onChunk, model) {
        const needsPlanner = await this.shouldUsePlanner(userInput);
        if (!needsPlanner) {
            await this.runFastPath(userInput, onChunk, model);
        }
        else {
            await this.runPlannedPath(userInput, onChunk, model);
        }
    }
    async shouldUsePlanner(userInput) {
        const config = (0, client_1.getUserConfig)();
        if (config.disablePlanner) {
            return false;
        }
        const plannerKeywords = ['重构', '优化整个', '批量', '多步骤', '逐个', '依次', '计划', 'refactor', 'optimize all', 'batch', 'multiple steps', 'sequentially'];
        if (!plannerKeywords.some(kw => userInput.toLowerCase().includes(kw.toLowerCase()))) {
            return false;
        }
        const complexityScore = await this.assessComplexity(userInput);
        return complexityScore > 0.7;
    }
    async assessComplexity(input) {
        const simpleIndicators = [
            /列出|list|ls/,
            /查看|show|cat|less/,
            /查找|find|grep/,
            /创建|create|mkdir|touch/
        ];
        const hasSimpleIndicator = simpleIndicators.some(pattern => pattern.test(input));
        const plannerKeywords = ['重构', '优化整个', '批量', '多步骤', '逐个', '依次', '计划', 'refactor', 'optimize all', 'batch', 'multiple steps', 'sequentially'];
        const hasPlannerKeyword = plannerKeywords.some(kw => input.toLowerCase().includes(kw.toLowerCase()));
        // If input has planner keywords, treat as high complexity
        if (hasPlannerKeyword) {
            return 0.8;
        }
        if (input.length < 30 || hasSimpleIndicator) {
            return 0.3;
        }
        return 0.8;
    }
    async runFastPath(userInput, onChunk, model) {
        console.log(chalk_1.default.gray('🚀 Quick path: Direct execution'));
        const runtime = await this.importAgentRuntime();
        this.context.addMessage('user', userInput);
        await runtime.run(userInput, 'command', onChunk, model);
    }
    async runPlannedPath(userInput, onChunk, model) {
        console.log(chalk_1.default.blue('📋 Planning task...'));
        const plan = await this.callPlanner(userInput, model);
        this.steps = plan.steps;
        console.log(chalk_1.default.cyan(`\nPlan created with ${this.steps.length} steps:\n`));
        this.steps.forEach((step, i) => {
            const icon = step.risk_level === 'high' ? '⚠️' : '✅';
            console.log(`  ${i + 1}. ${icon} ${step.description}`);
        });
        console.log(chalk_1.default.gray(`\n${plan.plan}`));
        console.log(chalk_1.default.gray(`Estimated time: ${plan.estimated_time}\n`));
        const shouldProceed = await this.askUser('Proceed with this plan? (y/N): ');
        if (!shouldProceed) {
            console.log(chalk_1.default.yellow('Execution cancelled by user.'));
            return;
        }
        for (let i = 0; i < this.steps.length; i++) {
            this.currentIndex = i;
            const step = this.steps[i];
            console.log(chalk_1.default.yellow(`\n▶️  Step ${i + 1}/${this.steps.length}: ${step.description}`));
            const result = await this.executeStep(step, onChunk, model, userInput);
            if (!result.success) {
                console.log(chalk_1.default.red(`❌ Step failed: ${result.error}`));
                const shouldContinue = await this.askUser('Step failed. Continue with remaining steps? (y/N): ');
                if (!shouldContinue) {
                    console.log(chalk_1.default.yellow('Execution stopped by user.'));
                    break;
                }
            }
            else {
                console.log(chalk_1.default.green(`✅ Step completed`));
                if (result.output && result.output.length > 0) {
                    const preview = result.output.length > 300 ? result.output.substring(0, 300) + '...' : result.output;
                    console.log(chalk_1.default.gray(`   Output: ${preview}`));
                }
            }
        }
        console.log(chalk_1.default.blue('\n🎉 All tasks completed!'));
    }
    async callPlanner(input, model) {
        const config = (0, client_1.getUserConfig)();
        const finalModel = model || config.defaultModel || 'Assistant';
        const prompt = this.buildPlannerPrompt(input);
        const messages = [{ role: 'user', content: prompt }];
        try {
            let response;
            if (model) {
                console.log(chalk_1.default.gray(`[Planner] Using specified model: ${model}`));
                response = await (0, client_1.askAI)(prompt, model);
            }
            else {
                console.log(chalk_1.default.gray(`[Planner] Choosing best model for planning...`));
                const routerResult = await (0, modelRouterIntegration_1.callLLMWithRouter)(messages, 'command', {
                    taskType: 'analysis', // Planning is primarily analysis
                    routingStrategy: 'best_quality' // We want high quality plans
                });
                response = routerResult.rawText || await (0, client_1.askAI)(prompt, finalModel);
            }
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            const braceMatch = response.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                return JSON.parse(braceMatch[0]);
            }
            return {
                plan: 'No plan generated',
                steps: [],
                estimated_time: 'Unknown'
            };
        }
        catch (error) {
            console.error(chalk_1.default.red(`Planner error: ${error}`));
            return {
                plan: 'Plan generation failed',
                steps: [],
                estimated_time: 'Unknown'
            };
        }
    }
    buildPlannerPrompt(input) {
        const context = this.getContextSummary();
        return `# ROLE: Task Planner

You are a strategic planner. Break down complex tasks into executable steps.

# INPUT
User Request: ${input}

${context ? `Context:\n${context}\n` : ''}

# OUTPUT FORMAT
\`\`\`json
{
  "plan": "Brief overview of the approach",
  "steps": [
    {
      "id": "step_1",
      "description": "What to do",
      "type": "shell_cmd | tool_call | analysis | code_diff",
      "command": "Command if shell_cmd",
      "tool_name": "Tool name if tool_call",
      "parameters": {},
      "risk_level": "low | medium | high",
      "dependencies": []
    }
  ],
  "estimated_time": "2 minutes"
}
\`\`\`

# GUIDELINES
- Keep steps granular and verifiable
- Mark destructive operations (rm, dd, format) as high risk
- Include validation steps when appropriate
- Consider error handling in each step
- For shell commands, use exact commands that can be executed directly
- For tool calls, specify tool_name and parameters
- Dependencies are step IDs that must complete before this step`;
    }
    getContextSummary() {
        const files = this.context.getMessages()
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n');
        return files ? `Files/Context:\n${files}` : '';
    }
    async executeStep(step, onChunk, model, originalInput = '') {
        const action = {
            id: (0, crypto_1.randomUUID)(),
            type: step.type,
            payload: {
                tool_name: step.tool_name || '',
                parameters: step.parameters || {},
                command: step.command || '',
                risk_level: step.risk_level
            },
            riskLevel: step.risk_level,
            reasoning: `Executing planned step: ${step.description}`
        };
        const result = await executor_1.ToolExecutor.execute(action);
        if (result.success) {
            this.context.addToolResult(step.type, result.output);
            try {
                const { createExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionRecord')));
                const { saveExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionStore')));
                const record = createExecutionRecord(`agent-planner-${step.type}`, { required: [], preferred: [] }, {
                    aiProxyUrl: { value: '', source: 'built-in' },
                    defaultModel: { value: '', source: 'built-in' },
                    accountType: { value: 'free', source: 'built-in' }
                }, { selected: null, candidates: [], fallbackOccurred: false }, { success: true }, step.command || JSON.stringify(step.parameters), this.executionId, 'agent');
                record.llmResult = { plan: { goal: step.description, command: step.command, parameters: step.parameters, risk_level: step.risk_level } };
                record.input = { rawInput: originalInput };
                const savedRecordId = saveExecutionRecord(record);
                const { loadExecutionRecord } = await Promise.resolve().then(() => __importStar(require('../core/executionStore')));
                const savedRecord = loadExecutionRecord(savedRecordId);
                if (savedRecord) {
                    const { learnSkillFromRecord } = await Promise.resolve().then(() => __importStar(require('./skills')));
                    learnSkillFromRecord(savedRecord, true);
                }
            }
            catch (error) {
                console.warn(chalk_1.default.yellow(`[Skill Learning] Failed: ${error}`));
            }
        }
        else {
            this.context.addToolResult(step.type, `Error: ${result.error}`);
            try {
                const { getAllSkills, updateSkillStatus } = await Promise.resolve().then(() => __importStar(require('./skills')));
                const skills = getAllSkills();
                const existingSkill = skills.find(s => s.name === step.description);
                if (existingSkill) {
                    updateSkillStatus(existingSkill.id, false);
                }
            }
            catch (error) {
                console.warn(chalk_1.default.yellow(`[Skill Learning] Failed to update status: ${error}`));
            }
        }
        return {
            success: result.success,
            output: result.output,
            error: result.error
        };
    }
    async importAgentRuntime() {
        const module = await Promise.resolve().then(() => __importStar(require('./AgentRuntime')));
        const AgentRuntime = module.AgentRuntime;
        return new AgentRuntime({});
    }
    async askUser(question) {
        const readline = await Promise.resolve().then(() => __importStar(require('readline')));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }
    getExecutionState() {
        return {
            steps: this.steps,
            currentIndex: this.currentIndex
        };
    }
}
exports.DualAgentRuntime = DualAgentRuntime;
//# sourceMappingURL=DualAgentRuntime.js.map