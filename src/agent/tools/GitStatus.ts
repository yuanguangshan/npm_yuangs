import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';

const execAsync = promisify(exec);

export class GitStatus implements Tool {
  name = 'git_status';
  description = '查看 Git 仓库当前状态';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: false, description: '仓库路径' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const repoPath = params.path || '.';

    try {
      const { stdout: porcelain } = await execAsync(`git -C ${repoPath} status --porcelain -b`, {
        cwd: process.cwd()
      });
      const { stdout: branchInfo } = await execAsync(`git -C ${repoPath} branch --show-current`, {
        cwd: process.cwd()
      });

      let output = `当前分支: ${branchInfo.trim()}\n\n`;
      if (!porcelain.trim()) {
        output += '工作区干净，没有未提交的更改';
      } else {
        output += '未提交的更改:\n' + porcelain;
      }

      return successResult(output);
    } catch (error: any) {
      return failResult(error.message, '不是 Git 仓库或 Git 命令执行失败');
    }
  }
}
