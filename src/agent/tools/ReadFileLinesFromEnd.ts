import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class ReadFileLinesFromEnd implements Tool {
  name = 'read_file_lines_from_end';
  description = '从文件末尾读取指定行数（倒数行）';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'count', type: 'number', required: false, description: '要读取的行数' },
    { name: 'start_offset', type: 'number', required: false, description: '从倒数第几行开始（0表示从最后一行开始）' },
    { name: 'encoding', type: 'string', required: false, description: '文件编码' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      const content = await fs.readFile(safePath, params.encoding || 'utf-8');
      const lines = String(content).split('\n');
      const totalLines = lines.length;

      const count = params.count || 10;
      const startOffset = params.start_offset || 0;
      const startIndex = Math.max(0, totalLines - count - startOffset);
      const endIndex = totalLines;

      if (totalLines === 0) {
        return successResult('(空文件)', [safePath]);
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
