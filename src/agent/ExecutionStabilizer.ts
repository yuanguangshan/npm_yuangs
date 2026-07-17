import { ToolCallRecord } from './ExecutionTypes';
import { StreamMarkdownRenderer } from '../utils/renderer';

/**
 * Detects output stabilization and semantic completion.
 * Pure functions with zero dependencies on class state.
 */
export class StabilizationDetector {
  /** Detect if output has stabilized (same prefix as previous) */
  isOutputStable(lastToolCall: ToolCallRecord | null, normalizedOutput: string): boolean {
    const prevOutput = lastToolCall?.lastOutput || '';
    if (!prevOutput || !normalizedOutput) return false;

    const compareLen = 500;
    const currPrefix = normalizedOutput.substring(0, compareLen);
    const prevPrefix = prevOutput.substring(0, compareLen);
    const isStable = currPrefix === prevPrefix;

    const isNearlyStable =
      Math.abs(prevOutput.length - normalizedOutput.length) < 20 &&
      currPrefix.slice(0, 100) === prevPrefix.slice(0, 100);

    return isStable || isNearlyStable;
  }

  /** Detect if output is semantically complete (short direct answer) */
  isSemanticComplete(output: string, userInput: string): boolean {
    const trimmed = output.trim();
    if (trimmed.length > 300 || trimmed.length === 0) return false;

    const lineCount = trimmed.split('\n').length;
    if (lineCount > 15) return false;

    const q = userInput.toLowerCase();

    if (/(大小|多少字节|多大|size|bytes?)/.test(q)) {
      if (/^\d+(\.\d+)?$/.test(trimmed)) return true;
      if (/^[\d.]+\s*[KMGT]?B?$/i.test(trimmed)) return true;
      if (/^[\d.]+\s*[KMGT]?B?\s+\S+/i.test(trimmed)) return true;
    }

    if (/(几个|多少个|数量|count|how many)/.test(q) && /^\d+$/.test(trimmed)) return true;

    if (/(最大|最小|largest|smallest).*文件/.test(q)) {
      if (/^\d+\s+\.\//m.test(trimmed)) return true;
    }

    if (/(最新|最旧|最近|最早|newest|latest|oldest)/.test(q) && trimmed.split(/\s+/).length <= 5 && trimmed.length < 80) return true;

    if (/(行数|多少行|line.?count|多少 line)/.test(q) && /^\d+$/.test(trimmed)) return true;

    if (trimmed.length < 50 && !trimmed.startsWith('-') && trimmed.split(/\s+/).length <= 4) {
      if (/\d+|\.\//.test(trimmed)) return true;
    }

    return false;
  }

  /** Format tool result for display */
  tryFormatToolResult(output: string, userInput: string): string | null {
    if (output.length > 5000) return null;
    if (/(最大|最小|哪个.*最大|哪个.*最小|largest|smallest|biggest)/.test(userInput)) return null;

    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].path) {
        const files = parsed.filter((f: any) => f.type === 'file');
        const dirs = parsed.filter((f: any) => f.type === 'directory');
        const fileNames = files.map((f: any) => f.path.split('/').pop()).join('、');
        const dirNames = dirs.map((f: any) => f.path.split('/').pop()).join('、');
        let result = `**${files.length}** 个文件`;
        if (files.length > 0 && files.length <= 30) result += `：${fileNames}`;
        result += `\n**${dirs.length}** 个目录`;
        if (dirs.length > 0 && dirs.length <= 30) result += `：${dirNames}`;
        return result;
      }
    } catch { /* not JSON */ }

    if (output.length < 200 && !output.includes('\n')) return output;
    return null;
  }

  /** Render output and finish the renderer */
  renderAndFinish(
    context: { addMessage: (role: string, content: string) => void },
    output: string,
    agentRenderer: StreamMarkdownRenderer | undefined
  ): void {
    context.addMessage('assistant', output);
    if (agentRenderer) {
      // 将工具结果写入 buffer（而非清空），否则 finish() 在 quietMode 下
      // 因 buffer 为空而不输出任何内容（工具结果只进了对话历史，终端看不到）。
      (agentRenderer as any).buffer = output;
      (agentRenderer as any).quietMode = true;
      agentRenderer.finish();
    }
  }

  /** Quietly finish the renderer without adding message */
  finishQuiet(agentRenderer: StreamMarkdownRenderer | undefined): void {
    if (agentRenderer) {
      (agentRenderer as any).buffer = '';
      (agentRenderer as any).quietMode = true;
      agentRenderer.finish();
    }
  }
}

/**
 * 为 chat 模式的工具结果展示做行级截断。
 *
 * 旧实现按 1000 字符硬截（result.output.slice(0, 1000)），对 read_file 这类请求太小
 * （只能看到约 15 行），且按 UTF-16 码元切片可能切断中文代理对（产生乱码尾字符）。
 * 改为按整行截断：保留前 maxLines 行，并附带提示告知总行数与已显示行数。
 *
 * @param output    工具原始输出
 * @param maxLines  最多保留的行数；默认按终端高度自适应（约 2 屏，下限 40 行）
 */
export function truncateToolOutputForChat(output: string, maxLines?: number): string {
  const lines = output.split('\n');
  const limit = maxLines ?? Math.max(40, (process.stdout.rows || 24) * 2);
  if (lines.length <= limit) return output;
  return lines.slice(0, limit).join('\n') +
    `\n\n... (已截断，共 ${lines.length} 行，已显示前 ${limit} 行；可要求继续读取后续内容)`;
}

/**
 * 将内容包裹为 markdown 代码块，使其经过 markdown 渲染时原样展示（不被解释为
 * 标题 / 列表 / 引用等）。用于 chat 模式展示 read_file 等工具结果，避免代码被
 * markdown 破坏（如 # 注释变标题、缩进变代码块）。
 *
 * 自动选择比内容中最长反引号串还长一级的围栏，避免内容里的 ``` 提前截断围栏。
 */
export function wrapAsCodeFence(content: string): string {
  const runs = content.match(/`+/g) || [];
  const maxRun = runs.reduce((max, r) => Math.max(max, r.length), 0);
  const fence = '`'.repeat(Math.max(3, maxRun + 1));
  return `${fence}\n${content}\n${fence}`;
}
