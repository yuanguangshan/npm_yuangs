import { Command } from 'commander';
import chalk from 'chalk';
import { GitService } from '../../core/git/GitService';

export function registerStatusCommand(gitCmd: Command) {
    // git status - 增强的状态显示
    gitCmd
        .command('status')
        .description('显示增强的 Git 状态信息')
        .action(async () => {
            try {
                const gitService = new GitService();

                if (!(await gitService.isGitRepository())) {
                    console.log(chalk.red('当前目录不是 Git 仓库'));
                    return;
                }

                const [branchInfo, statusSummary, recentCommits] = await Promise.all([
                    gitService.getBranchInfo(),
                    gitService.getStatusSummary(),
                    gitService.getRecentCommits(5),
                ]);

                console.log(chalk.bold.cyan('\n📊 Git 状态\n'));

                // 分支信息
                console.log(chalk.bold('🌿 分支:'));
                console.log(chalk.white(`  当前: ${branchInfo.current}`));
                if (branchInfo.upstream) {
                    console.log(chalk.gray(`  上游: ${branchInfo.upstream}`));
                    if (branchInfo.ahead > 0) {
                        console.log(chalk.green(`  ↑ 领先 ${branchInfo.ahead} 个提交`));
                    }
                    if (branchInfo.behind > 0) {
                        console.log(chalk.yellow(`  ↓ 落后 ${branchInfo.behind} 个提交`));
                    }
                }
                console.log();

                // 变更统计
                console.log(chalk.bold('📝 变更:'));
                if (statusSummary.modified > 0) {
                    console.log(chalk.yellow(`  修改: ${statusSummary.modified} 个文件`));
                }
                if (statusSummary.added > 0) {
                    console.log(chalk.green(`  新增: ${statusSummary.added} 个文件`));
                }
                if (statusSummary.deleted > 0) {
                    console.log(chalk.red(`  删除: ${statusSummary.deleted} 个文件`));
                }
                if (statusSummary.untracked > 0) {
                    console.log(chalk.gray(`  未跟踪: ${statusSummary.untracked} 个文件`));
                }
                if (Object.values(statusSummary).every(v => v === 0)) {
                    console.log(chalk.green('  工作区干净'));
                }
                console.log();

                // 最近提交
                if (recentCommits.length > 0) {
                    console.log(chalk.bold('📜 最近提交:\n'));
                    for (const commit of recentCommits) {
                        console.log(chalk.gray(`  ${commit.hash.substring(0, 7)}`), chalk.white(commit.message));
                        console.log(chalk.gray(`    ${commit.author} · ${new Date(commit.date).toLocaleString()}`));
                    }
                    console.log();
                }
            } catch (error: any) {
                console.error(chalk.red(`错误: ${error.message}`));
                process.exit(1);
            }
        });
}
