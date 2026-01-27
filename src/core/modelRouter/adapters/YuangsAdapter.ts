import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult, TaskType } from '../types';
import { callAI_Stream, askAI } from '../../../ai/client';

/**
 * Yuangs 内部适配器
 * 调用 yuangs 自带的 AI 客户端，通常对应配置文件中的 "Assistant" 模型
 */
export class YuangsAdapter extends BaseAdapter {
  name = 'yuangs';
  version = '1.0.0';
  provider = 'Internal';

  capabilities: ModelCapabilities = {
    supportedTaskTypes: [
      TaskType.CODE_GENERATION,
      TaskType.CODE_REVIEW,
      TaskType.CONVERSATION,
      TaskType.TRANSLATION,
      TaskType.SUMMARIZATION,
      TaskType.ANALYSIS,
      TaskType.DEBUG,
      TaskType.COMMAND_GENERATION,
      TaskType.GENERAL,
    ],
    maxContextWindow: 128000,
    avgResponseTime: 1000,
    costLevel: 1,
    supportsStreaming: true,
  };

  async isAvailable(): Promise<boolean> {
    return true; 
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async execute(
    prompt: string,
    config: TaskConfig,
    onChunk?: (chunk: string) => void
  ): Promise<ModelExecutionResult> {
    const startTime = Date.now();
    try {
      if (onChunk) {
        let fullContent = '';
        await callAI_Stream(
          [{ role: 'user', content: prompt }],
          undefined, // 使用默认模型 (Assistant)
          (chunk) => {
            fullContent += chunk;
            onChunk(chunk);
          }
        );
        return this.createSuccessResult(fullContent, Date.now() - startTime);
      } else {
        const response = await askAI(prompt);
        return this.createSuccessResult(response, Date.now() - startTime);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message, Date.now() - startTime);
    }
  }
}
