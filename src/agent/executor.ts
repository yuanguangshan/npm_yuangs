import { ProposedAction, ToolExecutionResult } from './state';
import { TOOL_CAPABILITY_MAP, canExecuteTool, getToolCapabilityRequirement } from './toolCapability';
import { CapabilityLevel } from '../core/capability/CapabilityLevel';
import { analyzeCommand, type CommandAnalysis } from './commandSemantics';
import {
  ToolRegistry,
  ReadFile, ReadFileLines, ReadFileLinesFromEnd,
  WriteFile, AppendFile, FileInfo, ContinueReading,
  ListFiles, ListDirectoryTree,
  SearchInFiles, SearchSymbol, AnalyzeDependencies,
  GitStatus, GitDiff, GitLog,
  ShellCmd, CodeDiff,
  maybeTruncateOutput, getFriendlyError
} from './tools';

// Initialize registry with all built-in tools
const registry = new ToolRegistry();
registry.registerAll([
  new ReadFile(),
  new ReadFileLines(),
  new ReadFileLinesFromEnd(),
  new WriteFile(),
  new AppendFile(),
  new FileInfo(),
  new ContinueReading(),
  new ListFiles(),
  new ListDirectoryTree(),
  new SearchInFiles(),
  new SearchSymbol(),
  new AnalyzeDependencies(),
  new GitStatus(),
  new GitDiff(),
  new GitLog(),
  new ShellCmd(),
  new CodeDiff(),
]);

/**
 * ToolExecutor — thin facade over ToolRegistry.
 * Maintains backward compatibility for existing callers (AgentRuntime, DualAgentRuntime).
 */
export class ToolExecutor {
  private static readonly MAX_OUTPUT_LENGTH = 2000;
  private static currentCapabilityLevel = CapabilityLevel.STRUCTURAL;
  private static allowedCwd: string = process.cwd();

  /**
   * Expose the registry for external registration of custom tools.
   */
  static getRegistry(): ToolRegistry {
    return registry;
  }

  static setAllowedCwd(cwd: string): void {
    this.allowedCwd = cwd;
  }

  static getAllowedCwd(): string {
    return this.allowedCwd;
  }

  private static analyzeCommandSafety(command: string): CommandAnalysis {
    return analyzeCommand(command, this.allowedCwd);
  }

  static setCapabilityLevel(level: CapabilityLevel): void {
    this.currentCapabilityLevel = level;
  }

  static getCapabilityLevel(): CapabilityLevel {
    return this.currentCapabilityLevel;
  }

  static checkToolCapability(toolName: string): { allowed: boolean; required?: CapabilityLevel; current?: CapabilityLevel } {
    const required = getToolCapabilityRequirement(toolName);
    if (required === null) {
      return { allowed: false };
    }
    const allowed = canExecuteTool(toolName, this.currentCapabilityLevel);
    return { allowed, required, current: this.currentCapabilityLevel };
  }

  static getAvailableTools(): string[] {
    const tools: string[] = [];
    for (const [name] of Object.entries(TOOL_CAPABILITY_MAP)) {
      if (canExecuteTool(name, this.currentCapabilityLevel)) {
        tools.push(name);
      }
    }
    return tools;
  }

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

  static async execute(action: ProposedAction): Promise<ToolExecutionResult> {
    const { type, payload } = action;

    try {
      const result = await this.executeAction(type, payload);
      const truncated = this.maybeTruncate(result);
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

    // Capability check
    const capabilityCheck = this.checkToolCapability(toolName);
    if (!capabilityCheck.allowed) {
      if (capabilityCheck.required === undefined) {
        return { success: false, error: `Unknown tool: ${toolName}`, output: '' };
      }
      const currentLevel = capabilityCheck.current ?? this.currentCapabilityLevel;
      return {
        success: false,
        error: `Tool "${toolName}" requires ${this.getCapabilityName(capabilityCheck.required)} capability, current is ${this.getCapabilityName(currentLevel)}`,
        output: ''
      };
    }

    const tool = registry.get(toolName);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${toolName}`, output: '' };
    }

    return await tool.execute(payload.parameters);
  }

  /**
   * Execute shell command — delegates to ShellCmd tool but retains
   * the command safety analysis that was part of the original executor.
   */
  private static async executeShell(command: string): Promise<ToolExecutionResult> {
    const analysis = this.analyzeCommandSafety(command);
    if (analysis.category === 'DANGEROUS') {
      return { success: false, error: analysis.description, output: '' };
    }

    const shellCmd = registry.get('shell_cmd');
    if (!shellCmd) {
      return { success: false, error: 'shell_cmd tool not found', output: '' };
    }
    return await shellCmd.execute({ command });
  }

  /**
   * Execute diff — delegates to CodeDiff tool.
   */
  private static async executeDiff(diff: string): Promise<ToolExecutionResult> {
    const codeDiff = registry.get('code_diff');
    if (!codeDiff) {
      return { success: false, error: 'code_diff tool not found', output: '' };
    }
    return await codeDiff.execute({ diff });
  }

  private static maybeTruncate(result: ToolExecutionResult): string {
    return maybeTruncateOutput(result.output, undefined, undefined);
  }
}
