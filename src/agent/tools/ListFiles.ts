/**
 * ListFiles（增强版）— 基于 pi-coding-agent 的 ls 工具。
 *
 * 解决的问题：
 *  1. 原先列出所有文件包括 node_modules → 输出爆炸、上下文窗口浪费
 *  2. 原先无排除机制 → .git 内部文件也会列出
 *  3. 原先无递归深度控制
 *
 * pi 的 ls 工具自动尊重 .gitignore，并默认排除 node_modules/.git。
 */

import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { getAllowedCwd } from '../workdir';
import { getPiTools } from './piAdapter';
import chalk from 'chalk';

// 默认排除的目录
const DEFAULT_EXCLUDE = ['node_modules', '.git', 'dist', '.next', '.cache', 'coverage'];

export class ListFiles implements Tool {
  name = 'list_files';
  description = '列出目录内容（自动排除 node_modules/.git/dist 等目录，支持递归深度）';
  parameters: ToolParameter[] = [
    { name: 'path', type: 'string', required: false, description: '目录路径（默认当前工作目录）' },
    { name: 'recursive', type: 'boolean', required: false, description: '是否递归列出子目录' },
    { name: 'depth', type: 'number', required: false, description: '递归深度（默认 1）' },
    { name: 'show_hidden', type: 'boolean', required: false, description: '显示隐藏文件（默认 false）' },
    { name: 'exclude', type: 'array', required: false, description: '额外排除的目录/文件模式' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const cwd = getAllowedCwd();
      const targetPath = params.path
        ? await resolveAndValidate(params.path, cwd)
        : cwd;

      // 使用 pi 的 ls 工具
      try {
        const piTools = await getPiTools();
        const lsTool = piTools.createLsTool(cwd);
        const result = await lsTool.execute(
          `yuangs-ls-${Date.now()}`,
          { path: targetPath }
        );

        // 提取文本输出
        const textParts: string[] = [];
        for (const part of result.content) {
          if (part.type === 'text' && part.text) {
            textParts.push(part.text);
          }
        }
        let output = textParts.join('\n');

        // pi ls 可能不排除 node_modules，手动过滤
        if (output) {
          output = this.filterOutput(output, params);
        }

        if (!output || output.trim() === '') {
          return successResult(`目录为空或所有内容被排除: ${targetPath}`);
        }

        return successResult(output);
      } catch (piErr: any) {
        // pi ls 工具失败，回退到原生 fs.readdir
        console.log(chalk.yellow(`⚠️ pi ls 工具失败，回退到原生列出: ${piErr.message}`));
        return await this.fallbackList(targetPath, params);
      }
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }

  /**
   * 过滤输出，排除 node_modules/.git 等。
   */
  private filterOutput(output: string, params: Record<string, any>): string {
    const excludePatterns = [...DEFAULT_EXCLUDE];
    if (params.exclude && Array.isArray(params.exclude)) {
      excludePatterns.push(...params.exclude);
    }

    const lines = output.split('\n');
    const filtered = lines.filter(line => {
      for (const pattern of excludePatterns) {
        if (line.includes(pattern)) return false;
      }
      // 隐藏文件过滤
      if (!params.show_hidden) {
        const basename = line.trim().split('/').pop() || '';
        if (basename.startsWith('.') && basename !== '.' && basename !== '..') {
          return false;
        }
      }
      return true;
    });

    return filtered.join('\n');
  }

  /**
   * 回退列出 — 当 pi ls 工具不可用时使用原生 fs.readdir。
   * 排除 node_modules 和 .git 目录。
   */
  private async fallbackList(
    targetPath: string,
    params: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const recursive = params.recursive || false;
    const maxDepth = params.depth || 1;
    const showHidden = params.show_hidden || false;

    const excludePatterns = [...DEFAULT_EXCLUDE];
    if (params.exclude && Array.isArray(params.exclude)) {
      excludePatterns.push(...params.exclude);
    }

    const results: string[] = [];

    const listDir = async (dirPath: string, depth: number, prefix: string): Promise<void> => {
      if (depth > maxDepth) return;

      let entries: import('fs').Dirent[];
      try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
      } catch {
        return;
      }

      // 排序：目录在前，文件在后，字母序
      entries.sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
          return a.isDirectory() ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        // 排除 node_modules/.git 等
        if (excludePatterns.includes(entry.name)) continue;

        // 隐藏文件过滤
        if (!showHidden && entry.name.startsWith('.')) continue;

        const isDir = entry.isDirectory();
        const displayName = isDir ? `${entry.name}/` : entry.name;
        results.push(`${prefix}${displayName}`);

        if (isDir && recursive && depth < maxDepth) {
          await listDir(path.join(dirPath, entry.name), depth + 1, `${prefix}  `);
        }
      }
    };

    let stat;
    try {
      stat = await fs.stat(targetPath);
    } catch {
      return failResult(`路径不存在: ${targetPath}`);
    }

    if (stat.isDirectory()) {
      results.push(`${targetPath}/`);
      await listDir(targetPath, 1, '  ');
    } else {
      results.push(targetPath);
    }

    return successResult(results.join('\n'));
  }
}
