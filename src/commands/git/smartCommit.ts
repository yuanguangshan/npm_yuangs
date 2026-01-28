import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../../core/git/GitService';
import { SmartCommitManager, CommitGroup } from '../../core/git/SmartCommitManager';
import { DEFAULT_AI_MODEL } from '../../core/git/constants';
import { CLIComponent } from '../../utils/CLIComponent';
import readline from 'readline';

export function registerSmartCommitCommand(gitCmd: Command) {
    gitCmd
        .command('smart-commit')
        .alias('sc')
        .description('智能识别工作区逻辑块并进行分步提交')
        .option('-m, --model <model>', '使用的 AI 模型', DEFAULT_AI_MODEL)
        .option('-y, --yes', '自动执行所有建议的提交', false)
        .action(async (options) => {
            const gitService = new GitService();
            const manager = new SmartCommitManager(gitService);

            const spinner = ora(chalk.cyan('正在分析工作区变更...')).start();

            try {
                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                const plan = await manager.planCommits(options.model);

                if (plan.groups.length === 0) {
                    spinner.succeed('工作区没有任何变更');
                    return;
                }

                spinner.succeed(`分析完成，建议分为 ${plan.groups.length} 个提交：\n`);

                for (const group of plan.groups) {
                    console.log(chalk.bold.blue(`📦 组 ${group.id}: ${group.title}`));
                    console.log(chalk.gray(`   📄 文件: ${group.files.join(', ')}`));
                    console.log(chalk.green(`   📝 建议消息: ${group.suggestedMessage}`));
                    console.log('');
                }

                if (plan.remainingFiles.length > 0) {
                    console.log(chalk.yellow(`⚠️ 以下文件未被分配到组中：${plan.remainingFiles.join(', ')}`));
                    console.log('');
                }

                if (options.yes) {
                    await executeAll(manager, plan.groups);
                } else {
                    const ans = await askQuestion('是否按此计划执行分步提交？(y/N/i - i表示逐个确认): ');
                    if (ans.toLowerCase() === 'y') {
                        await executeAll(manager, plan.groups);
                    } else if (ans.toLowerCase() === 'i') {
                        await executeInteractive(manager, plan.groups);
                    } else {
                        console.log(chalk.gray('操作已取消。'));
                    }
                }

            } catch (error: any) {
                spinner.fail(`分析失败: ${error.message}`);
            }
        });
}

async function executeAll(manager: SmartCommitManager, groups: CommitGroup[]) {
    for (const group of groups) {
        const spinner = ora(`正在执行组 ${group.id}: ${group.title}...`).start();
        try {
            await manager.executeCommitGroup(group);
            spinner.succeed(`组 ${group.id} 提交成功: ${chalk.green(group.suggestedMessage)}`);
        } catch (e: any) {
            spinner.fail(`组 ${group.id} 提交失败: ${e.message}`);
        }
    }
    console.log(chalk.bold.green('\n✨ 所有分步提交已完成！'));
}

async function executeInteractive(manager: SmartCommitManager, groups: CommitGroup[]) {
    for (const group of groups) {
        console.log(chalk.bold.blue(`\n下一项: ${group.title}`));
        const ans = await askQuestion('执行此提交？(y/N/s - s表示跳过此组/e表示编辑消息): ');

        if (ans.toLowerCase() === 'y') {
            const spinner = ora('正在提交...').start();
            await manager.executeCommitGroup(group);
            spinner.succeed('提交成功');
        } else if (ans.toLowerCase() === 'e') {
            const newMessage = await askQuestion('请输入新的提交消息: ');
            group.suggestedMessage = newMessage || group.suggestedMessage;
            const spinner = ora('正在提交...').start();
            await manager.executeCommitGroup(group);
            spinner.succeed('提交成功');
        } else {
            console.log(chalk.gray('已跳过。'));
        }
    }
}

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}
