import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';

const execAsync = promisify(exec);

export class GitDiff implements Tool {
  name = 'git_diff';
  description = '查看 Git 差异';
  parameters: ToolParameter[] = [
    { name: 'file', type: 'string', required: false, description: '指定文件' },
    { name: 'cached', type: 'boolean', required: false, description: '是否查看已暂存的差异' },
    { name: 'lines', type: 'number', required: false, description: '限制显示行数' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      let cmd = 'git diff';
      if (params.cached) cmd += ' --cached';
      if (params.file) cmd += ` -- ${params.file}`;
      if (params.lines) cmd += ` | head -n ${params.lines}`;

      const { stdout } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      if (!stdout.trim()) {
        return successResult(params.file ? `文件 ${params.file} 没有更改` : '没有更改');
      }

      return successResult(stdout);
    } catch (error: any) {
      return failResult(error.message);
    }
  }
}
