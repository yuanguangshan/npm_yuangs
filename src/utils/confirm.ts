import readline from 'readline';
import chalk from 'chalk';

export async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(chalk.yellow(`\n⚠️  ${message} (y/N) `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}
