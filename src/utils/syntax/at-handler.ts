import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  buildPromptWithFileContent,
  readFilesContent,
} from '../../core/fileReader';
import { ContextBuffer } from '../../commands/contextBuffer';
import { loadContext, saveContext } from '../../commands/contextStorage';
import { resolveFilePathsAndQuestion } from './resolver';
import { logger } from '../../utils/Logger';

const log = logger.child('SyntaxHandler');

const execAsync = promisify(exec);
const MAX_FILE_TOKENS = 10000;

// ============================================================================
// 辅助：在上下文缓冲中执行操作并持久化
// ============================================================================

async function withContext<T>(fn: (ctx: ContextBuffer) => Promise<T>): Promise<T> {
  const persisted = await loadContext();
  const ctx = new ContextBuffer();
  ctx.import(persisted);
  const result = await fn(ctx);
  await saveContext(ctx.export());
  return result;
}

// ============================================================================
// @ 语法处理器
// ============================================================================

/**
 * 处理 @ 语法总入口
 */
export async function handleAtSyntax(
  trimmed: string,
  stdinData?: string,
): Promise<{
  processed: boolean;
  result?: string;
  error?: boolean;
  isPureReference?: boolean;
  type?: 'file' | 'directory' | 'command' | 'management';
}> {
  // 1. @! 立即执行语法
  const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);
  if (immediateExecMatch) {
    const filePath = immediateExecMatch[1].trim();
    return await handleImmediateExec(filePath);
  }

  // 2. @filename:command 语法
  const fileExecMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^0-9\s].*)$/);
  if (fileExecMatch) {
    const filePath = fileExecMatch[1].trim();
    const command = fileExecMatch[2].trim();
    return await handleFileAndCommand(filePath, command);
  }

  // 3. 带行号或批量引用的语法
  const lineRangeMatch = trimmed.match(
    /^@\s*([^\s\n]+)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+([^\s\n]+))?\s*(.*)$/s,
  );
  if (lineRangeMatch) {
    const rawPart = lineRangeMatch[1].trim();
    const startLine = lineRangeMatch[2] ? parseInt(lineRangeMatch[2]) : null;
    const endLine = lineRangeMatch[3] ? parseInt(lineRangeMatch[3]) : null;
    const alias = lineRangeMatch[4];
    let question =
      lineRangeMatch[5]?.trim() ||
      (stdinData ? `分析以下内容：\n\n${stdinData}` : undefined);

    const { filePaths, extraQuestion } =
      await resolveFilePathsAndQuestion(rawPart);

    if (extraQuestion) {
      question = question ? `${extraQuestion}\n\n${question}` : extraQuestion;
    }

    const hasQuestion = !!question || !!stdinData;

    if (filePaths.length > 1) {
      let warningPrefix = '';
      if (alias) {
        warningPrefix += chalk.yellow(
          '⚠️ 警告: 别名 (alias) 仅支持单个文件引用，当前多个文件引用将忽略别名。\n',
        );
      }
      if (startLine !== null) {
        warningPrefix += chalk.yellow(
          '⚠️ 警告: 行号范围仅支持单个文件引用，当前多个文件引用将忽略行号范围。\n',
        );
      }
      const res = await handleMultipleFileReferences(
        filePaths,
        question,
        !hasQuestion,
      );
      return {
        ...res,
        result: warningPrefix + res.result,
        isPureReference: !hasQuestion,
        type: 'file',
      };
    } else if (filePaths.length === 1) {
      const res = await handleFileReference(
        filePaths[0],
        startLine,
        endLine,
        question,
        alias,
        !hasQuestion,
      );
      return {
        ...res,
        isPureReference: !hasQuestion,
        type: 'file',
      };
    } else {
      return {
        processed: true,
        result: `错误: 未找到有效的文件或序号引用 "${rawPart}"`,
        error: true,
      };
    }
  }

  return { processed: false };
}

// ============================================================================
// 多文件引用处理
// ============================================================================

async function handleMultipleFileReferences(
  filePaths: string[],
  question?: string,
  isPureReference: boolean = false,
): Promise<{ processed: boolean; result: string; error?: boolean }> {
  const contentMap = new Map<string, string>();
  const addedFiles: string[] = [];
  const warningList: string[] = [];

  const readPromises = filePaths.map(async (filePath) => {
    const fullPath = path.resolve(filePath);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      return { filePath, content, success: true };
    } catch (e: any) {
      return { filePath, success: false, error: e.message };
    }
  });

  const results = await Promise.all(readPromises);

  for (const res of results) {
    if (res.success && res.content !== undefined) {
      contentMap.set(res.filePath, res.content);
      addedFiles.push(res.filePath);
    } else {
      warningList.push(`警告: 跳过 "${res.filePath}": ${res.error}`);
    }
  }

  if (addedFiles.length === 0) {
    return {
      processed: true,
      result: warningList.length > 0 ? warningList.join('\n') + '\n' : '❌ 未找到任何有效的文件引用',
      error: true,
    };
  }

  await withContext(async (ctx) => {
    for (const [filePath, content] of contentMap) {
      ctx.add({ type: 'file', path: filePath, content });
    }
  });

  const warnings = warningList.length > 0 ? warningList.join('\n') + '\n' : '';

  if (isPureReference) {
    return {
      processed: true,
      result: `${warnings}✅ 已将 ${addedFiles.length} 个文件加入上下文：\n${addedFiles.map((f) => `  • ${f}`).join('\n')}`,
    };
  }

  const prompt = buildPromptWithFileContent(
    `引用了 ${addedFiles.length} 个文件`,
    addedFiles,
    contentMap,
    question || '请分析以上文件',
  );

  return { processed: true, result: warnings + prompt };
}

// ============================================================================
// 单文件引用处理
// ============================================================================

async function handleFileReference(
  filePath: string,
  startLine: number | null = null,
  endLine: number | null = null,
  question?: string,
  alias?: string,
  isPureReference: boolean = false,
): Promise<{
  processed: boolean;
  result: string;
  error?: boolean;
}> {
  const fullPath = path.resolve(filePath);

  try {
    await fs.promises.access(fullPath, fs.constants.F_OK);
    const stats = await fs.promises.stat(fullPath);
    if (!stats.isFile()) throw new Error('不是一个文件');

    let content = await fs.promises.readFile(fullPath, 'utf-8');

    if (startLine !== null) {
      const lines = content.split('\n');
      if (startLine < 1 || startLine > lines.length) {
        return {
          processed: true,
          result: `错误: 起始行号 ${startLine} 超出文件范围 (文件共有 ${lines.length} 行)`,
        };
      }
      const startIdx = startLine - 1;
      let endIdx = endLine ? Math.min(endLine, lines.length) : lines.length;
      if (endLine && (endLine < startLine || endLine > lines.length)) {
        return {
          processed: true,
          result: `错误: 结束行号 ${endLine} 超出有效范围 (应在 ${startLine}-${lines.length} 之间)`,
        };
      }
      content = lines.slice(startIdx, endIdx).join('\n');
    }

    const contentMap = new Map<string, string>();
    contentMap.set(filePath, content);

    const pathWithRange =
      filePath +
      (startLine !== null
        ? `:${startLine}${endLine ? `-${endLine}` : ''}`
        : '');

    await withContext(async (ctx) => {
      ctx.add({ type: 'file', path: pathWithRange, content, alias });
    });

    if (isPureReference) {
      return { processed: true, result: `✅ 已将文件 ${filePath} 加入上下文` };
    }

    const prompt = buildPromptWithFileContent(
      `文件: ${filePath}${startLine !== null ? `:${startLine}${endLine ? `-${endLine}` : ''}` : ''}`,
      [filePath],
      contentMap,
      question || `请分析文件: ${filePath}`,
    );

    return { processed: true, result: prompt };
  } catch (error: any) {
    return {
      processed: true,
      result: `错误: 无法处理文件 "${filePath}": ${error.message}`,
      error: true,
    };
  }
}

// ============================================================================
// @! 立即执行
// ============================================================================

async function handleImmediateExec(
  filePath: string,
): Promise<{ processed: boolean; result: string }> {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    return {
      processed: true,
      result: `错误: 文件 "${filePath}" 不存在`,
    };
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    log.info(`正在执行 ${filePath} 并捕获输出...`);

    const { stdout, stderr } = await execAsync(
      `chmod +x "${fullPath}" && "${fullPath}"`,
      { cwd: process.cwd() },
    );

    const combinedContext = `
=== 脚本内容 (${filePath}) ===
\`\`\`bash
${content}
\`\`\`

=== 执行标准输出 (stdout) ===
\`\`\`
${stdout}
\`\`\`

=== 执行标准错误 (stderr) ===
\`\`\`
${stderr}
\`\`\`
`;

    await withContext(async (ctx) => {
      ctx.add({
        type: 'file',
        path: `${filePath} (Runtime Log)`,
        content: combinedContext,
        summary: '包含脚本源码和执行后的输出日志',
      });
    });

    const result = `我执行了脚本 ${filePath}。\n以下是脚本源码和执行输出：\n${combinedContext}\n\n请分析为何会出现上述输出（特别是错误信息）？`;
    return { processed: true, result };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const result = `执行脚本 ${filePath} 时发生错误：\n${errorMsg}\n\n请分析原因。`;
    return { processed: true, result };
  }
}

// ============================================================================
// @file:command 语法
// ============================================================================

async function handleFileAndCommand(
  filePath: string,
  command: string,
): Promise<{
  processed: boolean;
  result: string;
  isPureReference?: boolean;
  type?: any;
}> {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return {
        processed: true,
        result: `错误: 文件 "${filePath}" 不存在`,
        isPureReference: true,
        type: 'file',
      };
    }

    const content = await fs.promises.readFile(fullPath, 'utf-8');

    await withContext(async (ctx) => {
      ctx.add({ type: 'file', path: filePath, content });
    });

    log.info(`✓ 已将文件 "${filePath}" 加入上下文`);
    log.info(`⚡️ 正在执行: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      cwd: path.dirname(fullPath),
    });
    if (stdout) log.info(stdout);
    if (stderr) log.error(stderr);

    return {
      processed: true,
      result: `命令执行完成`,
      isPureReference: true,
      type: 'command',
    };
  } catch (error) {
    return {
      processed: true,
      result: `错误: 执行失败: ${error}`,
      isPureReference: true,
      type: 'command',
    };
  }
}
