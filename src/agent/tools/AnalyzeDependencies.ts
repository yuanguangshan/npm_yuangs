import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class AnalyzeDependencies implements Tool {
  name = 'analyze_dependencies';
  description = '分析文件的依赖关系（import/require）';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件或目录路径' },
    { name: 'recursive', type: 'boolean', required: false, description: '是否递归分析目录' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const targetPath = params.path;

    try {
      const safePath = await resolveAndValidate(targetPath, ToolExecutor.getAllowedCwd());
      const stat = await fs.stat(safePath);
      let files: string[] = [];

      if (stat.isFile()) {
        files = [safePath];
      } else if (stat.isDirectory()) {
        const allFiles = await this.getFiles(safePath, true);
        files = allFiles
          .filter(f => f.type === 'file')
          .filter(f => /\.(ts|js|tsx|jsx|vue|svelte)$/.test(f.path))
          .map(f => f.path);
      }

      const dependencies: Record<string, string[]> = {};

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const deps: string[] = [];

        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          deps.push(match[1]);
        }

        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
          deps.push(match[1]);
        }

        const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
          deps.push(match[1]);
        }

        if (deps.length > 0) {
          dependencies[file] = [...new Set(deps)];
        }
      }

      let output = '依赖关系分析结果：\n\n';
      for (const [file, deps] of Object.entries(dependencies)) {
        output += `${file}:\n`;
        for (const dep of deps) output += `  - ${dep}\n`;
        output += '\n';
      }

      return successResult(output || '未找到依赖关系');
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
          const sub = await this.getFiles(fullPath, recursive);
          files.push(...sub);
        }
      } else {
        files.push({ path: fullPath, type: 'file' });
      }
    }

    return files;
  }
}
