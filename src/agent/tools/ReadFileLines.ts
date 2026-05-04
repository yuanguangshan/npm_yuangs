import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class ReadFileLines implements Tool {
  name = 'read_file_lines';
  description = '读取文件的指定行范围';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'start_line', type: 'number', required: false, description: '起始行号（从1开始）' },
    { name: 'end_line', type: 'number', required: false, description: '结束行号（包含）' },
    { name: 'encoding', type: 'string', required: false, description: '文件编码' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      const content = await fs.readFile(safePath, params.encoding || 'utf-8');
      const lines = String(content).split('\n');

      const startIndex = Math.max(0, (params.start_line || 1) - 1);
      const endIndex = params.end_line ? Math.min(lines.length, params.end_line) : lines.length;

      if (startIndex >= lines.length) {
        return failResult(`起始行号 ${params.start_line || 1} 超出文件范围（文件共 ${lines.length} 行）`);
      }

      const selectedLines = lines.slice(startIndex, endIndex);
      const result = selectedLines
        .map((line: string, idx: number) => `${startIndex + idx + 1}: ${line}`)
        .join('\n');

      return successResult(result, [safePath]);
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
