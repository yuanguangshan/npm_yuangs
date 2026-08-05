/**
 * SearchInFiles（增强版）— 基于 pi-coding-agent 的 grep 工具（ripgrep 内置）。
 *
 * 解决的问题：
 *  1. 原先用 child_process 调用系统 grep → 依赖外部工具、Windows 不兼容、无上下文行
 *  2. 原先无 glob 过滤 → 搜索结果噪声大
 *  3. 原先无 ignoreCase / literal / context 参数
 *  4. 原先无结果数量限制 → 大项目可能返回海量结果
 *
 * pi 的 grep 工具基于 ripgrep（Rust 实现），速度快、支持 .gitignore 自动排除。
 */

import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import { getAllowedCwd } from '../workdir';
import { getPiTools } from './piAdapter';
import chalk from 'chalk';

export class SearchInFiles implements Tool {
  name = 'search_in_files';
  description = '在文件内容中搜索匹配模式（基于 ripgrep，支持正则、glob 过滤、上下文行）';
  parameters: ToolParameter[] = [
    { name: 'pattern', type: 'string', required: true, description: '搜索模式（正则表达式）' },
    { name: 'path', type: 'string', required: false, description: '搜索路径（默认当前工作目录）' },
    { name: 'glob', type: 'string', required: false, description: '文件名 glob 过滤（如 *.ts）' },
    { name: 'ignore_case', type: 'boolean', required: false, description: '忽略大小写' },
    { name: 'literal', type: 'boolean', required: false, description: '字面量搜索（不作为正则）' },
    { name: 'context', type: 'number', required: false, description: '上下文行数（前后各 N 行）' },
    { name: 'limit', type: 'number', required: false, description: '最大结果数（默认 100）' }
  ];

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const cwd = getAllowedCwd();
      const searchPath = params.path
        ? await resolveAndValidate(params.path, cwd)
        : cwd;

      // 构建 pi grep 工具参数
      const grepParams: Record<string, any> = {
        pattern: params.pattern,
        path: searchPath,
      };

      if (params.glob) grepParams.glob = params.glob;
      if (params.ignore_case !== undefined) grepParams.ignoreCase = params.ignore_case;
      if (params.literal !== undefined) grepParams.literal = params.literal;
      if (params.context !== undefined) grepParams.context = params.context;
      if (params.limit !== undefined) grepParams.limit = params.limit;
      else grepParams.limit = 100; // 默认限制 100 条结果

      // 使用 pi 的 grep 工具（ripgrep）
      try {
        const piTools = await getPiTools();
        const grepTool = piTools.createGrepTool(cwd);
        const result = await grepTool.execute(
          `yuangs-grep-${Date.now()}`,
          grepParams
        );

        // 提取文本输出
        const textParts: string[] = [];
        for (const part of result.content) {
          if (part.type === 'text' && part.text) {
            textParts.push(part.text);
          }
        }
        const output = textParts.join('\n');

        if (!output || output.trim() === '') {
          return successResult(`未找到匹配: pattern="${params.pattern}" path=${searchPath}`);
        }

        return successResult(output);
      } catch (piErr: any) {
        // pi grep 工具失败，回退到简单正则搜索（显式提示降级）
        console.log(chalk.yellow(`⚠️ pi grep (ripgrep) 不可用，回退到内置正则搜索: ${piErr.message}`));
        const fbResult = await this.fallbackSearch(params.pattern, searchPath, params);
        if (fbResult.success) {
          return successResult(fbResult.output + '\n\n⚠️ (基础搜索模式, 无 ripgrep 加速)');
        }
        return fbResult;
      }
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return failResult(error.message);
      }
      return failResult(error.message);
    }
  }

  /**
   * 回退搜索 — 当 pi grep 工具不可用时使用简单的 Node.js 正则搜索。
   * 排除 node_modules 和 .git 目录。
   */
  private async fallbackSearch(
    pattern: string,
    searchPath: string,
    params: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const flags = params.ignore_case ? 'gi' : 'g';
    const regex = params.literal
      ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
      : new RegExp(pattern, flags);

    const limit = params.limit || 100;
    const contextLines = params.context || 0;
    const results: string[] = [];
    let count = 0;

    const searchDir = async (dirPath: string): Promise<void> => {
      if (count >= limit) return;

      let entries: string[];
      try {
        entries = await fs.readdir(dirPath);
      } catch {
        return;
      }

      for (const entry of entries) {
        if (count >= limit) return;

        // 排除 node_modules 和 .git
        if (entry === 'node_modules' || entry === '.git') continue;

        const fullPath = path.join(dirPath, entry);
        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          await searchDir(fullPath);
        } else if (stat.isFile()) {
          // glob 过滤（简单实现，避免 minimatch 类型依赖）
          if (params.glob) {
            const globPattern = params.glob.replace(/\*/g, '.*').replace(/\?/g, '.');
            const globRegex = new RegExp(`^${globPattern}$`);
            if (!globRegex.test(entry)) continue;
          }

          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (count >= limit) return;
              regex.lastIndex = 0;
              if (regex.test(lines[i])) {
                let result = `${fullPath}:${i + 1}:${lines[i]}`;
                if (contextLines > 0) {
                  const start = Math.max(0, i - contextLines);
                  const end = Math.min(lines.length - 1, i + contextLines);
                  const context = lines.slice(start, end + 1)
                    .map((l, idx) => `  ${start + idx + 1}: ${l}`)
                    .join('\n');
                  result = `${fullPath}:\n${context}`;
                }
                results.push(result);
                count++;
              }
            }
          } catch {
            // 跳过非文本文件
          }
        }
      }
    };

    let stat;
    try {
      stat = await fs.stat(searchPath);
    } catch {
      return failResult(`路径不存在: ${searchPath}`);
    }

    if (stat.isDirectory()) {
      await searchDir(searchPath);
    } else {
      const content = await fs.readFile(searchPath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (count >= limit) break;
        regex.lastIndex = 0;
        if (regex.test(lines[i])) {
          results.push(`${searchPath}:${i + 1}:${lines[i]}`);
          count++;
        }
      }
    }

    if (results.length === 0) {
      return successResult(`未找到匹配: pattern="${pattern}" path=${searchPath}`);
    }

    return successResult(results.join('\n'));
  }
}
