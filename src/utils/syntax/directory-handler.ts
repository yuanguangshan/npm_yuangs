import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFilesContent } from '../../core/fileReader';
import { ContextBuffer } from '../../commands/contextBuffer';
import { loadContext, saveContext } from '../../commands/contextStorage';

const execAsync = promisify(exec);
const MAX_FILE_TOKENS = 10000;

/**
 * # 目录引用语法 — 读取目录下所有文件加入上下文
 */
export async function handleDirectoryReference(
  dirPath: string,
  question?: string,
): Promise<{
  processed: boolean;
  result: string;
  error?: boolean;
  itemCount?: number;
}> {
  const fullPath = path.resolve(dirPath);

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    return {
      processed: true,
      result: `错误: 目录 "${dirPath}" 不存在或不是一个目录`,
    };
  }

  try {
    const findCommand =
      process.platform === 'darwin' || process.platform === 'linux'
        ? `find "${fullPath}" -type f`
        : `dir /s /b "${fullPath}"`;

    const { stdout } = await execAsync(findCommand);
    const filePaths = stdout
      .trim()
      .split('\n')
      .filter((f) => f);

    if (filePaths.length === 0) {
      return {
        processed: true,
        result: `目录 "${dirPath}" 下没有文件`,
      };
    }

    const contentMap = await readFilesContent(filePaths, {
      showProgress: true,
      concurrency: 5,
    });

    const contextBuffer = new ContextBuffer();
    const persisted = await loadContext();
    contextBuffer.import(persisted);

    let successfullyAddedCount = 0;

    for (const [filePath, content] of contentMap) {
      const tokens = Math.ceil(content.length / 4);
      if (tokens > MAX_FILE_TOKENS) continue;

      contextBuffer.add({
        type: 'file',
        path: filePath,
        content: content,
      });
      successfullyAddedCount++;
    }

    if (successfullyAddedCount === 0 && filePaths.length > 0) {
      return {
        processed: true,
        result: `错误: 目录 "${dirPath}" 中的文件都太大，无法加入上下文`,
        error: true,
      };
    }

    await saveContext(contextBuffer.export());

    return {
      processed: true,
      result: `已成功加入 ${successfullyAddedCount} 个文件到上下文 (共找到 ${filePaths.length} 个文件)`,
      itemCount: successfullyAddedCount,
    };
  } catch (error) {
    return {
      processed: true,
      result: `错误: 读取目录失败: ${error}`,
      error: true,
    };
  }
}
