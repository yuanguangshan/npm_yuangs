import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { persistToolResult, formatFileSize } from '../toolResultStorage';

const execAsync = promisify(exec);

export class ShellCmd implements Tool {
  name = 'shell_cmd';
  description = '执行 shell 命令';
  parameters: ToolParameter[] = [
    { name: 'command', type: 'string', required: true, description: '要执行的命令' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const command = params.command;

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      let output = stdout || stderr || '';

      const baseCmd = command.split(/\s+/)[0];
      const persisted = await persistToolResult(output, baseCmd);
      if (persisted) {
        output = `${persisted.preview}\n\n[⚠️ 输出已截断，完整结果已保存到 ${persisted.filepath}（${formatFileSize(persisted.originalSize)}）]`;
      }

      return successResult(output, persisted ? [persisted.filepath] : []);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }
}
