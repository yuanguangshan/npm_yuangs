/**
 * 大结果存储系统
 *
 * 当工具输出超过阈值时，将结果写入临时文件，只返回预览。
 * 参考：cc/src/utils/toolResultStorage.ts
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const PREVIEW_SIZE_BYTES = 2000; // 预览大小（字符）
const MAX_RESULT_BYTES = 100_000; // 最大结果大小（100KB）
const TOOL_RESULTS_DIR = '.yuangs-tool-results';

export interface PersistedToolResult {
  filepath: string;
  originalSize: number;
  isJson: boolean;
  preview: string;
  hasMore: boolean;
}

/**
 * 获取 session 级别的临时存储目录
 */
function getToolResultsDir(): string {
  const sessionId = process.pid;
  const dir = path.join(os.tmpdir(), TOOL_RESULTS_DIR, `session-${sessionId}`);
  return dir;
}

/**
 * 确保存储目录存在
 */
async function ensureDir(): Promise<string> {
  const dir = getToolResultsDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * 尝试将工具结果持久化到磁盘文件
 * @param output 工具输出内容
 * @param toolName 工具名称
 * @returns 持久化结果信息，如果输出不大则返回 null
 */
export async function persistToolResult(
  output: string,
  toolName: string
): Promise<PersistedToolResult | null> {
  // 如果输出不大，不需要持久化
  if (output.length <= PREVIEW_SIZE_BYTES) return null;

  // 限制最大大小
  const truncated = output.length > MAX_RESULT_BYTES
    ? output.slice(0, MAX_RESULT_BYTES)
    : output;

  const isJson = trimmedStartsWith(output, '{') || trimmedStartsWith(output, '[');
  const preview = truncated.slice(0, PREVIEW_SIZE_BYTES);
  const hasMore = output.length > MAX_RESULT_BYTES;

  try {
    const dir = await ensureDir();
    const timestamp = Date.now();
    const filename = `${toolName}-${timestamp}.txt`;
    const filepath = path.join(dir, filename);

    await fs.writeFile(filepath, truncated, 'utf-8');

    return {
      filepath,
      originalSize: truncated.length,
      isJson,
      preview,
      hasMore,
    };
  } catch {
    // 持久化失败，返回 null 让调用者使用原始输出
    return null;
  }
}

/**
 * 从磁盘读取持久化的工具结果
 */
export async function readPersistedResult(filepath: string): Promise<string | null> {
  try {
    return await fs.readFile(filepath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * 清理过期的工具结果文件
 */
export async function cleanupOldResults(maxAgeMs: number = 3600_000): Promise<void> {
  try {
    const dir = getToolResultsDir();
    const files = await fs.readdir(dir);
    const now = Date.now();

    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = await fs.stat(filepath);
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(filepath);
      }
    }
  } catch {
    // 清理失败不影响主流程
  }
}

/**
 * 检查字符串是否以某个字符开头（忽略前导空白）
 */
function trimmedStartsWith(str: string, char: string): boolean {
  const trimmed = str.trimStart();
  return trimmed.startsWith(char);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
