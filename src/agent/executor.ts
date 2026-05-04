import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { ProposedAction, ToolExecutionResult } from './state';
import { TOOL_CAPABILITY_MAP, canExecuteTool, getToolCapabilityRequirement } from './toolCapability';
import { CapabilityLevel } from '../core/capability/CapabilityLevel';
import { ErrorTracker } from './errorTracker';

const execAsync = promisify(exec);

/**
 * 增强的工具执行器
 * 支持丰富的原子工具操作
 * 集成能力感知的工具调用
 */
export class ToolExecutor {
  private static readonly MAX_OUTPUT_LENGTH = 2000; // Maximum output length in characters
  private static readonly READ_POSITIONS = new Map<string, number>(); // 记录文件读取位置用于 continue_reading
  private static currentCapabilityLevel = CapabilityLevel.STRUCTURAL; // 当前模型的能力等级（可配置）

  /**
   * 危险命令模式列表，AI 生成的命令中包含这些模式时应拦截
   */
  private static readonly DANGEROUS_PATTERNS: RegExp[] = [
    /\brm\s+(-rf?|--recursive\s+--force)\s+\/\s*$/, // rm -rf /
    /\brm\s+-rf?\s+\/\b/, // rm -rf /...
    /\bdd\s+if=\/dev\/zero/, // dd if=/dev/zero
    /\bmkfs\b/, // 格式化文件系统
    />\s*\/dev\/sda/, // 直接写磁盘设备
    />\s*\/dev\/vda/,
    />\s*\/dev\/nvme/,
    /:\(\)\{\s*:\|:\s*&\s*\}\s*;/, // fork bomb
    /\bwget\s+.*\s*\|\s*(sh|bash)\b/i, // wget | sh (远程脚本执行)
    /\bcurl\s+.*\s*\|\s*(sh|bash)\b/i, // curl | sh
    /\bchmod\s+777\s+\/\b/, // chmod 777 /
    /\bchown\s+-R\s+.*\s+\/\b/, // chown -R ... /
    /\bsudo\s+rm\s+-rf\s+\/\b/, // sudo rm -rf /
  ];

  /**
   * 检查命令是否包含危险模式
   */
  private static isDangerousCommand(command: string): { safe: boolean; reason?: string } {
    const trimmed = command.trim();

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { safe: false, reason: `命令匹配危险模式: ${pattern.source}` };
      }
    }

    return { safe: true };
  }

  /**
   * 设置当前能力等级
   */
  static setCapabilityLevel(level: CapabilityLevel): void {
    this.currentCapabilityLevel = level;
  }

  /**
   * 获取当前能力等级
   */
  static getCapabilityLevel(): CapabilityLevel {
    return this.currentCapabilityLevel;
  }

  /**
   * 检查工具是否可以被当前能力等级执行
   */
  static checkToolCapability(toolName: string): { allowed: boolean; required?: CapabilityLevel; current?: CapabilityLevel } {
    const required = getToolCapabilityRequirement(toolName);

    if (required === null) {
      return { allowed: false }; // 工具不存在
    }

    const allowed = canExecuteTool(toolName, this.currentCapabilityLevel);
    return { allowed, required, current: this.currentCapabilityLevel };
  }

  /**
   * 获取指定能力等级下可用的工具列表
   */
  static getAvailableTools(): string[] {
    const tools: string[] = [];
    for (const [name] of Object.entries(TOOL_CAPABILITY_MAP)) {
      if (canExecuteTool(name, this.currentCapabilityLevel)) {
        tools.push(name);
      }
    }
    return tools;
  }

  /**
   * 获取能力等级的可读名称
   */
  private static getCapabilityName(level: CapabilityLevel): string {
    switch (level) {
      case CapabilityLevel.SEMANTIC: return 'SEMANTIC (极致语义)';
      case CapabilityLevel.STRUCTURAL: return 'STRUCTURAL (结构分析)';
      case CapabilityLevel.LINE: return 'LINE (行级分析)';
      case CapabilityLevel.TEXT: return 'TEXT (文本处理)';
      case CapabilityLevel.NONE: return 'NONE (无智能要求)';
      default: return 'UNKNOWN';
    }
  }

  /**
   * 智能截断输出
   * 当输出过长时，返回特殊标记和继续读取的提示
   */
  private static maybeTruncate(output: string, toolName?: string, filePath?: string): string {
    if (output.length <= this.MAX_OUTPUT_LENGTH) {
      return output;
    }

    const truncated = output.slice(0, this.MAX_OUTPUT_LENGTH);
    const remaining = output.length - this.MAX_OUTPUT_LENGTH;

    // 根据工具类型提供不同的建议
    let suggestion = `

[⚠️ OUTPUT TRUNCATED]
输出被截断，还有 ${remaining} 个字符未显示。

`;

    if (toolName === 'read_file' && filePath) {
      // 记录读取位置
      this.READ_POSITIONS.set(filePath, this.MAX_OUTPUT_LENGTH);
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

  static async execute(action: ProposedAction): Promise<ToolExecutionResult> {
    const { type, payload } = action;

    try {
      const result = await this.executeAction(type, payload);

      // 智能截断，提取文件路径用于继续读取
      let filePath: string | undefined;
      if (type === 'tool_call' && payload?.tool_name === 'read_file') {
        filePath = payload?.parameters?.path;
      }

      const truncated = this.maybeTruncate(result.output, type, filePath);

      return {
        ...result,
        output: truncated,
        needsContinue: result.output.length > this.MAX_OUTPUT_LENGTH
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        output: ''
      };
    }
  }

  private static async executeAction(type: string, payload: any): Promise<ToolExecutionResult> {
    switch (type) {
      case 'tool_call':
        return await this.executeTool(payload);

      case 'shell_cmd':
        return await this.executeShell(payload.command);

      case 'code_diff':
        return await this.executeDiff(payload.diff);

      case 'answer':
        return {
          success: true,
          output: payload.content || payload.text || '',
          artifacts: []
        };

      default:
        return {
          success: false,
          error: `Unknown action type: ${type}`,
          output: ''
        };
    }
  }

  private static async executeTool(payload: any): Promise<ToolExecutionResult> {
    const toolName = payload.tool_name;

    // 能力检查：验证工具是否可以被当前能力等级执行
    const capabilityCheck = this.checkToolCapability(toolName);
    if (!capabilityCheck.allowed) {
      if (capabilityCheck.required === undefined) {
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          output: ''
        };
      }
      // 工具存在但当前能力等级不足
      const currentLevel = capabilityCheck.current ?? this.currentCapabilityLevel;
      return {
        success: false,
        error: `Tool "${toolName}" requires ${this.getCapabilityName(capabilityCheck.required)} capability, current is ${this.getCapabilityName(currentLevel)}`,
        output: ''
      };
    }

    switch (toolName) {
      // ===== 基础文件操作 =====
      case 'read_file':
        return await this.toolReadFile(payload.parameters);

      case 'read_file_lines':
        return await this.toolReadFileLines(payload.parameters);

      case 'read_file_lines_from_end':
        return await this.toolReadFileLinesFromEnd(payload.parameters);

      case 'write_file':
        return await this.toolWriteFile(payload.parameters);

      case 'append_file':
        return await this.toolAppendFile(payload.parameters);

      // ===== 文件搜索和列表 =====
      case 'list_files':
        return await this.toolListFiles(payload.parameters);

      case 'list_directory_tree':
        return await this.toolListDirectoryTree(payload.parameters);

      case 'search_in_files':
        return await this.toolSearchInFiles(payload.parameters);

      // ===== 代码分析工具 =====
      case 'search_symbol':
        return await this.toolSearchSymbol(payload.parameters);

      case 'analyze_dependencies':
        return await this.toolAnalyzeDependencies(payload.parameters);

      // ===== Git 操作 =====
      case 'git_status':
        return await this.toolGitStatus(payload.parameters);

      case 'git_diff':
        return await this.toolGitDiff(payload.parameters);

      case 'git_log':
        return await this.toolGitLog(payload.parameters);

      // ===== 上下文管理工具 =====
      case 'continue_reading':
        return await this.toolContinueReading(payload.parameters);

      case 'file_info':
        return await this.toolFileInfo(payload.parameters);

      // ===== 已弃用/未实现 =====
      case 'shell_cmd':
        // 兼容 AI 将 shell_cmd 作为 tool_call 发送的情况
        return await this.executeShell(payload.parameters?.command || payload.command || '');

      case 'web_search':
        return {
          success: false,
          error: 'web_search not implemented yet',
          output: ''
        };

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          output: ''
        };
    }
  }

  private static async toolReadFile(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        output: content,
        artifacts: [filePath]
      };
    } catch (error: any) {
      const friendly = this.getFriendlyError('read_file', error);
      return {
        success: false,
        error: friendly.message,
        output: friendly.suggestion
      };
    }
  }

  private static async toolWriteFile(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    const content = params.content;
    
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return {
        success: true,
        output: `Successfully wrote ${filePath}`,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  private static async toolListFiles(params: any): Promise<ToolExecutionResult> {
    const dirPath = params.path || '.';
    const recursive = params.recursive || false;
    
    try {
      const files = await this.getFiles(dirPath, recursive);
      return {
        success: true,
        output: JSON.stringify(files, null, 2),
        artifacts: files.map(f => f.path)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  private static async getFiles(dir: string, recursive: boolean): Promise<Array<{ path: string; type: string }>> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: Array<{ path: string; type: string }> = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push({ path: fullPath, type: 'directory' });
        if (recursive) {
          const subFiles = await this.getFiles(fullPath, recursive);
          files.push(...subFiles);
        }
      } else {
        files.push({ path: fullPath, type: 'file' });
      }
    }

    return files;
  }

  private static async executeShell(command: string): Promise<ToolExecutionResult> {
    // 安全检查：拦截明显危险的命令
    const safetyCheck = this.isDangerousCommand(command);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: `安全拦截: ${safetyCheck.reason}`,
        output: ''
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      const output = stdout || stderr || '';
      
      return {
        success: true,
        output,
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  private static async executeDiff(diff: string): Promise<ToolExecutionResult> {
    try {
      const tempFile = path.join(process.cwd(), '.yuangs_temp.patch');
      await fs.writeFile(tempFile, diff, 'utf-8');

      await execAsync(`git apply --check ${tempFile}`, {
        cwd: process.cwd()
      });

      const { stdout: applyOutput } = await execAsync(`git apply ${tempFile}`, {
        cwd: process.cwd()
      });

      await fs.unlink(tempFile);

      return {
        success: true,
        output: applyOutput || 'Diff applied successfully',
        artifacts: ['.yuangs_temp.patch']
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || 'Failed to apply diff'
      };
    }
  }

  // ===== 新增工具方法实现 =====

  /**
   * 读取文件的指定行范围
   */
  private static async toolReadFileLines(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    const startLine = params.start_line || 1;
    const endLine = params.end_line;
    const encoding = params.encoding || 'utf-8';

    try {
      const content = await fs.readFile(filePath, encoding);
      const lines = String(content).split('\n');

      const startIndex = Math.max(0, startLine - 1);
      const endIndex = endLine ? Math.min(lines.length, endLine) : lines.length;

      if (startIndex >= lines.length) {
        return {
          success: false,
          error: `起始行号 ${startLine} 超出文件范围（文件共 ${lines.length} 行）`,
          output: ''
        };
      }

      const selectedLines = lines.slice(startIndex, endIndex);
      const result = selectedLines
        .map((line: string, idx: number) => `${startIndex + idx + 1}: ${line}`)
        .join('\n');

      return {
        success: true,
        output: result,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 从文件末尾读取指定行数（倒数行）
   * 例如：count=5 表示读取最后5行，count=5, start_offset=2 表示读取倒数第2到5行
   */
  private static async toolReadFileLinesFromEnd(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    const count = params.count || 10;  // 要读取的行数
    const startOffset = params.start_offset || 0;  // 从倒数第几行开始（0表示从最后一行开始）
    const encoding = params.encoding || 'utf-8';

    try {
      const content = await fs.readFile(filePath, encoding);
      const lines = String(content).split('\n');
      const totalLines = lines.length;

      // 计算实际行号
      // startOffset=0 表示从最后一行开始，所以是倒数第 count 行
      // startOffset=2 表示从倒数第 count+2 行开始
      const startIndex = Math.max(0, totalLines - count - startOffset);
      const endIndex = totalLines;

      if (totalLines === 0) {
        return {
          success: true,
          output: '(空文件)',
          artifacts: [filePath]
        };
      }

      const selectedLines = lines.slice(startIndex, endIndex);
      const result = selectedLines
        .map((line: string, idx: number) => `${startIndex + idx + 1}: ${line}`)
        .join('\n');

      return {
        success: true,
        output: result,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 向文件末尾追加内容
   */
  private static async toolAppendFile(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    const content = params.content;
    const encoding = params.encoding || 'utf-8';

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.appendFile(filePath, content, encoding);
      return {
        success: true,
        output: `Successfully appended to ${filePath}`,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 生成目录结构的树形展示
   */
  private static async toolListDirectoryTree(params: any): Promise<ToolExecutionResult> {
    const dirPath = params.path || '.';
    const maxDepth = params.max_depth || 3;
    const includeFiles = params.include_files !== false;
    const excludePatterns = params.exclude_patterns || ['node_modules', '.git', 'dist', 'build'];

    try {
      const tree = await this.buildDirectoryTree(dirPath, maxDepth, includeFiles, excludePatterns, 0);
      return {
        success: true,
        output: tree,
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  private static async buildDirectoryTree(
    dirPath: string,
    maxDepth: number,
    includeFiles: boolean,
    excludePatterns: string[],
    currentDepth: number
  ): Promise<string> {
    if (currentDepth >= maxDepth) return '';

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const lines: string[] = [];
    const isLast = (index: number) => index === entries.length - 1;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const fullName = entry.name;

      // 跳过排除的目录/文件
      if (excludePatterns.some(pattern => fullName.includes(pattern))) {
        continue;
      }

      const prefix = currentDepth === 0 ? '' : '│   '.repeat(currentDepth);
      const connector = isLast(i) ? '└── ' : '├── ';

      if (entry.isDirectory()) {
        lines.push(`${prefix}${connector}${fullName}/`);
        const subTree = await this.buildDirectoryTree(
          path.join(dirPath, fullName),
          maxDepth,
          includeFiles,
          excludePatterns,
          currentDepth + 1
        );
        if (subTree) {
          lines.push(subTree);
        }
      } else if (includeFiles) {
        lines.push(`${prefix}${connector}${fullName}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 在文件中搜索指定内容（类似 grep）
   */
  private static async toolSearchInFiles(params: any): Promise<ToolExecutionResult> {
    const pattern = params.pattern;
    const searchPath = params.path || '.';
    const filePattern = params.file_pattern;
    const ignoreCase = params.ignore_case || false;
    const contextLines = params.context_lines || 0;
    const maxResults = params.max_results || 100;

    try {
      // 如果指定了文件模式，使用 find + grep 组合，否则直接用 grep
      let baseCmd = 'grep';

      // 构建 grep 命令
      if (ignoreCase) baseCmd += ' -i';
      baseCmd += ' -r';
      if (contextLines > 0) baseCmd += ` -C ${contextLines}`;
      baseCmd += ` -n`; // 显示行号

      // 转义 pattern
      const escapedPattern = pattern.replace(/'/g, "'\\''");

      let grepCmd: string;
      if (filePattern) {
        // 使用 find 过滤文件，然后 grep，最后用 head 限制结果
        grepCmd = `find ${searchPath} -type f -name '${filePattern}' -exec grep ${ignoreCase ? '-i' : ''} -n -- '${escapedPattern}' {} + 2>/dev/null | head -n ${maxResults}`;
      } else {
        // 直接 grep，用 head 限制结果
        grepCmd = `${baseCmd} -- '${escapedPattern}' ${searchPath} 2>/dev/null | head -n ${maxResults}`;
      }

      // 执行搜索，使用更大的 buffer
      const { stdout } = await execAsync(grepCmd, {
        maxBuffer: 50 * 1024 * 1024, // 50MB
        cwd: process.cwd(),
        shell: '/bin/bash'
      });

      const output = String(stdout).trim();
      const lines = output.split('\n').filter(line => line.trim());

      // 检查是否达到限制
      const hasMore = lines.length >= maxResults;
      const resultOutput = lines.length > 0
        ? lines.join('\n') + (hasMore ? `\n\n[⚠️] 结果已限制为前 ${maxResults} 条匹配，使用更大的 max_results 参数获取更多结果` : '')
        : '未找到匹配结果';

      return {
        success: true,
        output: resultOutput,
        artifacts: []
      };
    } catch (error: any) {
      // grep 没有找到结果时会返回错误码
      if (error.code === 1) {
        return {
          success: true,
          output: '未找到匹配结果',
          artifacts: []
        };
      }
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 搜索代码符号（函数、类、变量等）
   * 使用 grep 进行简化搜索
   */
  private static async toolSearchSymbol(params: any): Promise<ToolExecutionResult> {
    const symbol = params.symbol;
    const symbolType = params.symbol_type;
    const searchPath = params.path || '.';
    const filePattern = params.file_pattern;

    try {
      let pattern = symbol;

      // 根据符号类型构建搜索模式
      switch (symbolType) {
        case 'function':
          pattern = `function\\s+${symbol}|${symbol}\\s*[:=]\\s*function|const\\s+${symbol}\\s*=`;
          break;
        case 'class':
          pattern = `class\\s+${symbol}`;
          break;
        case 'interface':
          pattern = `interface\\s+${symbol}`;
          break;
        default:
          pattern = symbol;
      }

      let grepCmd = `grep -rn --color=never -E "${pattern}" ${searchPath}`;

      if (filePattern) {
        grepCmd += ` --include="${filePattern}"`;
      }

      const { stdout } = await execAsync(grepCmd, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      if (!stdout.trim()) {
        return {
          success: true,
          output: `未找到符号 "${symbol}"`,
          artifacts: []
        };
      }

      return {
        success: true,
        output: stdout,
        artifacts: []
      };
    } catch (error: any) {
      if (error.code === 1) {
        return {
          success: true,
          output: `未找到符号 "${symbol}"`,
          artifacts: []
        };
      }
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 分析文件的依赖关系（import/require）
   */
  private static async toolAnalyzeDependencies(params: any): Promise<ToolExecutionResult> {
    const targetPath = params.path;
    // recursive 参数保留用于未来扩展
    params.recursive;

    try {
      const stat = await fs.stat(targetPath);
      let files: string[] = [];

      if (stat.isFile()) {
        files = [targetPath];
      } else if (stat.isDirectory()) {
        // 获取目录下所有文件
        const allFiles = await this.getFiles(targetPath, true);
        files = allFiles
          .filter(f => f.type === 'file')
          .filter(f => /\.(ts|js|tsx|jsx|vue|svelte)$/.test(f.path))
          .map(f => f.path);
      }

      const dependencies: Record<string, string[]> = {};

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const deps: string[] = [];

        // 匹配 ES6 imports
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          deps.push(match[1]);
        }

        // 匹配 CommonJS requires
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
          deps.push(match[1]);
        }

        // 匹配动态 imports
        const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
          deps.push(match[1]);
        }

        if (deps.length > 0) {
          dependencies[file] = [...new Set(deps)]; // 去重
        }
      }

      // 格式化输出
      let output = '依赖关系分析结果：\n\n';
      for (const [file, deps] of Object.entries(dependencies)) {
        output += `${file}:\n`;
        for (const dep of deps) {
          output += `  - ${dep}\n`;
        }
        output += '\n';
      }

      return {
        success: true,
        output: output || '未找到依赖关系',
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * Git 状态
   */
  private static async toolGitStatus(params: any): Promise<ToolExecutionResult> {
    const repoPath = params.path || '.';

    try {
      const { stdout } = await execAsync(`git -C ${repoPath} status --porcelain -b`, {
        cwd: process.cwd()
      });

      const { stdout: branchInfo } = await execAsync(`git -C ${repoPath} branch --show-current`, {
        cwd: process.cwd()
      });

      let output = `当前分支: ${branchInfo.trim()}\n\n`;

      if (!stdout.trim()) {
        output += '工作区干净，没有未提交的更改';
      } else {
        output += '未提交的更改:\n';
        output += stdout;
      }

      return {
        success: true,
        output,
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: '不是 Git 仓库或 Git 命令执行失败'
      };
    }
  }

  /**
   * Git 差异
   */
  private static async toolGitDiff(params: any): Promise<ToolExecutionResult> {
    const filePath = params.file;
    const cached = params.cached || false;
    const lines = params.lines;

    try {
      let cmd = 'git diff';
      if (cached) cmd += ' --cached';
      if (filePath) cmd += ` -- ${filePath}`;
      if (lines) cmd += ` | head -n ${lines}`;

      const { stdout } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      if (!stdout.trim()) {
        return {
          success: true,
          output: filePath ? `文件 ${filePath} 没有更改` : '没有更改',
          artifacts: []
        };
      }

      return {
        success: true,
        output: stdout,
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * Git 日志
   */
  private static async toolGitLog(params: any): Promise<ToolExecutionResult> {
    const maxCount = params.max_count || 10;
    const filePath = params.file;
    const oneline = params.oneline !== false;

    try {
      let cmd = `git log -n ${maxCount}`;
      if (oneline) cmd += ' --oneline';
      if (filePath) cmd += ` -- ${filePath}`;

      const { stdout } = await execAsync(cmd, {
        cwd: process.cwd()
      });

      return {
        success: true,
        output: stdout || '没有提交历史',
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 继续读取之前被截断的文件内容
   */
  private static async toolContinueReading(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    const fromPosition = params.from_position;
    const length = params.length || this.MAX_OUTPUT_LENGTH;

    try {
      let startPos = fromPosition;

      // 如果没有指定位置，尝试从记录中获取
      if (startPos === undefined) {
        startPos = this.READ_POSITIONS.get(filePath) || this.MAX_OUTPUT_LENGTH;
      }

      const content = await fs.readFile(filePath, 'utf-8');

      if (startPos >= content.length) {
        return {
          success: true,
          output: '[EOF] 已到达文件末尾',
          artifacts: []
        };
      }

      const endPos = Math.min(startPos + length, content.length);
      const result = content.slice(startPos, endPos);

      // 更新读取位置
      this.READ_POSITIONS.set(filePath, endPos);

      const prefix = `[从位置 ${startPos} 读取，共 ${result.length} 字符]\n\n`;
      const remaining = content.length - endPos;

      let suffix = '';
      if (remaining > 0) {
        suffix = `\n\n[还有 ${remaining} 字符未读取，使用 continue_reading 继续]`;
        this.READ_POSITIONS.set(filePath, endPos);
      } else {
        this.READ_POSITIONS.delete(filePath); // 到达末尾，清除记录
      }

      return {
        success: true,
        output: prefix + result + suffix,
        readPosition: endPos,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 获取文件元信息
   */
  private static async toolFileInfo(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;

    try {
      const stat = await fs.stat(filePath);
      const info = {
        path: filePath,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        sizeHuman: this.formatBytes(stat.size),
        modified: stat.mtime.toISOString(),
        created: stat.birthtime.toISOString(),
        permissions: stat.mode.toString(8),
        isReadable: !!(stat.mode & parseInt('0400', 8)), // 检查读权限
        isWritable: !!(stat.mode & parseInt('0200', 8))  // 检查写权限
      };

      return {
        success: true,
        output: JSON.stringify(info, null, 2),
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * 格式化字节数
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 获取用户友好的错误消息和建议
   */
  private static getFriendlyError(toolName: string, error: any): { message: string; suggestion: string } {
    const errorMsg = error?.message || String(error);
    const lowerError = errorMsg.toLowerCase();

    // 文件不存在
    if (lowerError.includes('enoent') || lowerError.includes('no such file') || lowerError.includes('not found')) {
      const match = errorMsg.match(/['"](.*?)['"]|['`](.*?)['`]/);
      const fileName = match ? match[1] : '指定文件';
      return {
        message: `文件未找到: ${fileName}`,
        suggestion: `💡 建议：使用 list_files 查看可用文件，或检查文件路径是否正确`
      };
    }

    // 权限错误
    if (lowerError.includes('eacces') || lowerError.includes('permission denied')) {
      return {
        message: `权限不足：无法访问该文件`,
        suggestion: `💡 建议：检查文件权限，或使用 sudo（如果适用）`
      };
    }

    // 语法错误
    if (lowerError.includes('syntax') || lowerError.includes('parse')) {
      return {
        message: `命令语法错误`,
        suggestion: `💡 建议：检查命令格式，参考工具文档`
      };
    }

    // 根据工具名称提供特定建议
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
}
