import { spawn } from 'child_process';

export type ExecResult = {
    stdout: string;
    stderr: string;
    code: number | null;
};

export async function exec(command: string): Promise<ExecResult> {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        // Using shell: true to support things like pipes
        const child = spawn(command, [], { shell: true });

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });

        child.on('close', (code) => {
            resolve({ stdout, stderr, code });
        });

        child.on('error', (err) => {
            stderr += err.message;
            resolve({ stdout, stderr, code: 1 });
        });
    });
}
