import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class AppendFile implements Tool {
  name = 'append_file';
  description = '向文件末尾追加内容';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'content', type: 'string', required: true, description: '要追加的内容' },
    { name: 'encoding', type: 'string', required: false, description: '文件编码' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.appendFile(safePath, params.content, params.encoding || 'utf-8');
      return successResult(`Successfully appended to ${safePath}`, [safePath]);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
