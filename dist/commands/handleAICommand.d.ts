export declare function handleAICommand(userInput: string, options: {
    execute: boolean;
    model?: string;
    dryRun?: boolean;
    autoYes?: boolean;
    verbose?: boolean;
}): Promise<{
    code: number | null;
    stdout?: string;
    stderr?: string;
}>;
