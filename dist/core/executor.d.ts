export type ExecResult = {
    stdout: string;
    stderr: string;
    code: number | null;
};
export declare function exec(command: string): Promise<ExecResult>;
