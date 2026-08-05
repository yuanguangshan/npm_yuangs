/**
 * AppendFile（增强版）— 向文件末尾追加内容，带备份回滚。
 *
 * 原先直接 fs.appendFile 无备份，现在写入前备份。
 */

import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { getAllowedCwd } from '../workdir';
import { BackupManager } from './piAdapter';

export class AppendFile implements Tool {
  name = 'append_file';
  description = '向文件末尾追加内容（带备份回滚）';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'content', type: 'string', required: true, description: '要追加的内容' },
    { name: 'encoding', type: 'string', required: false, description: '文件编码' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, getAllowedCwd());

      // 备份原始文件
      await BackupManager.backup(safePath);

      try {
        await fs.mkdir(path.dirname(safePath), { recursive: true });
        await fs.appendFile(safePath, params.content, params.encoding || 'utf-8');

        // 写入成功，清除备份
        BackupManager.clearBackup(safePath);
        return successResult(`Successfully appended to ${safePath}`, [safePath]);
      } catch (writeErr: any) {
        // 写入失败，尝试回滚
        const rolledBack = await BackupManager.rollback(safePath);
        return failResult(`追加失败: ${writeErr.message}${rolledBack ? '（已回滚）' : ''}`);
      }
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
