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
      (agentRenderer as any).buffer = '';
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
