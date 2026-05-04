import fs from 'fs/promises';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult, getReadPosition, setReadPosition, clearReadPosition, getMaxOutputLength } from './utils';
import { resolveAndValidate } from './pathSafety';
import { ToolExecutor } from '../executor';

export class ContinueReading implements Tool {
  name = 'continue_reading';
  description = '继续读取之前被截断的文件内容';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'from_position', type: 'number', required: false, description: '从哪个字符位置开始读取' },
    { name: 'length', type: 'number', required: false, description: '读取的字符长度' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, ToolExecutor.getAllowedCwd());
      let startPos = params.from_position;

      if (startPos === undefined) {
        startPos = getReadPosition(safePath) ?? getMaxOutputLength();
      }

      const content = await fs.readFile(safePath, 'utf-8');
      const length = params.length || getMaxOutputLength();

      if (startPos >= content.length) {
        return successResult('[EOF] 已到达文件末尾');
      }

      const endPos = Math.min(startPos + length, content.length);
      const result = content.slice(startPos, endPos);
      setReadPosition(safePath, endPos);

      const prefix = `[从位置 ${startPos} 读取，共 ${result.length} 字符]\n\n`;
      const remaining = content.length - endPos;

      let suffix = '';
      if (remaining > 0) {
        suffix = `\n\n[还有 ${remaining} 字符未读取，使用 continue_reading 继续]`;
      } else {
        clearReadPosition(safePath);
      }

      return {
        success: true,
        output: prefix + result + suffix,
        readPosition: endPos,
        artifacts: [safePath]
      };
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
