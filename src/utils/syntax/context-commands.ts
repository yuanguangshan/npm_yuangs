import chalk from 'chalk';
import { ContextBuffer } from '../../commands/contextBuffer';
import { loadContext, saveContext } from '../../commands/contextStorage';
import { renderMarkdown } from '../renderer';
import { getLanguageByPath } from './language-mapper';

// ============================================================================
// :ls — 列出上下文
// ============================================================================

export async function handleListContext(): Promise<{
  processed: boolean;
  result: string;
}> {
  try {
    const persisted = await loadContext();
    const contextBuffer = new ContextBuffer();
    contextBuffer.import(persisted);

    if (contextBuffer.isEmpty()) {
      return { processed: true, result: '当前没有上下文' };
    }

    const list = contextBuffer.list();

    const formatAge = (ageMin: number): string => {
      if (ageMin < 1) return '刚刚';
      if (ageMin < 60) return `${ageMin}分钟前`;
      const hours = Math.floor(ageMin / 60);
      if (hours < 24) return `${hours}小时前`;
      const days = Math.floor(hours / 24);
      return `${days}天前`;
    };

    const formatImportance = (importance: string): string => {
      const value = parseFloat(importance);
      if (value >= 0.8) return chalk.red('★★★');
      if (value >= 0.6) return chalk.yellow('★★☆');
      if (value >= 0.4) return chalk.green('★☆☆');
      return chalk.gray('☆☆☆');
    };

    const IMPORTANCE_WIDTH = 6;
    const AGE_WIDTH = 10;
    const TOKENS_WIDTH = 6;
    const PINNED_WIDTH = 2;
    const MAX_PATH_DISPLAY_WIDTH = 40;

    const maxIndexWidth = Math.max(String(list.length).length, 1);
    const maxTypeWidth = Math.max(...list.map((item) => item.type.length), 4);
    const pathColWidth = Math.min(
      Math.max(...list.map((item) => item.path.length), 4),
      MAX_PATH_DISPLAY_WIDTH,
    );

    const header = `┌${'─'.repeat(maxIndexWidth + 2)}┬${'─'.repeat(PINNED_WIDTH + 2)}┬${'─'.repeat(maxTypeWidth + 2)}┬${'─'.repeat(pathColWidth + 2)}┬${'─'.repeat(IMPORTANCE_WIDTH + 2)}┬${'─'.repeat(AGE_WIDTH + 2)}┬${'─'.repeat(TOKENS_WIDTH + 2)}┐`;
    const separator = `├${'─'.repeat(maxIndexWidth + 2)}┼${'─'.repeat(PINNED_WIDTH + 2)}┼${'─'.repeat(maxTypeWidth + 2)}┼${'─'.repeat(pathColWidth + 2)}┼${'─'.repeat(IMPORTANCE_WIDTH + 2)}┼${'─'.repeat(AGE_WIDTH + 2)}┼${'─'.repeat(TOKENS_WIDTH + 2)}┤`;
    const footer = `└${'─'.repeat(maxIndexWidth + 2)}┴${'─'.repeat(PINNED_WIDTH + 2)}┴${'─'.repeat(maxTypeWidth + 2)}┴${'─'.repeat(pathColWidth + 2)}┴${'─'.repeat(IMPORTANCE_WIDTH + 2)}┴${'─'.repeat(AGE_WIDTH + 2)}┴${'─'.repeat(TOKENS_WIDTH + 2)}┘`;

    const headerRow = `│ ${chalk.bold('#'.padEnd(maxIndexWidth))} │ ${chalk.bold('📌'.padEnd(PINNED_WIDTH))} │ ${chalk.bold('Type'.padEnd(maxTypeWidth))} │ ${chalk.bold('Path'.padEnd(pathColWidth))} │ ${chalk.bold('重要度')} │ ${chalk.bold('添加时间'.padEnd(AGE_WIDTH))} │ ${chalk.bold('Tokens'.padEnd(TOKENS_WIDTH))} │`;

    let result = chalk.cyan.bold('📋 当前上下文列表\n\n');
    result += chalk.blue.dim(header) + '\n';
    result += headerRow + '\n';
    result += chalk.blue.dim(separator) + '\n';

    const rowSeparator = `├${'┈'.repeat(maxIndexWidth + 2)}┼${'┈'.repeat(PINNED_WIDTH + 2)}┼${'┈'.repeat(maxTypeWidth + 2)}┼${'┈'.repeat(pathColWidth + 2)}┼${'┈'.repeat(IMPORTANCE_WIDTH + 2)}┼${'┈'.repeat(AGE_WIDTH + 2)}┼${'┈'.repeat(TOKENS_WIDTH + 2)}┤`;

    list.forEach((item, index) => {
      const indexStr = String(index + 1).padEnd(maxIndexWidth);
      const pinnedStr = (item.pinned ? '📌' : '  ').padEnd(PINNED_WIDTH);
      const typeStr = item.type.padEnd(maxTypeWidth);

      let pathStr = item.path;
      if (pathStr.length > MAX_PATH_DISPLAY_WIDTH) {
        pathStr = '...' + pathStr.slice(-(MAX_PATH_DISPLAY_WIDTH - 3));
      }
      pathStr = pathStr.padEnd(pathColWidth);

      const importanceStr = formatImportance(item.importance);
      const ageStr = formatAge(item.ageMin).padEnd(AGE_WIDTH);
      const tokensStr = String(item.tokens).padStart(TOKENS_WIDTH);

      let typeColor = chalk.cyan;
      if (item.type === 'memory') typeColor = chalk.magenta;
      if (item.type === 'antipattern') typeColor = chalk.red;

      result += `│ ${chalk.yellow(indexStr)} │ ${pinnedStr} │ ${typeColor(typeStr)} │ ${chalk.white(pathStr)} │ ${importanceStr} │ ${chalk.gray(ageStr)} │ ${chalk.green(tokensStr)} │\n`;

      if (index < list.length - 1) {
        result += chalk.blue.dim(rowSeparator) + '\n';
      }
    });

    result += chalk.blue.dim(footer);

    const totalTokens = list.reduce((sum, item) => sum + item.tokens, 0);
    const pinnedCount = list.filter((item) => item.pinned).length;
    const memoryCount = list.filter((item) => item.type === 'memory').length;

    result += `\n\n${chalk.cyan('📊')} ${chalk.gray('总计:')} ${chalk.yellow(list.length)} ${chalk.gray('|')} ${chalk.gray('固定:')} ${chalk.yellow(pinnedCount)} ${chalk.gray('|')} ${chalk.gray('记忆:')} ${chalk.magenta(memoryCount)} ${chalk.gray('|')} ${chalk.gray('Token:')} ${chalk.green(totalTokens.toLocaleString())}`;

    return { processed: true, result };
  } catch (error) {
    return {
      processed: true,
      result: `读取上下文失败: ${error}`,
    };
  }
}

// ============================================================================
// :cat — 查看上下文内容
// ============================================================================

export async function handleCatContext(
  index: number | null,
  startLine: number | null = null,
  endLine: number | null = null,
): Promise<{ processed: boolean; result: string }> {
  try {
    const persisted = await loadContext();
    const contextBuffer = new ContextBuffer();
    contextBuffer.import(persisted);

    if (contextBuffer.isEmpty()) {
      return { processed: true, result: '当前没有上下文' };
    }

    const items = contextBuffer.export();

    if (index !== null) {
      if (index < 1 || index > items.length) {
        return {
          processed: true,
          result: `错误: 索引 ${index} 超出范围 (共有 ${items.length} 个项目)`,
        };
      }
      const item = items[index - 1];
      let content = item.content || '(无内容)';

      const lang = getLanguageByPath(item.path);

      if (startLine !== null) {
        const lines = content.split('\n');
        const clampedStart = Math.max(1, startLine);
        const startIdx = clampedStart - 1;

        let endIdx = lines.length;
        if (endLine !== null) {
          if (endLine < clampedStart) {
            return {
              processed: true,
              result: `错误: 结束行号 ${endLine} 不能小于起始行号 ${clampedStart}`,
            };
          }
          endIdx = Math.min(endLine, lines.length);
        }

        if (startIdx >= lines.length) {
          return {
            processed: true,
            result: `错误: 起始行号 ${startLine} 超出范围 (该文件共有 ${lines.length} 行)`,
          };
        }

        content = lines.slice(startIdx, endIdx).join('\n');
        const rangeLabel = endLine
          ? `${clampedStart}-${endIdx}`
          : `${clampedStart}-末尾`;

        const highlighted = renderMarkdown(`\`\`\`${lang}\n${content}\n\`\`\``);

        return {
          processed: true,
          result: `${chalk.blue.bold(`--- [${index}] ${item.type}: ${item.path} (第 ${rangeLabel} 行) ---`)}\n${highlighted}\n${chalk.blue.bold('--- End ---')}`,
        };
      }

      const highlighted = renderMarkdown(`\`\`\`${lang}\n${content}\n\`\`\``);

      return {
        processed: true,
        result: `${chalk.blue.bold(`--- [${index}] ${item.type}: ${item.path} ---`)}\n${highlighted}\n${chalk.blue.bold('--- End ---')}`,
      };
    } else {
      let result = chalk.cyan.bold('=== 当前完整上下文内容 ===\n\n');
      items.forEach((item, i) => {
        const lang = getLanguageByPath(item.path);
        const highlighted = renderMarkdown(
          `\`\`\`${lang}\n${item.content || '(空)'}\n\`\`\``,
        );

        result += `${chalk.blue.bold(`--- [${i + 1}] ${item.type}: ${item.path} ---`)}\n${highlighted}\n\n`;
      });
      result += chalk.cyan.bold('==========================');
      return { processed: true, result };
    }
  } catch (error) {
    return {
      processed: true,
      result: `读取上下文失败: ${error}`,
    };
  }
}

// ============================================================================
// :clear — 清空上下文
// ============================================================================

export async function handleClearContext(): Promise<{
  processed: boolean;
  result: string;
}> {
  try {
    await saveContext([]);
    return { processed: true, result: '上下文已清空（含持久化）' };
  } catch (error) {
    return {
      processed: true,
      result: `清除上下文失败: ${error}`,
    };
  }
}
