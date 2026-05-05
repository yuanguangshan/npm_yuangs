import fs from 'fs';
import path from 'path';
import { loadContext } from '../../commands/contextStorage';

// ============================================================================
// 纯解析函数
// ============================================================================

/**
 * 解析 :cat 命名的参数定义 (如 "1:10-20")
 */
export function parseCatSpec(spec: string): {
  index: number | null;
  startLine: number | null;
  endLine: number | null;
  error?: string;
} {
  if (/^\d+$/.test(spec)) {
    return { index: parseInt(spec), startLine: null, endLine: null };
  }

  const match = spec.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) {
    return {
      index: null,
      startLine: null,
      endLine: null,
      error: `错误: 无效的索引格式 "${spec}"。请使用 :cat index 或 :cat index:start-end (例如 :cat 1:10-20)`,
    };
  }

  const index = parseInt(match[1]);
  const startLine = match[2] ? parseInt(match[2]) : null;
  const endLine = match[3] ? parseInt(match[3]) : null;

  if (isNaN(index)) {
    return {
      index: null,
      startLine: null,
      endLine: null,
      error: `错误: 索引 "${match[1]}" 不是有效的数字`,
    };
  }

  return { index, startLine, endLine };
}

/**
 * 引号感知的令牌解析器 (Tokenizer)
 *
 * 行为特性：
 * 1. 支持使用 ' 或 " 包裹路径，支持内部嵌套转义。
 * 2. 自动修剪非引号部分的空格。
 * 3. 容错处理：若引号未闭合，自动将剩余全量内容视为一个带引号的 Token。
 */
export function tokenizeWithQuotes(input: string): {
  tokens: string[];
  isQuoted: boolean[];
} {
  const tokens: string[] = [];
  const isQuoted: boolean[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      tokens.push(current);
      isQuoted.push(true);
      current = '';
    } else if (!inQuotes && (char === ',' || char === '，' || char === ' ')) {
      if (current) {
        tokens.push(current.trim());
        isQuoted.push(false);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current || inQuotes) {
    tokens.push(current.trim());
    isQuoted.push(inQuotes);
  }

  return { tokens, isQuoted };
}

// ============================================================================
// 路径解析器（带 I/O）
// ============================================================================

/**
 * 解析增强的路径语法 (识别路径列表与同行提问)
 *
 * 识别优先级与规则：
 * 1. 引号包裹: 只要被 "" 或 '' 包裹，一律视为文件路径。
 * 2. 范围语法: 符合 n-m 格式且为数字，视为上下文序号范围。
 * 3. 磁盘存在: 如果字符串在当前工作目录真实存在，视为路径。
 * 4. 上下文索引: 如果是纯数字且在当前 ContextBuffer 范围内，视为序号引用。
 * 5. 提问边界: 遇到第一个不满足上述任何条件的单词时，该单词及其后内容均识别为提问。
 */
export async function resolveFilePathsAndQuestion(
  input: string,
): Promise<{ filePaths: string[]; extraQuestion?: string }> {
  const persisted = await loadContext();
  const filePaths: string[] = [];

  // 1. 获取初步 Token
  const { tokens, isQuoted } = tokenizeWithQuotes(input);
  let questionStartIndex = -1;

  // 2. 预先并行检查所有 Token 的磁盘状态，避免循环中同步 I/O
  const stats = await Promise.all(
    tokens.map(async (t, i) => {
      if (isQuoted[i]) return { exists: true };
      try {
        const fullPath = path.resolve(t);
        await fs.promises.access(fullPath, fs.constants.F_OK);
        return { exists: true };
      } catch {
        return { exists: false };
      }
    }),
  );

  // 3. 扫描识别边界
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const quoted = isQuoted[i];
    const existsOnDisk = stats[i].exists;

    if (quoted) continue;

    const isRange = /^\d+-\d+$/.test(token);
    const isIndex =
      !isNaN(parseInt(token)) &&
      parseInt(token) > 0 &&
      parseInt(token) <= persisted.length;

    if (!existsOnDisk) {
      if (isRange || isIndex) {
        continue;
      }

      const numMatch = token.match(/^(\d+)(.+)$/);
      if (numMatch && parseInt(numMatch[1]) <= persisted.length) {
        questionStartIndex = i;
        break;
      }

      questionStartIndex = i;
      break;
    }
  }

  let pathTokens = tokens;
  let pathStats = stats;
  let extraQuestion: string | undefined;

  if (questionStartIndex !== -1) {
    pathTokens = tokens.slice(0, questionStartIndex);
    pathStats = stats.slice(0, questionStartIndex);
    extraQuestion = tokens.slice(questionStartIndex).join(' ');
  }

  // 4. 解析确定的路径部分
  for (let i = 0; i < pathTokens.length; i++) {
    const part = pathTokens[i];
    const existsOnDisk = pathStats[i].exists;

    if (existsOnDisk || isQuoted[i]) {
      filePaths.push(part);
      continue;
    }

    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Math.min(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
      const end = Math.max(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
      for (let j = start; j <= end; j++) {
        if (j > 0 && j <= persisted.length) {
          filePaths.push(persisted[j - 1].path);
        }
      }
      continue;
    }

    const idx = parseInt(part);
    if (!isNaN(idx) && idx > 0 && idx <= persisted.length) {
      filePaths.push(persisted[idx - 1].path);
      continue;
    }
  }

  return {
    filePaths: [...new Set(filePaths)],
    extraQuestion,
  };
}
