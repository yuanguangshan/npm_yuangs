export declare function handleAICommand(userInput: string, options: {
    execute: boolean;
    model?: string;
    dryRun?: boolean;
    autoYes?: boolean;
}): Promise<import("../core/executor").ExecResult | undefined>;
