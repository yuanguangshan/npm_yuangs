import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult, getFriendlyError } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class ReadFile implements Tool {
  name = 'read_file';
  description = '读取文件的完整内容';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      const content = await fs.readFile(safePath, 'utf-8');
      return successResult(content, [safePath]);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      const friendly = getFriendlyError(this.name, error);
      return { success: false, error: friendly.message, output: friendly.suggestion };
    }
  }
}
