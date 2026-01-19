import { ProposedAction, ToolExecutionResult } from './state';
export declare class ToolExecutor {
    static execute(action: ProposedAction): Promise<ToolExecutionResult>;
    private static executeTool;
    private static toolReadFile;
    private static toolWriteFile;
    private static toolListFiles;
    private static getFiles;
    private static executeShell;
    private static executeDiff;
}
