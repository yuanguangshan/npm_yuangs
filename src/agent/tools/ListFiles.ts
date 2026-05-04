import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class ListFiles implements Tool {
  name = 'list_files';
  description = '列出目录中的文件和子目录';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: false, description: '目录路径' },
    { name: 'recursive', type: 'boolean', required: false, description: '是否递归列出子目录' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const dirPath = params.path || '.';
    const recursive = params.recursive || false;

    try {
      const safeDir = await resolveAndValidate(dirPath, ToolExecutor.getAllowedCwd());
      const files = await this.getFiles(safeDir, recursive);
      return successResult(JSON.stringify(files, null, 2), files.map(f => f.path));
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }

  private async getFiles(dir: string, recursive: boolean): Promise<Array<{ path: string; type: string }>> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: Array<{ path: string; type: string }> = [];

    for (const entry of entries) {
      const fullPath = `${dir}/${entry.name}`;

      if (entry.isDirectory()) {
        files.push({ path: fullPath, type: 'directory' });
        if (recursive) {
          const subFiles = await this.getFiles(fullPath, recursive);
          files.push(...subFiles);
        }
      } else {
        files.push({ path: fullPath, type: 'file' });
      }
    }

    return files;
  }
}
