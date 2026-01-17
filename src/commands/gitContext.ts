import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function run(cmd: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 });
        return stdout.trim() || null;
    } catch {
        return null;
    }
}

export async function getGitContext() {
    const staged = await run('git diff --staged');
    const unstaged = await run('git diff');

    if (!staged && !unstaged) return null;

    let result = `以下是 Git 变更内容：\n`;

    if (staged) {
        result += `\n【已暂存】\n\`\`\`diff\n${staged}\n\`\`\`\n`;
    }

    if (unstaged) {
        result += `\n【未暂存】\n\`\`\`diff\n${unstaged}\n\`\`\`\n`;
    }

    return result;
}
