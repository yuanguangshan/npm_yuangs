import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

const execAsync = promisify(exec);

export class SearchInFiles implements Tool {
  name = 'search_in_files';
  description = '在文件中搜索指定内容（类似 grep）';
  parameters: ToolParameter[] = [
    { name: 'pattern', type: 'string', required: true, description: '搜索模式/关键词' },
    { name: 'path', type: 'string', required: false, description: '搜索路径' },
    { name: 'file_pattern', type: 'string', required: false, description: '文件名模式' },
    { name: 'ignore_case', type: 'boolean', required: false, description: '是否忽略大小写' },
    { name: 'context_lines', type: 'number', required: false, description: '上下文行数' },
    { name: 'max_results', type: 'number', required: false, description: '最大结果数' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const pattern = params.pattern;
    const searchPath = params.path || '.';
    const filePattern = params.file_pattern;
    const ignoreCase = params.ignore_case || false;
    const contextLines = params.context_lines || 0;
    const maxResults = params.max_results || 100;

    try {
      const safePath = await resolveAndValidate(searchPath, ToolExecutor.getAllowedCwd());
      let baseCmd = 'grep';
      if (ignoreCase) baseCmd += ' -i';
      baseCmd += ' -r';
      if (contextLines > 0) baseCmd += ` -C ${contextLines}`;
      baseCmd += ` -n`;

      const escapedPattern = pattern.replace(/'/g, "'\\''");

      let grepCmd: string;
      if (filePattern) {
        grepCmd = `find ${safePath} -type f -name '${filePattern}' -exec grep ${ignoreCase ? '-i' : ''} -n -- '${escapedPattern}' {} + 2>/dev/null | head -n ${maxResults}`;
      } else {
        grepCmd = `${baseCmd} -- '${escapedPattern}' ${safePath} 2>/dev/null | head -n ${maxResults}`;
      }

      const { stdout } = await execAsync(grepCmd, {
        maxBuffer: 50 * 1024 * 1024,
        cwd: process.cwd(),
        shell: '/bin/bash'
      });

      const output = String(stdout).trim();
      const lines = output.split('\n').filter(line => line.trim());
      const hasMore = lines.length >= maxResults;

      const resultOutput = lines.length > 0
        ? lines.join('\n') + (hasMore ? `\n\n[⚠️] 结果已限制为前 ${maxResults} 条匹配，使用更大的 max_results 参数获取更多结果` : '')
        : '未找到匹配结果';

      return successResult(resultOutput);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      if (error.code === 1) {
        return successResult('未找到匹配结果');
      }
      return failResult(error.message);
    }
  }
}
