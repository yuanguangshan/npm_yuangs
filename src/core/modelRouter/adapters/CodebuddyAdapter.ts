import { BaseAdapter } from '../BaseAdapter';
import { ModelCapabilities, TaskConfig, ModelExecutionResult, TaskType } from '../types';
import { AIRequestMessage } from '../../../core/validation';

/**
 * Codebuddy CLI 适配器
 * 专门用于代码相关的任务
 */
export class CodebuddyAdapter extends BaseAdapter {
  name = 'codebuddy';
  version = '1.0.0';
  provider = 'Codebuddy';

  capabilities: ModelCapabilities = {
    supportedTaskTypes: [
      TaskType.CODE_GENERATION,
      TaskType.CODE_REVIEW,
      TaskType.DEBUG,
      TaskType.ANALYSIS,
    ],
    maxContextWindow: 100000,
    avgResponseTime: 3000,
    costLevel: 3,
    supportsStreaming: true,
    specialCapabilities: ['code-expert', 'repository-aware', 'multi-file-context'],
  };

  /**
   * 健康检查：检查 codebuddy CLI 是否安装
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.checkCommand('codebuddy');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 执行任务
   */
  async execute(
    prompt: string | AIRequestMessage[],
    config: TaskConfig,
    onChunk?: (chunk: string) => void
  ): Promise<ModelExecutionResult> {
    try {
      const { result, executionTime } = await this.measureExecutionTime(async () => {
        // 处理 prompt: 如果是数组，则合并为字符串
        const singlePrompt = typeof prompt === 'string' 
            ? prompt 
            : prompt.map(m => `${m.role}: ${m.content}`).join('\n\n');

        // 构建参数数组
        const args = ['-p', singlePrompt];
        
        // 根据任务类型添加 flags
        this.addTaskSpecificArgs(args, config.type);

        const { stdout, stderr } = await this.runSpawnCommand(
          'codebuddy',
          args,
          config.expectedResponseTime || 60000, // Codebuddy 可能需要更长时间
          onChunk
        );

        if (stderr && !stdout) {
          throw new Error(stderr);
        }

        // 解析输出
        return this.parseCodebuddyOutput(stdout);
      });

      return this.createSuccessResult(result, executionTime, {
        model: 'codebuddy',
        provider: this.provider,
        taskType: config.type,
      });
    } catch (error: any) {
      return this.createErrorResult(
        `Codebuddy CLI 执行失败: ${error.message}`,
        0
      );
    }
  }

  /**
   * 根据任务类型添加特定的 args
   */
  private addTaskSpecificArgs(args: string[], taskType: TaskType): void {
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        args.push('--mode', 'generate');
        break;
      case TaskType.CODE_REVIEW:
        args.push('--mode', 'review');
        break;
      case TaskType.DEBUG:
        args.push('--mode', 'debug');
        break;
      case TaskType.ANALYSIS:
        args.push('--mode', 'analyze');
        break;
    }
  }

  /**
   * 解析 Codebuddy CLI 输出
   */
  private parseCodebuddyOutput(output: string): string {
    try {
      // 尝试解析 JSON
      const jsonContent = this.extractJsonContent(output);
      
      if (jsonContent !== output) {
        try {
          const parsed = JSON.parse(jsonContent);
          if (parsed.response) {
            return parsed.response;
          }
          if (parsed.content) {
            return parsed.content;
          }
        } catch {
          // JSON 解析失败，继续处理
        }
      }

      // 如果不是 JSON，过滤日志行
      const lines = output.split('\n');
      const contentLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('[INFO]') && 
               !trimmed.startsWith('[DEBUG]') &&
               !trimmed.startsWith('[WARN]') &&
               !trimmed.startsWith('Loading');
      });

      return contentLines.join('\n').trim();
    } catch {
      return output.trim();
    }
  }
}
