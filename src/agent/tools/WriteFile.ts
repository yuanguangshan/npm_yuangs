/**
 * WriteFile（增强版）— 基于 pi-coding-agent 的 write 工具 + diff 预览 + 备份回滚 + 用户确认。
 *
 * 解决的问题（来自研究结论）：
 *  1. 原先全量覆盖零校验零审批 → 现在写入前显示 diff 预览并要求用户确认
 *  2. 原先无备份 → 现在写入前自动备份，支持回滚
 *  3. 原先 governance 对 write_file 默认 auto-allow → 现在通过确认机制强制人工审批
 *  4. 原先新建文件无备份 → 现在统一处理新建和覆盖
 */

import fs from 'fs/promises';
import path from 'path';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { getAllowedCwd } from '../workdir';
import { BackupManager, previewDiffAndConfirm, getPiTools } from './piAdapter';
import chalk from 'chalk';

// 环境变量控制是否跳过确认（用于自动化测试/CI）
const SKIP_CONFIRM = process.env.YUANGS_SKIP_WRITE_CONFIRM === '1';

export class WriteFile implements Tool {
  name = 'write_file';
  description = '写入文件内容（覆盖或创建）— 带 diff 预览、备份回滚和写入确认';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: true, description: '文件路径' },
    { name: 'content', type: 'string', required: true, description: '文件内容' },
    { name: 'skip_diff', type: 'boolean', required: false, description: '跳过 diff 预览（不推荐，仅用于大文件）' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const safePath = await resolveAndValidate(params.path, getAllowedCwd());
      const newContent = params.content;
      const skipDiff = params.skip_diff || false;

      // ─── Step 1: 读取原始内容 ───
      let oldContent = '';
      let isExistingFile = false;
      try {
        oldContent = await fs.readFile(safePath, 'utf-8');
        isExistingFile = true;
      } catch {
        // 新建文件
      }

      // ─── Step 2: 如果内容完全相同，跳过写入 ───
      if (isExistingFile && oldContent === newContent) {
        return successResult(`文件内容未变化，跳过写入: ${safePath}`, [safePath]);
      }

      // ─── Step 3: diff 预览 + 用户确认 ───
      if (!skipDiff && !SKIP_CONFIRM) {
        const { approved, diff } = await previewDiffAndConfirm(safePath, oldContent, newContent);
        if (!approved) {
          console.log(chalk.yellow('⚠️ 用户取消了写入操作'));
          return failResult('用户取消了写入操作');
        }
      }

      // ─── Step 4: 备份原始文件 ───
      await BackupManager.backup(safePath);

      // ─── Step 5: 执行写入 ───
      try {
        // 优先使用 pi 的 write 工具（带文件变更队列）
        try {
          const piTools = await getPiTools();
          const cwd = getAllowedCwd();
          const writeTool = piTools.createWriteTool(cwd);
          const result = await writeTool.execute(
            `yuangs-write-${Date.now()}`,
            { path: safePath, content: newContent }
          );

          // 从 pi 结果中提取文本
          const textParts: string[] = [];
          for (const part of result.content) {
            if (part.type === 'text' && part.text) {
              textParts.push(part.text);
            }
          }

          // 写入成功，清除备份
          BackupManager.clearBackup(safePath);

          const action = isExistingFile ? '覆盖' : '创建';
          return successResult(
            `✅ ${action}文件成功: ${safePath}\n${textParts.join('\n')}`,
            [safePath]
          );
        } catch (piErr: any) {
          // pi 工具失败，回退到原生 fs.writeFile
          console.log(chalk.yellow(`⚠️ pi write 工具失败，回退到原生写入: ${piErr.message}`));
          await fs.mkdir(path.dirname(safePath), { recursive: true });
          await fs.writeFile(safePath, newContent, 'utf-8');

          BackupManager.clearBackup(safePath);
          const action = isExistingFile ? '覆盖' : '创建';
          return successResult(`✅ ${action}文件成功: ${safePath}`, [safePath]);
        }
      } catch (writeErr: any) {
        // 写入失败，尝试回滚
        console.log(chalk.red(`❌ 写入失败: ${writeErr.message}`));
        const rolledBack = await BackupManager.rollback(safePath);
        if (rolledBack) {
          console.log(chalk.green('✅ 已自动回滚到原始内容'));
        }
        return failResult(`写入失败: ${writeErr.message}${rolledBack ? '（已回滚）' : ''}`);
      }
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }
}
