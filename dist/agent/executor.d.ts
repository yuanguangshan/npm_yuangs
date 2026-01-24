import { ProposedAction, ToolExecutionResult } from './state';
export declare class ToolExecutor {
    private static readonly MAX_OUTPUT_LENGTH;
    /**
     * Truncates output if too long and adds helpful suggestions
     */
    private static maybeTruncate;
    static execute(action: ProposedAction): Promise<ToolExecutionResult>;
    private static executeAction;
    private static executeTool;
    private static toolReadFile;
    private static toolWriteFile;
    private static toolListFiles;
    private static getFiles;
    private static executeShell;
    private static executeDiff;
}
