import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult, TaskType } from '../types';

/**
 * Gemini CLI 适配器
 * 支持 Gemini 系列模型
 * 使用 https://github.com/google-gemini/gemini-cli
 */
export class GoogleAdapter extends BaseAdapter {
  name = 'google-gemini';
  version = '1.0.0';
  provider = 'Google';
  failureDomain = 'google';

  capabilities: ModelCapabilities = {
    supportedTaskTypes: [
      TaskType.CODE_GENERATION,
      TaskType.CODE_REVIEW,
      TaskType.CONVERSATION,
      TaskType.TRANSLATION,
      TaskType.SUMMARIZATION,
      TaskType.ANALYSIS,
      TaskType.DEBUG,
      TaskType.GENERAL,
    ],
    maxContextWindow: 1000000, // Gemini 1M+ context
    avgResponseTime: 2000,
    costLevel: 2,
    supportsStreaming: true,
    specialCapabilities: ['long-context', 'multimodal'],
  };

  private getApiKey(): string | undefined {
    // 优先从环境变量获取
    if (process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }

    // 尝试从 yuangs 配置读取
    try {
      const { getUserConfig } = require('../../../ai/client');
      const config = getUserConfig();
      return config.geminiApiKey;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * 健康检查：检查 Gemini CLI 是否安装并已配置
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { execSync } = require('child_process');
      try {
        execSync('which gemini', { stdio: 'ignore' });
      } catch (e) {
        console.warn('⚠️  Gemini CLI 未安装 (which gemini 失败)');
        return false;
      }

      // 检查版本以确认安装
      const { stdout } = await this.runSpawnCommand(
        'gemini',
        ['--version'],
        30000 
      );

      if (!stdout.trim()) {
        console.warn('⚠️  Gemini CLI 返回版本信息为空');
        return false;
      }

      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('⚠️  未配置 GEMINI_API_KEY (环境变量 或 .yuangs.json 中的 geminiApiKey)');
        return false;
      }

      return true;
    } catch (error: any) {
      console.warn(`⚠️  Gemini 检查异常: ${error.message}`);
      return false;
    }
  }

  /**
   * 执行任务
   */
  async execute(
    prompt: string,
    config: TaskConfig,
    onChunk?: (chunk: string) => void
  ): Promise<ModelExecutionResult> {
    try {
      const apiKey = this.getApiKey();
      
      const { result, executionTime } = await this.measureExecutionTime(async () => {
        // 根据任务类型选择合适的模型
        const model = this.selectModel(config.type);

        // 构建参数数组 (适配 gemini-cli 0.1.7)
        const args = [
          '-p', prompt,
          '-m', model,
        ];

        const { stdout, stderr } = await this.runSpawnCommand(
          'gemini',
          args,
          config.expectedResponseTime || 60000,
          onChunk,
          apiKey ? { GEMINI_API_KEY: apiKey } : undefined
        );

        // 检查是否有 API key 错误
        if (stdout.includes('GEMINI_API_KEY') || stderr.includes('GEMINI_API_KEY')) {
          throw new Error('未配置 GEMINI_API_KEY 环境变量。请设置后重试。');
        }

        if (stderr && !stdout) {
          throw new Error(stderr);
        }

        // 解析输出
        return this.parseGeminiOutput(stdout);
      });

      return this.createSuccessResult(result, executionTime, {
        model: this.selectModel(config.type),
        provider: this.provider,
      });
    } catch (error: any) {
      return this.createErrorResult(
        `Gemini CLI 执行失败: ${error.message}`,
        0
      );
    }
  }

  /**
   * 根据任务类型选择模型
   */
  private selectModel(taskType: TaskType): string {
    switch (taskType) {
      case TaskType.CODE_GENERATION:
      case TaskType.CODE_REVIEW:
        return 'gemini-2.5-flash';
      case TaskType.CONVERSATION:
      case TaskType.GENERAL:
        return 'gemini-2.5-flash';
      default:
        return 'gemini-2.5-flash';
    }
  }

  /**
   * 解析 Gemini CLI 输出
   */
  private parseGeminiOutput(output: string): string {
    try {
      // Gemini CLI 在 JSON 模式下输出结构化数据
      const jsonContent = this.extractJsonContent(output);

      try {
        const parsed = JSON.parse(jsonContent);

        // Gemini CLI JSON 输出格式: { response: "...", ... }
        if (parsed.response) {
          return parsed.response;
        }

        // 如果没有 response 字段，尝试其他可能的字段
        if (parsed.text) {
          return parsed.text;
        }

        if (parsed.content) {
          return parsed.content;
        }

        // 如果是 Google API 格式
        if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
          return parsed.candidates[0].content.parts[0].text;
        }

        return jsonContent;
      } catch {
        // JSON 解析失败，继续处理
      }

      // 如果不是 JSON 格式，直接返回清理后的文本
      const lines = output.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 &&
          !trimmed.startsWith('[') &&
          !trimmed.startsWith('WARNING') &&
          !trimmed.startsWith('Updates');
      });

      return lines.join('\n').trim();
    } catch {
      return output.trim();
    }
  }
}
