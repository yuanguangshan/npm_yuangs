import * as readline from 'node:readline/promises';
import chalk from 'chalk';

/**
 * 向用户请求确认。
 *
 * 三种模式：
 *  1. YUANGS_NO_CONFIRM=1 环境变量 → 自动放行（CI/CD、自动化脚本）
 *  2. 非 TTY（stdin 管道/重定向）→ 自动放行 + 警告
 *  3. 交互式 TTY → readline 提示 y/N
 */
export async function confirm(message: string): Promise<boolean> {
    // 模式 1：环境变量强制跳过确认
    if (process.env.YUANGS_NO_CONFIRM === '1' || process.env.YUANGS_NO_CONFIRM === 'true') {
        console.log(chalk.gray(`⚠️  ${message} → 自动确认 (YUANGS_NO_CONFIRM=1)`));
        return true;
    }

    // 模式 2：非交互式环境（无 TTY），自动放行避免挂起
    if (!process.stdin.isTTY) {
        console.log(chalk.gray(`⚠️  ${message} → 自动确认 (非交互模式, 无 TTY)`));
        return true;
    }

    // 模式 3：交互式终端，正常提示
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
