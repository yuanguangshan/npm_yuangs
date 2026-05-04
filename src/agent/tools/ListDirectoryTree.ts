import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class ListDirectoryTree implements Tool {
  name = 'list_directory_tree';
  description = '生成目录结构的树形展示';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: false, description: '目录路径' },
    { name: 'max_depth', type: 'number', required: false, description: '最大深度' },
    { name: 'include_files', type: 'boolean', required: false, description: '是否包含文件' },
    { name: 'exclude_patterns', type: 'array', required: false, description: '排除的模式列表' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const dirPath = params.path || '.';
    const maxDepth = params.max_depth || 3;
    const includeFiles = params.include_files !== false;
    const excludePatterns = params.exclude_patterns || ['node_modules', '.git', 'dist', 'build'];

    try {
      const safeDir = await resolveAndValidate(dirPath, ToolExecutor.getAllowedCwd());
      const tree = await this.buildTree(safeDir, maxDepth, includeFiles, excludePatterns, 0);
      return successResult(tree);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }

  private async buildTree(
    dirPath: string,
    maxDepth: number,
    includeFiles: boolean,
    excludePatterns: string[],
    currentDepth: number
  ): Promise<string> {
    if (currentDepth >= maxDepth) return '';

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const lines: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (excludePatterns.some(pattern => entry.name.includes(pattern))) continue;

      const prefix = currentDepth === 0 ? '' : '│   '.repeat(currentDepth);
      const connector = i === entries.length - 1 ? '└── ' : '├── ';

      if (entry.isDirectory()) {
        lines.push(`${prefix}${connector}${entry.name}/`);
        const subTree = await this.buildTree(
          path.join(dirPath, entry.name),
          maxDepth, includeFiles, excludePatterns, currentDepth + 1
        );
        if (subTree) lines.push(subTree);
      } else if (includeFiles) {
        lines.push(`${prefix}${connector}${entry.name}`);
      }
    }

    return lines.join('\n');
  }
}
