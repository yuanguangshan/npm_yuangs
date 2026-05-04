import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';

const execAsync = promisify(exec);

export class CodeDiff implements Tool {
  name = 'code_diff';
  description = '应用代码差异补丁';
  parameters: ToolParameter[] = [
    { name: 'diff', type: 'string', required: true, description: 'Git diff/patch 内容' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const tempFile = path.join(process.cwd(), '.yuangs_temp.patch');
      await fs.writeFile(tempFile, params.diff, 'utf-8');

      await execAsync(`git apply --check ${tempFile}`, { cwd: process.cwd() });
      const { stdout: applyOutput } = await execAsync(`git apply ${tempFile}`, {
        cwd: process.cwd()
      });

      await fs.unlink(tempFile);

      return successResult(applyOutput || 'Diff applied successfully', ['.yuangs_temp.patch']);
    } catch (error: any) {
      return failResult(error.message, error.stdout || error.stderr || 'Failed to apply diff');
    }
  }
}
