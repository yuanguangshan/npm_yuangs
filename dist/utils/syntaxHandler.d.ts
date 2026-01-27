export declare function handleSpecialSyntax(input: string, stdinData?: string): Promise<{
    processed: boolean;
    result?: string;
    isPureReference?: boolean;
    error?: boolean;
    itemCount?: number;
    type?: 'file' | 'directory' | 'command' | 'management';
}>;
