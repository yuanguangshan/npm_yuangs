import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult, formatBytes } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class FileInfo implements Tool {
  name = 'file_info';
  description = '获取文件的元信息（大小、权限、修改时间等）';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      const stat = await fs.stat(safePath);
      const info = {
        path: safePath,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        sizeHuman: formatBytes(stat.size),
        modified: stat.mtime.toISOString(),
        created: stat.birthtime.toISOString(),
        permissions: stat.mode.toString(8),
        isReadable: !!(stat.mode & parseInt('0400', 8)),
        isWritable: !!(stat.mode & parseInt('0200', 8))
      };

      return successResult(JSON.stringify(info, null, 2));
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
