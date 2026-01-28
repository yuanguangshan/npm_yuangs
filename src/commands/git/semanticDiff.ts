import { Command } from 'commander';
import chalk from 'chalk';
import { GitService } from '../../core/git/GitService';
import { CLIComponent } from '../../utils/CLIComponent';
import { ChangeType, SemanticCategory } from '../../core/git/semantic/types';

export function registerSemanticDiffCommand(gitCmd: Command) {
    gitCmd
        .command('diff-semantic')
        .alias('sd')
        .description('分析 Git 变更的语义级别差异 (函数/类/接口)')
        .option('-u, --unstaged', '分析未暂存的变更')
        .action(async (options) => {
            const gitService = new GitService();
            const staged = !options.unstaged;

            try {
                const result = await gitService.getSemanticDiff(staged);

                if (!result || result.files.length === 0) {
                    console.log(chalk.yellow('没有检测到显著的语义变更 (仅有普通代码行修改)'));
                    return;
                }

                console.log(chalk.bold.cyan(`\n📊 语义级 Diff 分析结果 (${staged ? '已暂存' : '未暂存'})\n`));
                console.log(chalk.gray(result.overallSummary + '\n'));

                for (const file of result.files) {
                    if (file.changes.length === 0) continue;

                    const width = CLIComponent.getTerminalWidth();
                    console.log(chalk.white('📁 ' + chalk.bold(file.path)));
                    console.log(chalk.gray('─'.repeat(Math.min(width, 60))));

                    for (const change of file.changes) {
                        const icon = change.type === ChangeType.ADDITION ? chalk.green('+') : chalk.red('-');
                        const category = chalk.blue(`[${change.category.toUpperCase()}]`);
                        const breaking = change.isBreaking ? chalk.bgRed.white(' BREAKING ') + ' ' : '';

                        console.log(`  ${icon} ${breaking}${category} ${chalk.white(change.name)}`);
                    }
                    console.log('');
                }

                if (result.isBreaking) {
                    console.log(chalk.bgRed.white.bold(' 🚨 检测到破坏性变更，请在提交前仔细检查！ '));
                }

            } catch (error: any) {
                console.error(chalk.red(`执行失败: ${error.message}`));
            }
        });
}
