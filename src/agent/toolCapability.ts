/**
 * 工具能力规范 (Tool Capability Specification)
 * -----------------------------------------
 * 定义每个工具的元数据、能力要求和使用规范
 *
 * 目的：
 * 1. 建立工具与能力等级的硬性依赖关系
 * 2. 提供工具的 JSON Schema 定义用于 LLM 理解
 * 3. 统一工具的错误处理和重试策略
 */

import { CapabilityLevel } from '../core/capability/CapabilityLevel';

/**
 * 工具类别枚举
 */
export enum ToolCategory {
  FILE_IO = 'file_io',           // 文件读写操作
  FILE_SEARCH = 'file_search',   // 文件搜索
  CODE_ANALYSIS = 'code_analysis', // 代码分析
  GIT_OPERATION = 'git_operation', // Git 操作
  SYSTEM = 'system',              // 系统操作
  NETWORK = 'network'             // 网络操作
}

/**
 * 工具元数据接口
 */
export interface ToolMetadata {
  name: string;
  category: ToolCategory;
  description: string;
  minCapability: CapabilityLevel;
  parameters: ToolParameter[];
  returns: string;
  examples: ToolExample[];
  riskLevel: 'low' | 'medium' | 'high';
  retryable: boolean;
  maxRetries: number;
}

/**
 * 工具参数定义
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

/**
 * 工具使用示例
 */
export interface ToolExample {
  description: string;
  parameters: Record<string, any>;
  expectedResult: string;
}

/**
 * 工具能力映射表
 * 定义每个工具所需的最小能力等级
 */
export const TOOL_CAPABILITY_MAP: Record<string, ToolMetadata> = {
  // ===== 基础文件操作 =====
  read_file: {
    name: 'read_file',
    category: ToolCategory.FILE_IO,
    description: '读取指定路径的文件内容',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径（绝对路径或相对路径）', required: true },
      { name: 'encoding', type: 'string', description: '文件编码，默认 utf-8', required: false, default: 'utf-8' }
    ],
    returns: '文件内容字符串',
    examples: [
      {
        description: '读取配置文件',
        parameters: { path: 'package.json' },
        expectedResult: 'package.json 的内容'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  read_file_lines: {
    name: 'read_file_lines',
    category: ToolCategory.FILE_IO,
    description: '读取文件的指定行范围，用于处理大文件。注意：如果要读取倒数N行，需要先用 file_info 或 shell_cmd (wc -l) 获取总行数，然后计算 start_line = 总行数 - N + 1',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'start_line', type: 'number', description: '起始行号（从1开始，不是0）。如果要读取倒数第N行，需要计算：总行数 - N + 1', required: true },
      { name: 'end_line', type: 'number', description: '结束行号（包含），可选，默认到文件末尾', required: false },
      { name: 'encoding', type: 'string', description: '文件编码，默认 utf-8', required: false, default: 'utf-8' }
    ],
    returns: '指定行范围的内容，带行号',
    examples: [
      {
        description: '读取文件前50行',
        parameters: { path: 'large-file.log', start_line: 1, end_line: 50 },
        expectedResult: '文件第1-50行的内容'
      },
      {
        description: '读取文件倒数10行（假设文件有100行）：start_line = 100 - 10 + 1 = 91',
        parameters: { path: 'src/agent/executor.ts', start_line: 91, end_line: 100 },
        expectedResult: '文件第91-100行（倒数10行）'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  read_file_lines_from_end: {
    name: 'read_file_lines_from_end',
    category: ToolCategory.FILE_IO,
    description: '从文件末尾读取指定行数（倒数行）。这是读取倒数N行的直接工具，无需计算行号。例如：读取倒数第5行到第10行，使用 count=10, start_offset=4',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'count', type: 'number', description: '要读取的行数，默认 10', required: false, default: 10 },
      { name: 'start_offset', type: 'number', description: '从倒数第几行开始（0表示从最后一行开始）。例如：读取倒数第5行到第10行，使用 count=10, start_offset=4（从倒数第10行开始，共读取10行）', required: false, default: 0 },
      { name: 'encoding', type: 'string', description: '文件编码，默认 utf-8', required: false, default: 'utf-8' }
    ],
    returns: '从文件末尾开始的内容，带行号',
    examples: [
      {
        description: '读取文件最后10行',
        parameters: { path: 'verify.sh', count: 10 },
        expectedResult: 'verify.sh 的最后10行'
      },
      {
        description: '读取文件倒数第5行到第10行（从倒数第10行开始，读取10行）',
        parameters: { path: 'verify.sh', count: 10, start_offset: 4 },
        expectedResult: 'verify.sh 的倒数第5行到第10行'
      },
      {
        description: '读取文件最后5行',
        parameters: { path: 'verify.sh', count: 5, start_offset: 0 },
        expectedResult: 'verify.sh 的最后5行'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  write_file: {
    name: 'write_file',
    category: ToolCategory.FILE_IO,
    description: '创建或覆盖文件内容',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'content', type: 'string', description: '文件内容', required: true },
      { name: 'encoding', type: 'string', description: '文件编码，默认 utf-8', required: false, default: 'utf-8' }
    ],
    returns: '写入成功的确认信息',
    examples: [
      {
        description: '创建新文件',
        parameters: { path: 'output.txt', content: 'Hello World' },
        expectedResult: 'Successfully wrote output.txt'
      }
    ],
    riskLevel: 'medium',
    retryable: false,
    maxRetries: 0
  },

  append_file: {
    name: 'append_file',
    category: ToolCategory.FILE_IO,
    description: '向文件末尾追加内容',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'content', type: 'string', description: '要追加的内容', required: true },
      { name: 'encoding', type: 'string', description: '文件编码，默认 utf-8', required: false, default: 'utf-8' }
    ],
    returns: '追加成功的确认信息',
    examples: [
      {
        description: '向日志文件追加内容',
        parameters: { path: 'app.log', content: 'New log entry\n' },
        expectedResult: 'Successfully appended to app.log'
      }
    ],
    riskLevel: 'medium',
    retryable: true,
    maxRetries: 2
  },

  // ===== 文件搜索和列表 =====
  list_files: {
    name: 'list_files',
    category: ToolCategory.FILE_SEARCH,
    description: '列出指定目录下的文件和子目录',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '目录路径，默认当前目录', required: false, default: '.' },
      { name: 'recursive', type: 'boolean', description: '是否递归列出子目录，默认 false', required: false, default: false },
      { name: 'pattern', type: 'string', description: '文件名模式过滤（如 *.ts），默认不过滤', required: false },
      { name: 'exclude_dirs', type: 'array', description: '要排除的目录名列表（如 node_modules）', required: false, default: [] }
    ],
    returns: '文件和目录列表的 JSON',
    examples: [
      {
        description: '列出 src 目录下的 TypeScript 文件',
        parameters: { path: 'src', recursive: true, pattern: '*.ts', exclude_dirs: ['node_modules'] },
        expectedResult: 'src 目录下所有 .ts 文件的列表'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  list_directory_tree: {
    name: 'list_directory_tree',
    category: ToolCategory.FILE_SEARCH,
    description: '生成目录结构的树形展示，便于理解项目结构',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '目录路径，默认当前目录', required: false, default: '.' },
      { name: 'max_depth', type: 'number', description: '最大递归深度，默认 3', required: false, default: 3 },
      { name: 'include_files', type: 'boolean', description: '是否包含文件，默认 true', required: false, default: true },
      { name: 'exclude_patterns', type: 'array', description: '要排除的路径模式列表', required: false, default: ['node_modules', '.git', 'dist', 'build'] }
    ],
    returns: '目录结构的树形文本',
    examples: [
      {
        description: '生成项目目录树',
        parameters: { path: '.', max_depth: 3 },
        expectedResult: '项目的树形目录结构'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  search_in_files: {
    name: 'search_in_files',
    category: ToolCategory.FILE_SEARCH,
    description: '在文件中搜索指定内容（类似 grep）',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'pattern', type: 'string', description: '搜索模式（支持正则表达式）', required: true },
      { name: 'path', type: 'string', description: '搜索路径，默认当前目录', required: false, default: '.' },
      { name: 'file_pattern', type: 'string', description: '文件名模式（如 *.ts），默认所有文件', required: false },
      { name: 'recursive', type: 'boolean', description: '是否递归搜索，默认 true', required: false, default: true },
      { name: 'ignore_case', type: 'boolean', description: '是否忽略大小写，默认 false', required: false, default: false },
      { name: 'context_lines', type: 'number', description: '显示匹配行的上下文行数，默认 0', required: false, default: 0 },
      { name: 'max_results', type: 'number', description: '最大结果数，默认 50', required: false, default: 50 }
    ],
    returns: '匹配结果的列表，包含文件名、行号和匹配内容',
    examples: [
      {
        description: '在 TypeScript 文件中搜索 "function"',
        parameters: { pattern: 'function', file_pattern: '*.ts', recursive: true },
        expectedResult: '所有包含 "function" 的 TypeScript 文件及其行号'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  // ===== 代码分析工具 =====
  search_symbol: {
    name: 'search_symbol',
    category: ToolCategory.CODE_ANALYSIS,
    description: '搜索代码符号（函数、类、变量等）的定义和引用',
    minCapability: CapabilityLevel.STRUCTURAL,
    parameters: [
      { name: 'symbol', type: 'string', description: '符号名称', required: true },
      { name: 'symbol_type', type: 'string', description: '符号类型（function, class, variable, interface）', required: false },
      { name: 'path', type: 'string', description: '搜索路径，默认当前目录', required: false, default: '.' },
      { name: 'file_pattern', type: 'string', description: '文件名模式，默认所有文件', required: false }
    ],
    returns: '符号的定义位置和引用位置列表',
    examples: [
      {
        description: '搜索 ToolExecutor 类的定义',
        parameters: { symbol: 'ToolExecutor', symbol_type: 'class' },
        expectedResult: 'ToolExecutor 类的定义文件和行号'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  analyze_dependencies: {
    name: 'analyze_dependencies',
    category: ToolCategory.CODE_ANALYSIS,
    description: '分析文件的依赖关系（import/require）',
    minCapability: CapabilityLevel.STRUCTURAL,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径或目录路径', required: true },
      { name: 'recursive', type: 'boolean', description: '是否递归分析依赖，默认 false', required: false, default: false }
    ],
    returns: '依赖关系图或列表',
    examples: [
      {
        description: '分析 executor.ts 的依赖',
        parameters: { path: 'src/agent/executor.ts' },
        expectedResult: 'executor.ts 导入的所有模块和它们的位置'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  // ===== Git 操作 =====
  git_status: {
    name: 'git_status',
    category: ToolCategory.GIT_OPERATION,
    description: '获取 Git 仓库状态',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '仓库路径，默认当前目录', required: false, default: '.' }
    ],
    returns: 'Git 状态信息（分支、修改的文件等）',
    examples: [
      {
        description: '获取当前 Git 状态',
        parameters: {},
        expectedResult: '当前分支和修改的文件列表'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 2
  },

  git_diff: {
    name: 'git_diff',
    category: ToolCategory.GIT_OPERATION,
    description: '查看文件或提交的差异',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'file', type: 'string', description: '指定文件路径，可选', required: false },
      { name: 'cached', type: 'boolean', description: '查看暂存区的差异，默认 false', required: false, default: false },
      { name: 'lines', type: 'number', description: '只显示前 N 行差异', required: false }
    ],
    returns: 'Git diff 输出',
    examples: [
      {
        description: '查看工作区的修改',
        parameters: {},
        expectedResult: '所有未暂存的修改'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 2
  },

  git_log: {
    name: 'git_log',
    category: ToolCategory.GIT_OPERATION,
    description: '查看提交历史',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'max_count', type: 'number', description: '最多显示的提交数，默认 10', required: false, default: 10 },
      { name: 'file', type: 'string', description: '只显示指定文件的历史', required: false },
      { name: 'oneline', type: 'boolean', description: '单行格式，默认 true', required: false, default: true }
    ],
    returns: '提交历史记录',
    examples: [
      {
        description: '查看最近5条提交',
        parameters: { max_count: 5 },
        expectedResult: '最近5条提交记录'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 2
  },

  // ===== 系统操作 =====
  shell_cmd: {
    name: 'shell_cmd',
    category: ToolCategory.SYSTEM,
    description: '执行 Shell 命令',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'command', type: 'string', description: '要执行的命令', required: true },
      { name: 'timeout', type: 'number', description: '超时时间（秒），默认 30', required: false, default: 30 }
    ],
    returns: '命令执行结果（stdout/stderr）',
    examples: [
      {
        description: '列出当前目录',
        parameters: { command: 'ls -la' },
        expectedResult: '当前目录的文件列表'
      }
    ],
    riskLevel: 'high',
    retryable: false,
    maxRetries: 0
  },

  // ===== 上下文管理工具 =====
  continue_reading: {
    name: 'continue_reading',
    category: ToolCategory.FILE_IO,
    description: '继续读取之前被截断的文件内容',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'from_position', type: 'number', description: '从哪个字符位置继续读取（默认之前读取的末尾）', required: false },
      { name: 'length', type: 'number', description: '读取长度，默认 2000', required: false, default: 2000 }
    ],
    returns: '从指定位置开始的文件内容',
    examples: [
      {
        description: '继续读取被截断的大文件',
        parameters: { path: 'large-file.log', from_position: 2000, length: 2000 },
        expectedResult: '从位置 2000 开始的 2000 个字符'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  },

  file_info: {
    name: 'file_info',
    category: ToolCategory.FILE_IO,
    description: '获取文件的元信息（大小、类型、修改时间等）',
    minCapability: CapabilityLevel.TEXT,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true }
    ],
    returns: '文件元信息的 JSON',
    examples: [
      {
        description: '获取文件信息',
        parameters: { path: 'package.json' },
        expectedResult: '{ size: 1234, modified: "2024-01-01", type: "file" }'
      }
    ],
    riskLevel: 'low',
    retryable: true,
    maxRetries: 3
  }
};

/**
 * 检查工具是否可以被当前能力等级执行
 */
export function canExecuteTool(toolName: string, currentCapability: CapabilityLevel): boolean {
  const metadata = TOOL_CAPABILITY_MAP[toolName];
  if (!metadata) return false;
  return currentCapability >= metadata.minCapability;
}

/**
 * 获取工具的能力要求
 */
export function getToolCapabilityRequirement(toolName: string): CapabilityLevel | null {
  const metadata = TOOL_CAPABILITY_MAP[toolName];
  return metadata ? metadata.minCapability : null;
}

/**
 * 根据 capability 级别获取可用的工具列表
 */
export function getAvailableToolsForCapability(capability: CapabilityLevel): string[] {
  return Object.entries(TOOL_CAPABILITY_MAP)
    .filter(([_, metadata]) => capability >= metadata.minCapability)
    .map(([name, _]) => name);
}

/**
 * 获取工具的 JSON Schema 定义
 * 用于生成 LLM 的工具定义
 */
export function getToolJSONSchema(toolName: string): object | null {
  const metadata = TOOL_CAPABILITY_MAP[toolName];
  if (!metadata) return null;

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of metadata.parameters) {
    properties[param.name] = {
      type: param.type,
      description: param.description
    };
    if (param.default !== undefined) {
      properties[param.name].default = param.default;
    }
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'object',
    properties,
    required
  };
}

/**
 * 生成完整的工具定义列表（用于 LLM System Prompt）
 *
 * 采用行为指令格式（参考 Claude Code）：
 * - 告诉 AI 每个工具什么时候该用、什么时候不该用
 * - 交叉强化：shell_cmd 说"用专用工具"，专用工具说"用我别用 shell_cmd"
 * - 参数说明保持简洁，由 JSON Schema 承担细节
 */
export function generateToolDefinitionsPrompt(): string {
  return [
    '=== 工具使用指南 ===',
    '',
    '你拥有以下工具。请严格遵守以下规则：',
    '',
    '## 核心原则（最重要）',
    '',
    '1. **优先使用专用工具**，不要用 shell_cmd 做专用工具能做的事',
    '2. **不要用 shell_cmd 运行** `find`、`grep`、`cat`、`head`、`tail`、`sed`、`awk`、`echo` —— 除非专用工具无法完成任务',
    '3. 每次使用工具前，先想想是否有更合适的专用工具',
    '',
    '---',
    '',
    '## 专用工具（优先使用）',
    '',
    '### read_file',
    '**ALWAYS 使用 read_file 读取文件内容，NEVER 使用 shell_cmd 运行 cat/head/tail。**',
    '- 参数: `path`（文件路径，必需）',
    '- 可以读取任何文件，包括图片（会以视觉方式展示）',
    '- 默认读取前 2000 行，大文件请使用 `start_line` 和 `end_line` 参数分段读取',
    '- 示例: `{ "tool_name": "read_file", "parameters": { "path": "package.json" } }`',
    '',
    '### read_file_lines',
    '**ALWAYS 使用 read_file_lines 读取文件的指定行范围。**',
    '- 参数: `path`（文件路径）、`start_line`（起始行号，从1开始）、`end_line`（结束行号，可选）',
    '- 适用于大文件的局部读取',
    '- 示例: `{ "tool_name": "read_file_lines", "parameters": { "path": "large.log", "start_line": 100, "end_line": 150 } }`',
    '',
    '### read_file_lines_from_end',
    '**ALWAYS 使用此工具读取文件的倒数 N 行。**',
    '- 参数: `path`（文件路径）、`count`（要读取的行数，默认10）',
    '- 比 read_file_lines 更直接，不需要先计算总行数',
    '- 示例: `{ "tool_name": "read_file_lines_from_end", "parameters": { "path": "app.log", "count": 20 } }`',
    '',
    '### continue_reading',
    '**当 read_file 的输出被截断时，使用 continue_reading 继续读取。**',
    '- 参数: `path`（文件路径）、`from_position`（从哪个字符位置继续，可选）',
    '- 系统会在输出被截断时提示你使用此工具',
    '',
    '### write_file',
    '**ALWAYS 使用 write_file 创建或修改文件，NEVER 使用 shell_cmd 运行 echo >/cat <<EOF。**',
    '- 参数: `path`（文件路径）、`content`（完整文件内容，必需）',
    '- 会自动创建不存在的父目录',
    '- 写入时会覆盖原文件，如需保留请先用 read_file 读取',
    '',
    '### append_file',
    '**当只需要向文件末尾追加内容时使用。**',
    '- 参数: `path`（文件路径）、`content`（要追加的内容）',
    '- 比 write_file 更安全，不会覆盖原内容',
    '',
    '### list_files',
    '**ALWAYS 使用 list_files 列出目录文件，NEVER 使用 shell_cmd 运行 ls 来列举文件。**',
    '- 参数: `path`（目录路径，默认当前目录）、`recursive`（是否递归）',
    '- 返回结构化的 JSON 结果（包含 path 和 type 字段）',
    '- 示例: `{ "tool_name": "list_files", "parameters": { "path": "src", "recursive": true } }`',
    '',
    '### list_directory_tree',
    '**使用 list_directory_tree 获取项目的树形结构视图。**',
    '- 参数: `path`（目录路径）、`max_depth`（最大深度，默认3）',
    '- 自动排除 node_modules、.git 等目录',
    '- 适合了解项目整体结构',
    '',
    '### search_in_files',
    '**ALWAYS 使用 search_in_files 搜索文件内容，NEVER 使用 shell_cmd 运行 grep/rg。**',
    '- 参数: `pattern`（搜索模式，支持正则）、`path`（搜索路径）、`file_pattern`（文件名模式如 *.ts）',
    '- 支持大小写不敏感、上下文行、最大结果限制',
    '- 示例: `{ "tool_name": "search_in_files", "parameters": { "pattern": "function\\\\s+foo", "file_pattern": "*.ts" } }`',
    '',
    '### search_symbol',
    '**ALWAYS 使用 search_symbol 搜索代码符号（函数、类、接口等），NEVER 使用 shell_cmd 运行 grep 搜索代码定义。**',
    '- 参数: `symbol`（符号名称，必需）、`symbol_type`（function/class/interface，可选）',
    '- 基于代码结构分析，比文本搜索更准确',
    '- 示例: `{ "tool_name": "search_symbol", "parameters": { "symbol": "ToolExecutor", "symbol_type": "class" } }`',
    '',
    '### analyze_dependencies',
    '**分析文件的 import/require 依赖关系。**',
    '- 参数: `path`（文件路径或目录路径）',
    '- 自动匹配 ES6 import、CommonJS require、动态 import',
    '',
    '### file_info',
    '**获取文件元信息（大小、修改时间、权限等）。**',
    '- 参数: `path`（文件路径）',
    '- macOS 获取文件大小请用 file_info 或 `stat -f %z 路径`，不要用 `du -b`',
    '',
    '---',
    '',
    '## Shell 命令（备用方案）',
    '',
    '### shell_cmd',
    '**shell_cmd 是备用方案。当专用工具能完成任务时，优先使用专用工具。**',
    '- 参数: `command`（命令字符串，必需）',
    '- 以下场景应该使用专用工具而非 shell_cmd：',
    '  - 读取文件 → 用 read_file（不是 cat/head/tail）',
    '  - 搜索文件 → 用 search_in_files（不是 grep/rg）',
    '  - 搜索代码符号 → 用 search_symbol（不是 grep）',
    '  - 列出文件 → 用 list_files（不是 ls/find）',
    '  - 写入文件 → 用 write_file（不是 echo >/cat <<EOF）',
    '  - 编辑文件 → 用 write_file（不是 sed/awk）',
    '- shell_cmd 适合的场景：',
    '  - git 操作（git status、git diff、git log 除外，它们有专用工具）',
    '  - 系统信息查询（uname、whoami 等）',
    '  - 数据处理管道（jq、awk 分析复杂数据）',
    '  - 运行测试或构建命令',
    '- macOS 注意事项：当前系统是 macOS，使用 BSD 工具链',
    '  - `du -b` 不可用，用 `stat -f %z 路径` 获取文件大小',
    "  - `sed -i` 需要空字符串参数：`sed -i '' 's/old/new/g' 文件`",
    '  - `stat -c` 不可用，用 `stat -f`',
    '- **危险命令**会被安全系统拦截（如 rm -rf /、curl | sh 等）',
    '',
    '---',
    '',
    '## Git 操作（专用工具）',
    '',
    '### git_status',
    '**ALWAYS 使用 git_status 查看 Git 状态，优先于 shell_cmd 运行 git status。**',
    '- 参数: `path`（仓库路径，默认当前目录）',
    '- 返回当前分支和修改文件列表',
    '',
    '### git_diff',
    '**ALWAYS 使用 git_diff 查看代码差异，优先于 shell_cmd 运行 git diff。**',
    '- 参数: `file`（指定文件，可选）、`cached`（查看暂存区差异）',
    '- 返回 diff 格式的代码差异',
    '',
    '### git_log',
    '**ALWAYS 使用 git_log 查看提交历史，优先于 shell_cmd 运行 git log。**',
    '- 参数: `max_count`（显示条数，默认10）、`file`（指定文件，可选）',
    '',
    '---',
    '',
    '## 任务完成条件',
    '',
    '当你获取了用户请求的信息后，必须设置 "is_done": true 并使用 action_type: "answer" 返回结果。',
    '不要重复调用相同的工具。',
    '',
    '例如：用户请求"读取 package.json"，你应该：',
    '1. 调用 read_file 工具读取文件',
    '2. 立即设置 is_done: true，action_type: "answer"，返回文件内容',
    '3. 不要继续循环调用其他工具',
  ].join('\n');
}

/**
 * 辅助函数：能力等级转字符串
 */
function capabilityLevelToString(level: CapabilityLevel): string {
  switch (level) {
    case CapabilityLevel.SEMANTIC: return 'SEMANTIC (极致语义)';
    case CapabilityLevel.STRUCTURAL: return 'STRUCTURAL (结构分析)';
    case CapabilityLevel.LINE: return 'LINE (行级分析)';
    case CapabilityLevel.TEXT: return 'TEXT (文本处理)';
    case CapabilityLevel.NONE: return 'NONE (无智能要求)';
    default: return 'UNKNOWN';
  }
}
