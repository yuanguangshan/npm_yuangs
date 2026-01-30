import { GitService } from '../git/GitService';
import { runLLM, AIError } from '../../agent/llm';
import { AIRequestMessage } from '../../core/validation';
import { CapabilityLevel, MinCapability } from '../capability/CapabilityLevel';
import { defaultCostProfileCalculator } from '../capability/CostProfile';
import { DIFF_ESTIMATION } from '../../commands/git/constants';
import { cleanLLMOutput, deduplicateFiles } from '../../commands/git/utils';
import {
  PlanInput,
  PlanOutput,
  WorkflowConfig,
  WorkflowResult,
  WorkflowError,
  workflowSuccess,
  workflowFailure
} from './types';

export class PlanWorkflow {
  constructor(
    private gitService: GitService
  ) {}

  async run(input: PlanInput, config: WorkflowConfig): Promise<WorkflowResult<PlanOutput>> {
    try {
      const maxRounds = input.maxRounds || 2;
      const architectModel = input.architectModel || 'Assistant';
      const reviewerModel = input.reviewerModel || 'gemini-2.5-flash-lite';

      const projectContext = await this.gatherGitContext(input.userPrompt);

      let currentPlan = '';
      let reviewComments = '';

      for (let round = 0; round < maxRounds; round++) {
        if (round === 0) {
          currentPlan = await this.generateArchitectDraft(projectContext, architectModel);
        } else {
          reviewComments = await this.generateReviewerReview(projectContext, currentPlan, reviewerModel);
          currentPlan = await this.refineArchitectPlan(currentPlan, reviewComments, architectModel);
        }
      }

      const output = await this.generateFinalTodo(currentPlan, config);
      return workflowSuccess(output, 'Plan generated successfully', output.estimatedTokens);
    } catch (error) {
      if (error instanceof AIError) {
        return workflowFailure(
          'LLM call failed during planning',
          [
            WorkflowError.externalService(
              'LLM service unavailable or returned error',
              error
            )
          ]
        );
      }

      return workflowFailure(
        'Unexpected error during planning',
        [
          WorkflowError.internalBug('Planning failed', error as Error)
        ]
      );
    }
  }

  private async gatherGitContext(userPrompt: string): Promise<string> {
    const commits = await this.gitService.getRecentCommits(10);
    const commitContext = commits.length > 0
      ? commits.map(c => `- ${c.date} [${c.hash.substring(0, 7)}] ${c.message}`).join('\n')
      : '暂无提交记录';

    return `
[项目背景 - 最近 Git 提交]
${commitContext}

[用户需求]
${userPrompt}
`;
  }

  private async generateArchitectDraft(
    projectContext: string,
    model: string
  ): Promise<string> {
    const draftPrompt: AIRequestMessage[] = [
      {
        role: 'system',
        content: `你是一个资深软件架构师。请根据 Git 历史确保新功能与现有代码风格一致。
请基于用户需求输出一份初步的开发计划 (Draft Plan)。
包含：核心目标、修改文件列表、关键步骤。`
      },
      { role: 'user', content: projectContext }
    ];

    const draftRes = await runLLM({
      prompt: { messages: draftPrompt },
      model: model,
      stream: false,
      bypassRouter: true
    });

    return draftRes.rawText;
  }

  private async generateReviewerReview(
    projectContext: string,
    currentPlan: string,
    model: string
  ): Promise<string> {
    const reviewPrompt: AIRequestMessage[] = [
      {
        role: 'system',
        content: `你是一个严格的代码审查员和产品经理。
你的任务是找出架构师方案中的漏洞、遗漏、安全风险或逻辑错误。
请简明扼要地列出修改建议。不要重写计划，只给建议。`
      },
      {
        role: 'user',
        content: `
${projectContext}

[待评审的方案]
${currentPlan}
`
      }
    ];

    const reviewRes = await runLLM({
      prompt: { messages: reviewPrompt },
      model: model,
      stream: false,
      bypassRouter: true
    });

    return reviewRes.rawText;
  }

  private async refineArchitectPlan(
    currentPlan: string,
    reviewComments: string,
    model: string
  ): Promise<string> {
    const refinePrompt: AIRequestMessage[] = [
      {
        role: 'system',
        content: `你是一个资深软件架构师。请根据审查员的意见优化你的开发计划。`
      },
      {
        role: 'user',
        content: `
这是你之前的方案：
${currentPlan}

审查员给出的意见：
${reviewComments}

请输出修正后的完整方案。`
      }
    ];

    const refineRes = await runLLM({
      prompt: { messages: refinePrompt },
      model: model,
      stream: false,
      bypassRouter: true
    });

    return refineRes.rawText;
  }

  private async generateFinalTodo(
    currentPlan: string,
    config: WorkflowConfig
  ): Promise<PlanOutput> {
    const diff = await this.gitService.getDiff();
    const allFiles = deduplicateFiles([...diff.files.staged, ...diff.files.unstaged]);

    let estimatedTotalLines = 0;
    try {
      const numstat = await this.gitService.getDiffNumstat();
      estimatedTotalLines = numstat.added + numstat.deleted;

      if (estimatedTotalLines === 0 && allFiles.length > 0) {
        estimatedTotalLines = allFiles.length * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
      }
    } catch (e) {
      estimatedTotalLines = allFiles.length * DIFF_ESTIMATION.LINES_PER_FILE_FALLBACK;
    }

    const costProfile = defaultCostProfileCalculator.calculate(allFiles, estimatedTotalLines);

    const finalPrompt: AIRequestMessage[] = [
      {
        role: 'system',
        content: `你是一个技术文档专家。请将以下开发方案整理为一份标准的 todo.md 文档。

重要要求：
1. 格式清晰，使用 Markdown Checkbox (- [ ] )。
2. 包含 [目标]、[文件变更]、[详细步骤]。
3. 直接输出 Markdown 内容，不要使用 Markdown 代码块 (\`\`\`) 包裹。
4. 不要包含任何对话式前缀（如"好的"、"这是"）或后缀（如"希望这对你有帮助"）。
5. 开头直接输出内容，不要有任何问候语或开场白。

能力等级标注：
- SEMANTIC: 语义理解，需要理解代码意图和设计
- STRUCTURAL: 结构分析，需要理解代码结构和依赖关系
- LINE: 行级分析，需要理解具体代码行
- TEXT: 文本分析，只需要处理文本内容
- NONE: 无需智能分析

格式示例：
- [ ] 实现用户认证 [SEMANTIC]
  - capability: SEMANTIC
  - fallbackChain: [STRUCTURAL, LINE, TEXT, NONE]`
      },
      {
        role: 'user',
        content: currentPlan
      }
    ];

    const finalResponse = await runLLM({
      prompt: { messages: finalPrompt },
      model: 'Assistant',
      stream: false,
      bypassRouter: true
    });

    console.error('[DEBUG PlanWorkflow] Raw LLM output length:', finalResponse.rawText.length);
    console.error('[DEBUG PlanWorkflow] Raw LLM output preview:', finalResponse.rawText.substring(0, 500));
    
    const todoMarkdown = cleanLLMOutput(finalResponse.rawText);
    
    console.error('[DEBUG PlanWorkflow] Cleaned output length:', todoMarkdown.length);
    console.error('[DEBUG PlanWorkflow] Cleaned output preview:', todoMarkdown.substring(0, 500));

    const scope = this.determineScope(allFiles, estimatedTotalLines);

    return {
      todoMarkdown,
      capability: {
        minCapability: costProfile.requiredCapability,
        fallbackChain: this.generateFallbackChain(costProfile.requiredCapability)
      },
      estimatedTime: costProfile.estimatedTime,
      estimatedTokens: costProfile.estimatedTokens,
      scope
    };
  }

  private generateFallbackChain(minCapability: CapabilityLevel): CapabilityLevel[] {
    const levels = [
      CapabilityLevel.SEMANTIC,
      CapabilityLevel.STRUCTURAL,
      CapabilityLevel.LINE,
      CapabilityLevel.TEXT,
      CapabilityLevel.NONE
    ];

    const startIndex = levels.indexOf(minCapability);
    return startIndex >= 0 ? levels.slice(startIndex) : levels;
  }

  private determineScope(
    files: string[],
    estimatedLines: number
  ): 'small' | 'medium' | 'large' {
    if (files.length <= 3 && estimatedLines <= 100) {
      return 'small';
    }
    if (files.length <= 10 && estimatedLines <= 500) {
      return 'medium';
    }
    return 'large';
  }
}
