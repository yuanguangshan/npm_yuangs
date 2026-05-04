import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

const execAsync = promisify(exec);

export class SearchSymbol implements Tool {
  name = 'search_symbol';
  description = '搜索代码符号（函数、类、变量等）';
  parameters: ToolParameter[] = [
    { name: 'symbol', type: 'string', required: true, description: '符号名称' },
    { name: 'symbol_type', type: 'string', required: false, description: '符号类型（function/class/interface）' },
    { name: 'path', type: 'string', required: false, description: '搜索路径' },
    { name: 'file_pattern', type: 'string', required: false, description: '文件名模式' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const symbol = params.symbol;
    const symbolType = params.symbol_type;
    const searchPath = params.path || '.';
    const filePattern = params.file_pattern;

    try {
      const safePath = await resolveAndValidate(searchPath, ToolExecutor.getAllowedCwd());
      let pattern = symbol;
      switch (symbolType) {
        case 'function':
          pattern = `function\\s+${symbol}|${symbol}\\s*[:=]\\s*function|const\\s+${symbol}\\s*=`;
          break;
        case 'class':
          pattern = `class\\s+${symbol}`;
          break;
        case 'interface':
          pattern = `interface\\s+${symbol}`;
          break;
      }

      let grepCmd = `grep -rn --color=never -E "${pattern}" ${safePath}`;
      if (filePattern) grepCmd += ` --include="${filePattern}"`;

      const { stdout } = await execAsync(grepCmd, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      if (!stdout.trim()) {
        return successResult(`未找到符号 "${symbol}"`);
      }

      return successResult(stdout);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      if (error.code === 1) {
        return successResult(`未找到符号 "${symbol}"`);
      }
      return failResult(error.message);
    }
  }
}
