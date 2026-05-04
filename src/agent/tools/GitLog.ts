import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';

const execAsync = promisify(exec);

export class GitLog implements Tool {
  name = 'git_log';
  description = '查看 Git 提交历史';
  parameters: ToolParameter[] = [
    { name: 'max_count', type: 'number', required: false, description: '最大显示条数' },
    { name: 'file', type: 'string', required: false, description: '指定文件的历史' },
    { name: 'oneline', type: 'boolean', required: false, description: '是否单行显示' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const maxCount = params.max_count || 10;
      const oneline = params.oneline !== false;

      let cmd = `git log -n ${maxCount}`;
      if (oneline) cmd += ' --oneline';
      if (params.file) cmd += ` -- ${params.file}`;

      const { stdout } = await execAsync(cmd, {
        cwd: process.cwd()
      });

      return successResult(stdout || '没有提交历史');
    } catch (error: any) {
      return failResult(error.message);
    }
  }
}
