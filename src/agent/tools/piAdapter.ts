/**
 * pi-agent 适配层 — 桥接 @earendil-works/pi-coding-agent (ESM) 到 yuangs (CJS) 的 Tool 接口。
 *
 * pi-coding-agent 是 ESM-only，yuangs 是 CommonJS。在 Node 22+ 中使用动态 import() 加载。
 * 本模块提供：
 *  - pi 工具的懒加载单例（write/edit/grep/find/ls/read/bash）
 *  - AgentTool → yuangs Tool 的适配器
 *  - diff 生成工具（generateDiffString / generateUnifiedPatch）
 *  - 文件变更队列（withFileMutationQueue）
 *  - 备份/回滚管理器
 */

import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { Tool, ToolParameter } from './types';
import { ToolExecutionResult } from '../state';
import { failResult, successResult } from './utils';
import { resolveAndValidate } from './pathSafety';
import chalk from 'chalk';
import { confirm } from '../../utils/confirm';

// ─── pi SDK 类型（松散，避免 ESM 类型在 CJS 上下文中报错） ───

interface PiAgentTool {
  label: string;
  execute(
    toolCallId: string,
    params: Record<string, any>,
    signal?: AbortSignal,
    onUpdate?: (partialResult: any) => void
  ): Promise<{ content: Array<{ type: string; text?: string }>; details: any }>;
}

interface PiToolModule {
  createWriteTool: (cwd: string, options?: any) => PiAgentTool;
  createEditTool: (cwd: string, options?: any) => PiAgentTool;
  createGrepTool: (cwd: string, options?: any) => PiAgentTool;
  createFindTool: (cwd: string, options?: any) => PiAgentTool;
  createLsTool: (cwd: string, options?: any) => PiAgentTool;
  createReadTool: (cwd: string, options?: any) => PiAgentTool;
  createBashTool: (cwd: string, options?: any) => PiAgentTool;
  createAllTools?: (cwd: string, options?: any) => Record<string, PiAgentTool>;
}

interface PiEditDiffModule {
  generateDiffString: (
    oldContent: string,
    newContent: string,
    contextLines?: number
  ) => { diff: string; firstChangedLine: number | undefined };
  generateUnifiedPatch: (
    filePath: string,
    oldContent: string,
    newContent: string,
    contextLines?: number
  ) => string;
}

interface PiFileMutationModule {
  withFileMutationQueue: <T>(filePath: string, fn: () => Promise<T>) => Promise<T>;
}

// ─── 懒加载单例 ───

let _toolsModule: PiToolModule | null = null;
let _editDiffModule: PiEditDiffModule | null = null;
let _fileMutationModule: PiFileMutationModule | null = null;
let _loadError: string | null = null;

/**
 * 动态导入 pi-coding-agent 的工具模块（ESM → CJS 桥接）。
 * Node 22+ 原生支持 require(ESM)，但动态 import() 更通用。
 */
// Native import() that bypasses TypeScript CJS transformation (require → import)
const nativeImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

async function loadPiModules(): Promise<void> {
  if (_toolsModule) return;
  if (_loadError) throw new Error(`pi-coding-agent 加载失败: ${_loadError}`);

  try {
    // pi-coding-agent 的入口直接导出了工具工厂函数
    // 使用 nativeImport 绕过 CJS require() 转换，保持原生 ESM import()
    const mod = await nativeImport<Record<string, any>>('@earendil-works/pi-coding-agent');

    _toolsModule = {
      createWriteTool: mod.createWriteTool,
      createEditTool: mod.createEditTool,
      createGrepTool: mod.createGrepTool,
      createFindTool: mod.createFindTool,
      createLsTool: mod.createLsTool,
      createReadTool: mod.createReadTool,
      createBashTool: mod.createBashTool,
      createAllTools: (mod as any).createAllTools,
    };

    // edit-diff 工具（从顶层导出）
    if (mod.generateDiffString) {
      _editDiffModule = {
        generateDiffString: mod.generateDiffString,
        generateUnifiedPatch: mod.generateUnifiedPatch,
      };
    } else {
      _editDiffModule = null;
    }

    // file-mutation-queue（从顶层导出）
    if (mod.withFileMutationQueue) {
      _fileMutationModule = { withFileMutationQueue: mod.withFileMutationQueue };
    } else {
      _fileMutationModule = null;
    }
  } catch (err: any) {
    _loadError = err.message || String(err);
    // 显式警告：增强功能不可用
    console.log(chalk.yellow(
      `\n⚠️  pi-coding-agent 增强功能不可用: ${_loadError}\n` +
      `    原因可能是: 未安装 @earendil-works/pi-coding-agent, 或 Node 版本 < 22.19\n` +
      `    工具将回退到基础模式 (无 diff 预览/ripgrep/备份回滚)\n`
    ));
    throw new Error(`pi-coding-agent 加载失败: ${_loadError}`);
  }
}

/**
 * 获取 pi 工具模块（确保已加载）。
 */
export async function getPiTools(): Promise<PiToolModule> {
  await loadPiModules();
  return _toolsModule!;
}

/**
 * 检查 pi-coding-agent 增强功能是否可用。
 * 不会触发加载——仅检查当前状态。
 */
export function isPiAvailable(): boolean {
  return _toolsModule !== null && _loadError === null;
}

/**
 * 获取 pi 不可用时的降级提示信息。
 */
export function getPiDegradedMessage(): string {
  return _loadError
    ? `⚠️ pi 增强功能不可用 (${_loadError})，使用基础模式`
    : '';
}

/**
 * 获取 diff 生成工具。
 */
export async function getPiEditDiff(): Promise<PiEditDiffModule> {
  await loadPiModules();
  return _editDiffModule!;
}

/**
 * 获取文件变更队列。
 */
export async function getPiFileMutation(): Promise<PiFileMutationModule> {
  await loadPiModules();
  return _fileMutationModule!;
}

// ─── AgentTool → yuangs Tool 适配器 ───

/**
 * 将 pi 的 AgentTool 包装为 yuangs 的 Tool 接口。
 *
 * pi AgentTool.execute(toolCallId, params) → { content: [{type, text}], details }
 * yuangs Tool.execute(params) → ToolExecutionResult { success, output, error?, artifacts? }
 */
export function adaptPiTool(
  piTool: PiAgentTool,
  toolName: string,
  description: string,
  parameters: ToolParameter[]
): Tool {
  return {
    name: toolName,
    description,
    parameters,
    async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
      try {
        const result = await piTool.execute(
          `yuangs-${toolName}-${Date.now()}`,
          params
        );

        // 从 content 数组中提取文本
        const textParts: string[] = [];
        for (const part of result.content) {
          if (part.type === 'text' && part.text) {
            textParts.push(part.text);
          }
        }
        const output = textParts.join('\n');

        return successResult(output);
      } catch (error: any) {
        return failResult(error.message || String(error));
      }
    },
  };
}

// ─── 备份/回滚管理器 ───

/**
 * 文件备份管理器 — 在写入前创建备份，支持回滚。
 *
 * 解决 yuangs 原先的问题：
 *  - 只防「执行失败」不防「改错内容」
 *  - 新建文件无备份
 *  - 无用户回滚命令
 */
export class BackupManager {
  private static backupDir: string = path.join(os.tmpdir(), 'yuangs-backups');
  private static backups: Map<string, { original: string; backup: string; timestamp: number }> = new Map();

  /**
   * 在修改文件前创建备份。
   * 如果文件不存在（新建文件），记录 null 标记，回滚时删除文件。
   */
  static async backup(filePath: string): Promise<void> {
    const timestamp = Date.now();
    const backupName = `${path.basename(filePath)}.${timestamp}.bak`;
    const backupPath = path.join(this.backupDir, backupName);

    await fs.mkdir(this.backupDir, { recursive: true });

    let original: string;
    try {
      original = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, original, 'utf-8');
    } catch {
      // 文件不存在（新建文件）— 记录空标记
      original = '__NEW_FILE__';
    }

    this.backups.set(filePath, { original, backup: backupPath, timestamp });
  }

  /**
   * 回滚文件到最近一次备份。
   */
  static async rollback(filePath: string): Promise<boolean> {
    const entry = this.backups.get(filePath);
    if (!entry) return false;

    try {
      if (entry.original === '__NEW_FILE__') {
        // 新建文件 → 删除
        await fs.unlink(filePath).catch(() => {});
      } else {
        // 覆盖文件 → 恢复原始内容
        await fs.writeFile(filePath, entry.original, 'utf-8');
      }
      this.backups.delete(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 回滚所有已备份的文件。
   */
  static async rollbackAll(): Promise<string[]> {
    const rolled: string[] = [];
    for (const [filePath] of this.backups) {
      if (await this.rollback(filePath)) {
        rolled.push(filePath);
      }
    }
    return rolled;
  }

  /**
   * 获取已备份文件列表。
   */
  static getBackedUpFiles(): string[] {
    return Array.from(this.backups.keys());
  }

  /**
   * 清除指定文件的备份记录（写入成功后调用）。
   */
  static clearBackup(filePath: string): void {
    this.backups.delete(filePath);
  }
}

// ─── diff 预览与确认 ───

/**
 * 生成 diff 预览并显示给用户，请求确认。
 *
 * 这是 yuangs 原先完全缺失的功能：WriteFile 全量覆盖零校验零审批。
 */
export async function previewDiffAndConfirm(
  filePath: string,
  oldContent: string,
  newContent: string
): Promise<{ approved: boolean; diff: string }> {
  let diff = '';
  try {
    const editDiff = await getPiEditDiff();
    const result = editDiff.generateDiffString(oldContent, newContent, 5);
    diff = result.diff;
  } catch {
    // 如果 diff 生成失败，用简单对比
    diff = `--- ${filePath} (original)\n+++ ${filePath} (new)\n${newContent.slice(0, 500)}...`;
  }

  // 显示 diff 预览
  console.log(chalk.cyan('\n📝 文件变更预览 (diff):'));
  console.log(chalk.gray('─'.repeat(60)));

  // 彩色 diff 输出
  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      console.log(chalk.green(line));
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      console.log(chalk.red(line));
    } else if (line.startsWith('@@')) {
      console.log(chalk.blue(line));
    } else {
      console.log(chalk.gray(line));
    }
  }
  console.log(chalk.gray('─'.repeat(60)));

  // 统计变更
  const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  console.log(chalk.yellow(`📊 变更统计: +${added} 行 / -${removed} 行`));

  const approved = await confirm(`确认写入 ${path.basename(filePath)}?`);
  return { approved, diff };
}
