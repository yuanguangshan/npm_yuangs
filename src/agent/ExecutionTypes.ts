export interface ToolCallRecord {
  tool: string;
  params: Record<string, unknown>;
  count: number;
  lastOutput?: string;
  outputHistory: string[];
  blockCount: number;
}

export const READ_ONLY_TOOLS = [
  'read_file', 'list_files', 'read_file_lines', 'read_file_lines_from_end',
  'file_info', 'git_status', 'git_log', 'git_diff', 'list_directory_tree',
  'search_in_files', 'search_symbol', 'continue_reading', 'analyze_dependencies'
];

export interface WriteModeState {
  filePath: string;
  content: string;
}
