import chalk from 'chalk';
import { randomUUID } from 'crypto';
import { LLMAdapter } from './llmAdapter';
import { GovernanceService } from './governance';
import { ToolExecutor } from './executor';
import { ContextManager } from './contextManager';
import { ProposedAction } from './state';
import { TaskStep, TaskPlan } from './types';
import { ToolExecutionResult } from './state';
import { askAI, getUserConfig } from '../ai/client';
import { callLLMWithRouter } from './modelRouterIntegration';
import { PlanCache } from './PlanCache';

export class DualAgentRuntime {
  private context: ContextManager;
  private executionId: string;
  private steps: TaskStep[] = [];
  private currentIndex = 0;
  private planCache: PlanCache;

  constructor(initialContext: any, planCache?: PlanCache) {
    this.context = new ContextManager(initialContext);
    this.executionId = randomUUID();
    // 默认创建新的缓存实例，避免全局单例导致的测试隔离问题
    this.planCache = planCache || new PlanCache();
  }

  async run(
    userInput: string,
    onChunk?: (chunk: string) => void,
    model?: string
  ): Promise<void> {
    const needsPlanner = await this.shouldUsePlanner(userInput);

    if (!needsPlanner) {
      await this.runFastPath(userInput, onChunk, model);
    } else {
      await this.runPlannedPath(userInput, onChunk, model);
    }
  }

  private async shouldUsePlanner(userInput: string): Promise<boolean> {
    const config = getUserConfig();

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

  private async assessComplexity(input: string): Promise<number> {
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

  private async runFastPath(userInput: string, onChunk?: (chunk: string) => void, model?: string): Promise<void> {
    console.log(chalk.gray('🚀 Quick path: Direct execution'));

    const runtime = await this.importAgentRuntime();

    this.context.addMessage('user', userInput);
    await runtime.run(userInput, 'command', onChunk, model);
  }

  private async runPlannedPath(userInput: string, onChunk?: (chunk: string) => void, model?: string): Promise<void> {
    console.log(chalk.blue('📋 Planning task...'));

    const plan = await this.callPlanner(userInput, model);
    this.steps = plan.steps;

    console.log(chalk.cyan(`\nPlan created with ${this.steps.length} steps:\n`));
    this.steps.forEach((step, i) => {
      const icon = step.risk_level === 'high' ? '⚠️' : '✅';
      console.log(`  ${i + 1}. ${icon} ${step.description}`);
    });

    console.log(chalk.gray(`\n${plan.plan}`));
    console.log(chalk.gray(`Estimated time: ${plan.estimated_time}\n`));

    const shouldProceed = await this.askUser('Proceed with this plan? (y/N): ');
    if (!shouldProceed) {
      console.log(chalk.yellow('Execution cancelled by user.'));
      return;
    }

    for (let i = 0; i < this.steps.length; i++) {
      this.currentIndex = i;
      const step = this.steps[i];

      console.log(chalk.yellow(`\n▶️  Step ${i + 1}/${this.steps.length}: ${step.description}`));

      const result = await this.executeStep(step, onChunk, model, userInput);

      if (!result.success) {
        console.log(chalk.red(`❌ Step failed: ${result.error}`));

        const shouldContinue = await this.askUser('Step failed. Continue with remaining steps? (y/N): ');

        if (!shouldContinue) {
          console.log(chalk.yellow('Execution stopped by user.'));
          break;
        }
      } else {
        console.log(chalk.green(`✅ Step completed`));

        if (result.output && result.output.length > 0) {
          const preview = result.output.length > 300 ? result.output.substring(0, 300) + '...' : result.output;
          console.log(chalk.gray(`   Output: ${preview}`));
        }
      }
    }

    console.log(chalk.blue('\n🎉 All tasks completed!'));
  }

  private async callPlanner(input: string, model?: string): Promise<TaskPlan> {
    const config = getUserConfig();
    const finalModel = model || config.defaultModel || 'Assistant';

    // 使用计划缓存
    return this.planCache.getOrGenerate(input, async () => {
      const prompt = this.buildPlannerPrompt(input);
      const messages = [{ role: 'user', content: prompt }] as any[];

      try {
        let response: string;

        if (model) {
          console.log(chalk.gray(`[Planner] Using specified model: ${model}`));
          response = await askAI(prompt, model);
        } else {
          console.log(chalk.gray(`[Planner] Choosing best model for planning...`));
          const routerResult = await callLLMWithRouter(messages, 'command', {
            taskType: 'analysis' as any, // Planning is primarily analysis
            routingStrategy: 'best_quality' as any // We want high quality plans
          });
          response = routerResult.rawText || await askAI(prompt, finalModel);
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
      } catch (error) {
        console.error(chalk.red(`Planner error: ${error}`));
        return {
          plan: 'Plan generation failed',
          steps: [],
          estimated_time: 'Unknown'
        };
      }
    });
  }

  private buildPlannerPrompt(input: string): string {
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

  private getContextSummary(): string {
    const files = this.context.getMessages()
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    return files ? `Files/Context:\n${files}` : '';
  }

  private async executeStep(
    step: TaskStep,
    onChunk?: (chunk: string) => void,
    model?: string,
    originalInput: string = ''
  ): Promise<ToolExecutionResult> {
    const action: ProposedAction = {
      id: randomUUID(),
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

    const result = await ToolExecutor.execute(action);

    if (result.success) {
      this.context.addToolResult(step.type, result.output);

      try {
        const { createExecutionRecord } = await import('../core/executionRecord');
        const { saveExecutionRecord } = await import('../core/executionStore');

        const record = createExecutionRecord(
          `agent-planner-${step.type}`,
          { required: [], preferred: [] } as any,
          {
            aiProxyUrl: { value: '', source: 'built-in' },
            defaultModel: { value: '', source: 'built-in' },
            accountType: { value: 'free', source: 'built-in' }
          } as any,
          { selected: null, candidates: [], fallbackOccurred: false },
          { success: true },
          step.command || JSON.stringify(step.parameters),
          this.executionId,
          'agent'
        );

        (record as any).llmResult = { plan: { goal: step.description, command: step.command, parameters: step.parameters, risk_level: step.risk_level } };
        (record as any).input = { rawInput: originalInput };

        const savedRecordId = saveExecutionRecord(record);
        const { loadExecutionRecord } = await import('../core/executionStore');
        const savedRecord = loadExecutionRecord(savedRecordId);

        if (savedRecord) {
          const { learnSkillFromRecord } = await import('./skills');
          learnSkillFromRecord(savedRecord, true);
        }
      } catch (error) {
        console.warn(chalk.yellow(`[Skill Learning] Failed: ${error}`));
      }
    } else {
      this.context.addToolResult(step.type, `Error: ${result.error}`);

      try {
        const { getAllSkills, updateSkillStatus } = await import('./skills');
        const skills = getAllSkills();
        const existingSkill = skills.find(s => s.name === step.description);

        if (existingSkill) {
          updateSkillStatus(existingSkill.id, false);
        }
      } catch (error) {
        console.warn(chalk.yellow(`[Skill Learning] Failed to update status: ${error}`));
      }
    }

    return {
      success: result.success,
      output: result.output,
      error: result.error
    };
  }

  private async importAgentRuntime(): Promise<any> {
    const module = await import('./AgentRuntime');
    const AgentRuntime = module.AgentRuntime;
    return new AgentRuntime({});
  }

  private async askUser(question: string): Promise<boolean> {
    const readline = await import('readline');
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

  getExecutionState(): { steps: TaskStep[]; currentIndex: number } {
    return {
      steps: this.steps,
      currentIndex: this.currentIndex
    };
  }

  /**
   * 获取计划缓存统计
   */
  getPlanCacheStats() {
    return this.planCache.getStats();
  }

  /**
   * 清理计划缓存
   */
  clearPlanCache() {
    this.planCache.clear();
  }

  /**
   * 清理过期的计划缓存
   */
  cleanupPlanCache() {
    return this.planCache.cleanup();
  }
}
