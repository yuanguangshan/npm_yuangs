import * as readline from 'node:readline/promises';
import chalk from 'chalk';

export async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false, // 禁用终端特性以避免与外部 readline 接口冲突
    });

    try {
        const answer = await rl.question(chalk.yellow(`\n⚠️  ${message} (y/N) `));
        return answer.toLowerCase() === 'y';
    } finally {
        rl.close();
    }
}

