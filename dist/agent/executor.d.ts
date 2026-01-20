export declare class ToolExecutor {
    static execute(action: {
        type: string;
        payload: any;
    }): Promise<{
        success: boolean;
        output: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        output?: undefined;
    }>;
}
