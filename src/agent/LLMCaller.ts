import chalk from "chalk";
import { LLMAdapter } from "./llmAdapter";
import { AIError } from "./llm";
import { GovernanceService } from "./governance";
import { SmartContextManager } from "./smartContextManager";
import { AgentThought } from "./state";
import { StreamMarkdownRenderer } from '../utils/renderer';
import { buildDynamicContext, injectDynamicContext } from "./dynamicPrompt";
import { matchSkill, generateSkillPrompt } from './promptSkills';

/**
 * Handles all LLM interaction: prompt building, calling, and error recovery.
 */
export class LLMCaller {
  constructor(private context: SmartContextManager) {}

  /**
   * Build the final prompt with dynamic context and skill injection.
   */
  async buildPrompt(userInput: string, lastError: string | undefined): Promise<string> {
    const dynamicContext = await buildDynamicContext(lastError);
    const basePrompt = GovernanceService.getPolicyManual();
    let prompt = injectDynamicContext(basePrompt, dynamicContext);

    const skill = matchSkill(userInput);
    if (skill) {
      prompt += `\n\n[SKILL ACTIVE: ${skill.name}]\n${generateSkillPrompt(skill, userInput)}`;
    }

    return prompt;
  }

  /**
   * Call LLM with enhanced context.
   */
  async call(
    enhancedPrompt: string,
    userInput: string,
    mode: string,
    onChunk: ((chunk: string) => void) | undefined,
    model: string | undefined,
    renderer: StreamMarkdownRenderer | undefined
  ): Promise<AgentThought | null> {
    const messages: any[] = [];
    const enhancedContext = await this.context.getEnhancedContext({
      query: userInput || enhancedPrompt,
      minRelevance: 0.3,
      maxTokens: 8000,
      enableSmartSummary: true
    });

    if (enhancedContext.summary) {
      messages.push({ role: 'system', content: enhancedContext.summary });
    }
    for (const item of enhancedContext.rankedItems) {
      messages.push({
        role: 'user',
        content: `@${item.path} (相关度: ${(item.relevance * 100).toFixed(0)}%)\n${item.summary || item.content || ''}`
      });
    }
    if (userInput) {
      messages.push({ role: 'user', content: userInput });
    } else {
      messages.push({ role: 'user', content: enhancedPrompt });
    }

    try {
      const thought = await LLMAdapter.think(messages, mode as any, onChunk, model, enhancedPrompt, this.context);
      if (!thought.raw || thought.raw.trim() === '') {
        console.log(chalk.red('\n⚠️ AI 返回了空响应，请检查网络连接或模型配置。'));
        return null;
      }
      return thought;
    } catch (error: unknown) {
      this.handleError(error);
      return null;
    }
  }

  private handleError(error: unknown): void {
    let errorMessage = '未知内部错误';
    let statusCode = 0;

    if (error instanceof AIError) {
      errorMessage = error.message;
      statusCode = error.statusCode;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      statusCode = (error as any).statusCode || 0;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    const statusInfo = statusCode ? ` (状态码: ${statusCode})` : '';
    console.log(chalk.red(`\n❌ AI 思考过程发生错误: ${errorMessage}${statusInfo}`));

    const isTransient = statusCode === 429 || statusCode >= 500
      || errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ETIMEDOUT');

    if (isTransient) {
      console.log(chalk.yellow('⚠️ 检测到瞬时错误，自动跳过此轮'));
      this.context.addMessage("system", `AI 调用失败${statusInfo}，请稍后重试`);
      return;
    }

    this.context.addMessage("system", `思考过程中发生错误${statusInfo}: ${errorMessage}`);

    if (statusCode === 401 || statusCode === 403 || errorMessage.includes('401') || errorMessage.includes('403')) {
      console.log(chalk.yellow('💡 检测到权限或授权错误，请检查 API 配置。'));
    }
  }
}
