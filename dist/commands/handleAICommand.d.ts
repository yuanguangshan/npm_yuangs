export declare function handleAICommand(userInput: string, options: {
    execute: boolean;
    model?: string;
}): Promise<import("../core/executor").ExecResult | undefined>;
