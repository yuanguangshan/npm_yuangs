import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../../core/git/GitService';
import { CommitMessageGenerator } from '../../core/git/CommitMessageGenerator';
import { getRouter } from '../../core/modelRouter';

export function registerCommitCommand(gitCmd: Command) {
    // git commit - 智能生成 commit message
    gitCmd
        .command('commit')
        .description('智能生成 commit message 并提交')
        .option('-a, --all', '暂存所有变更')
        .option('-d, --detailed', '生成详细的 commit message')
        .option('-t, --type <type>', '指定 commit 类型 (feat/fix/docs/etc)')
        .option('-s, --scope <scope>', '指定影响范围')
        .option('--dry-run', '只生成 message,不实际提交')
        .option('--no-ai', '不使用 AI,使用规则生成')
        .action(async (options) => {
            const spinner = ora('初始化 Git 服务...').start();

            try {
                const gitService = new GitService();

                // 检查是否在 Git 仓库中
                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                // 检查是否有变更
                const diff = await gitService.getDiff();
                if (!diff.staged && !diff.unstaged) {
                    spinner.fail('没有可提交的变更');
                    return;
                }

                // 如果需要暂存所有变更
                if (options.all) {
                    spinner.text = '暂存所有变更...';
                    await gitService.stageAll();
                }

                // 检查是否有已暂存的变更
                const stagedDiff = await gitService.getDiff();
                if (!stagedDiff.staged) {
                    spinner.fail('没有已暂存的变更,请先使用 git add 或 --all 选项');
                    return;
                }

                spinner.text = '生成 commit message...';

                const router = options.ai !== false ? getRouter() : undefined;
                const generator = new CommitMessageGenerator(gitService, router);

                const result = await generator.generate({
                    detailed: options.detailed,
                    type: options.type,
                    scope: options.scope,
                });

                spinner.succeed('Commit message 生成完成');

                // 显示生成的 message
                console.log(chalk.bold.cyan('\n📝 生成的 Commit Message:\n'));
                console.log(chalk.white(result.full));
                console.log(chalk.gray(`\n变更统计: ${result.summary.filesChanged} 个文件, +${result.summary.insertions}/-${result.summary.deletions} 行\n`));

                if (options.dryRun) {
                    console.log(chalk.yellow('🔍 Dry run 模式,未实际提交'));
                    return;
                }

                // 执行提交
                const commitSpinner = ora('提交变更...').start();
                try {
                    await gitService.commit(result.full);
                    commitSpinner.succeed(chalk.green('✅ 提交成功!'));

                    // 显示提交信息
                    const hash = await gitService.getCurrentCommitHash();
                    console.log(chalk.gray(`Commit: ${hash.substring(0, 7)}`));
                } catch (error: any) {
                    commitSpinner.fail(`提交失败: ${error.message}`);
                }
            } catch (error: any) {
                spinner.fail(`错误: ${error.message}`);
                process.exit(1);
            }
        });
}
