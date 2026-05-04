"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const toolCapability_1 = require("./toolCapability");
const CapabilityLevel_1 = require("../core/capability/CapabilityLevel");
const commandSemantics_1 = require("./commandSemantics");
const tools_1 = require("./tools");
// Initialize registry with all built-in tools
const registry = new tools_1.ToolRegistry();
registry.registerAll([
    new tools_1.ReadFile(),
    new tools_1.ReadFileLines(),
    new tools_1.ReadFileLinesFromEnd(),
    new tools_1.WriteFile(),
    new tools_1.AppendFile(),
    new tools_1.FileInfo(),
    new tools_1.ContinueReading(),
    new tools_1.ListFiles(),
    new tools_1.ListDirectoryTree(),
    new tools_1.SearchInFiles(),
    new tools_1.SearchSymbol(),
    new tools_1.AnalyzeDependencies(),
    new tools_1.GitStatus(),
    new tools_1.GitDiff(),
    new tools_1.GitLog(),
    new tools_1.ShellCmd(),
    new tools_1.CodeDiff(),
]);
/**
 * ToolExecutor — thin facade over ToolRegistry.
 * Maintains backward compatibility for existing callers (AgentRuntime, DualAgentRuntime).
 */
class ToolExecutor {
    static MAX_OUTPUT_LENGTH = 2000;
    static currentCapabilityLevel = CapabilityLevel_1.CapabilityLevel.STRUCTURAL;
    static allowedCwd = process.cwd();
    /**
     * Expose the registry for external registration of custom tools.
     */
    static getRegistry() {
        return registry;
    }
    static setAllowedCwd(cwd) {
        this.allowedCwd = cwd;
    }
    static getAllowedCwd() {
        return this.allowedCwd;
    }
    static analyzeCommandSafety(command) {
        return (0, commandSemantics_1.analyzeCommand)(command, this.allowedCwd);
    }
    static setCapabilityLevel(level) {
        this.currentCapabilityLevel = level;
    }
    static getCapabilityLevel() {
        return this.currentCapabilityLevel;
    }
    static checkToolCapability(toolName) {
        const required = (0, toolCapability_1.getToolCapabilityRequirement)(toolName);
        if (required === null) {
            return { allowed: false };
        }
        const allowed = (0, toolCapability_1.canExecuteTool)(toolName, this.currentCapabilityLevel);
        return { allowed, required, current: this.currentCapabilityLevel };
    }
    static getAvailableTools() {
        const tools = [];
        for (const [name] of Object.entries(toolCapability_1.TOOL_CAPABILITY_MAP)) {
            if ((0, toolCapability_1.canExecuteTool)(name, this.currentCapabilityLevel)) {
                tools.push(name);
            }
        }
        return tools;
    }
    static getCapabilityName(level) {
        switch (level) {
            case CapabilityLevel_1.CapabilityLevel.SEMANTIC: return 'SEMANTIC (极致语义)';
            case CapabilityLevel_1.CapabilityLevel.STRUCTURAL: return 'STRUCTURAL (结构分析)';
            case CapabilityLevel_1.CapabilityLevel.LINE: return 'LINE (行级分析)';
            case CapabilityLevel_1.CapabilityLevel.TEXT: return 'TEXT (文本处理)';
            case CapabilityLevel_1.CapabilityLevel.NONE: return 'NONE (无智能要求)';
            default: return 'UNKNOWN';
        }
    }
    static async execute(action) {
        const { type, payload } = action;
        try {
            const result = await this.executeAction(type, payload);
            const truncated = this.maybeTruncate(result);
            return {
                ...result,
                output: truncated,
                needsContinue: result.output.length > this.MAX_OUTPUT_LENGTH
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || String(error),
                output: ''
            };
        }
    }
    static async executeAction(type, payload) {
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
    static async executeTool(payload) {
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
    static async executeShell(command) {
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
    static async executeDiff(diff) {
        const codeDiff = registry.get('code_diff');
        if (!codeDiff) {
            return { success: false, error: 'code_diff tool not found', output: '' };
        }
        return await codeDiff.execute({ diff });
    }
    static maybeTruncate(result) {
        return (0, tools_1.maybeTruncateOutput)(result.output, undefined, undefined);
    }
}
exports.ToolExecutor = ToolExecutor;
//# sourceMappingURL=executor.js.map