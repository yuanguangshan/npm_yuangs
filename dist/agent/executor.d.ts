import { ProposedAction, ToolExecutionResult } from './state';
import { CapabilityLevel } from '../core/capability/CapabilityLevel';
import { ToolRegistry } from './tools';
/**
 * ToolExecutor — thin facade over ToolRegistry.
 * Maintains backward compatibility for existing callers (AgentRuntime, DualAgentRuntime).
 */
export declare class ToolExecutor {
    private static readonly MAX_OUTPUT_LENGTH;
    private static currentCapabilityLevel;
    private static allowedCwd;
    /**
     * Expose the registry for external registration of custom tools.
     */
    static getRegistry(): ToolRegistry;
    static setAllowedCwd(cwd: string): void;
    static getAllowedCwd(): string;
    private static analyzeCommandSafety;
    static setCapabilityLevel(level: CapabilityLevel): void;
    static getCapabilityLevel(): CapabilityLevel;
    static checkToolCapability(toolName: string): {
        allowed: boolean;
        required?: CapabilityLevel;
        current?: CapabilityLevel;
    };
    static getAvailableTools(): string[];
    private static getCapabilityName;
    static execute(action: ProposedAction): Promise<ToolExecutionResult>;
    private static executeAction;
    private static executeTool;
    /**
     * Execute shell command — delegates to ShellCmd tool but retains
     * the command safety analysis that was part of the original executor.
     */
    private static executeShell;
    /**
     * Execute diff — delegates to CodeDiff tool.
     */
    private static executeDiff;
    private static maybeTruncate;
}
