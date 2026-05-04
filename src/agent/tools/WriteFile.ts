import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class WriteFile implements Tool {
  name = 'write_file';
  description = '写入文件内容（覆盖或创建）';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'content', type: 'string', required: true, description: '文件内容' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, params.content, 'utf-8');
      return successResult(`Successfully wrote ${safePath}`, [safePath]);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
