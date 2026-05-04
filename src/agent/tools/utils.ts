import { ToolExecutionResult } from '../state';

const MAX_OUTPUT_LENGTH = 2000;
const READ_POSITIONS = new Map<string, number>();

/**
 * Get stored read position for a file (used by continue_reading).
 */
export function getReadPosition(filePath: string): number | undefined {
  return READ_POSITIONS.get(filePath);
}

/**
 * Set read position for a file.
 */
export function setReadPosition(filePath: string, position: number): void {
  READ_POSITIONS.set(filePath, position);
}

/**
 * Clear read position for a file.
 */
export function clearReadPosition(filePath: string): void {
  READ_POSITIONS.delete(filePath);
}

/**
 * Get the maximum output length threshold.
 */
export function getMaxOutputLength(): number {
  return MAX_OUTPUT_LENGTH;
}

/**
 * Intelligently truncate output.
 * When output exceeds the limit, returns truncated text with a suggestion block.
 */
export function maybeTruncateOutput(output: string, toolName?: string, filePath?: string): string {
  if (output.length <= MAX_OUTPUT_LENGTH) {
    return output;
  }

  const truncated = output.slice(0, MAX_OUTPUT_LENGTH);
  const remaining = output.length - MAX_OUTPUT_LENGTH;

  let suggestion = `

[⚠️ OUTPUT TRUNCATED]
输出被截断，还有 ${remaining} 个字符未显示。

`;

  if (toolName === 'read_file' && filePath) {
    setReadPosition(filePath, MAX_OUTPUT_LENGTH);
    suggestion += `
**建议操作**：
1. 使用 \`read_file_lines\` 工具读取特定行范围：
   { "tool_name": "read_file_lines", "parameters": { "path": "${filePath}", "start_line": 1, "end_line": 100 } }

2. 使用 \`continue_reading\` 工具继续读取：
   { "tool_name": "continue_reading", "parameters": { "path": "${filePath}" } }

3. 使用 \`search_in_files\` 工具搜索关键词：
   { "tool_name": "search_in_files", "parameters": { "pattern": "关键词", "path": "${filePath}" } }
`;
  } else if (toolName === 'shell_cmd') {
    suggestion += `
**建议操作**：
1. 使用 \`head\` 查看前几行：
   head -n 50 filename

2. 使用 \`tail\` 查看后几行：
   tail -n 50 filename

3. 使用 \`grep\` 过滤内容：
   grep "keyword" filename

4. 将输出重定向到文件再读取：
   command > output.txt && read_file output.txt
`;
  } else {
    suggestion += `
**建议操作**：
1. 检查输出是否已经包含所需信息
2. 使用更精确的搜索参数
3. 将结果分批处理
`;
  }

  return truncated + suggestion;
}

/**
 * Format byte count into human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get user-friendly error message and suggestion for a given tool.
 */
export function getFriendlyError(toolName: string, error: Error | { message: string }): { message: string; suggestion: string } {
  const errorMsg = error?.message || String(error);
  const lowerError = errorMsg.toLowerCase();

  if (lowerError.includes('enoent') || lowerError.includes('no such file') || lowerError.includes('not found')) {
    const match = errorMsg.match(/['"](.*?)['"]|['`](.*?)['`]/);
    const fileName = match ? (match[1] || match[2]) : '指定文件';
    return {
      message: `文件未找到: ${fileName}`,
      suggestion: `💡 建议：使用 list_files 查看可用文件，或检查文件路径是否正确`
    };
  }

  if (lowerError.includes('eacces') || lowerError.includes('permission denied')) {
    return {
      message: `权限不足：无法访问该文件`,
      suggestion: `💡 建议：检查文件权限，或使用 sudo（如果适用）`
    };
  }

  if (lowerError.includes('syntax') || lowerError.includes('parse')) {
    return {
      message: `命令语法错误`,
      suggestion: `💡 建议：检查命令格式，参考工具文档`
    };
  }

  const suggestions: Record<string, string> = {
    read_file_lines: '💡 建议：检查 start_line 是否在文件范围内，使用 file_info 查看文件总行数',
    read_file_lines_from_end: '💡 建议：count 参数不要超过文件总行数',
    search_in_files: '💡 建议：使用更具体的搜索词，或使用 file_pattern 限制搜索范围',
    search_symbol: '💡 建议：检查符号名称是否正确，或尝试使用 search_in_files 搜索',
    write_file: '💡 建议：确保目录存在，检查文件路径是否正确',
    git_status: '💡 建议：确认当前在 Git 仓库中',
    git_diff: '💡 建议：检查是否有未提交的更改',
    git_log: '💡 建议：检查是否有提交历史'
  };

  return {
    message: errorMsg,
    suggestion: suggestions[toolName] || '💡 建议：检查参数是否正确，或尝试不同的工具'
  };
}

/**
 * Create a failed ToolExecutionResult from an error.
 */
export function failResult(error: string, output: string = ''): ToolExecutionResult {
  return { success: false, error, output };
}

/**
 * Create a success ToolExecutionResult.
 */
export function successResult(output: string, artifacts: string[] = []): ToolExecutionResult {
  return { success: true, output, artifacts };
}
