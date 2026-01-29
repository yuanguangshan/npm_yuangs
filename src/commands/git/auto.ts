import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { GitService } from '../../core/git/GitService';
import { AIError } from '../../agent/llm';
import {
  AutoWorkflow,
  GitWorkflowSession,
  WorkflowConfig
} from '../../core/workflows';
import { CapabilityLevel } from '../../core/capability/CapabilityLevel';
import { ContextGatherer } from '../../core/git/ContextGatherer';
import { CodeReviewer } from '../../core/git/CodeReviewer';

export function registerAutoCommand(gitCmd: Command) {
    gitCmd
        .command('auto')
        .description('自动执行 todo.md 中的任务，直到全部完成或达到最大限制')
        .option('-n, --max-tasks <number>', '本次运行执行的最大任务数', '5')
        .option('-m, --model <model>', '使用的 AI 模型', 'Assistant')
        .option('-s, --min-score <number>', '任务通过所需的最低评分', '70')
        .option('-l, --review-level <level>', '代码审查级别 (quick/standard/deep)', 'standard')
        .option('--skip-review', '跳过代码审查')
        .option('-o, --save-only', '只保存代码，不写入文件系统')
        .option('-c, --commit', '所有任务完成后自动提交')
        .option('--commit-message <msg>', '自定义提交信息（使用 --commit 时生效）')
        .action(async (options) => {
            const spinner = ora('正在初始化工作流会话...').start();

            try {
                const gitService = new GitService();
                const todoPath = path.join(process.cwd(), 'todo.md');

                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                spinner.succeed('Git 仓库验证通过');

                const workflowConfig: WorkflowConfig = {
                    sessionId: Date.now().toString(36) + Math.random().toString(36).substring(2, 11),
                    model: options.model || 'Assistant',
                    capability: CapabilityLevel.STRUCTURAL
                };

                const session = new GitWorkflowSession(workflowConfig);

                console.log(chalk.bold.cyan('\n🤖 启动自动执行工作流...\n'));

                spinner.succeed('工作流会话已初始化');

                const autoInput = {
                    maxTasks: parseInt(options.maxTasks) || 5,
                    minScore: parseInt(options.minScore) || 70,
                    reviewLevel: options.reviewLevel as 'quick' | 'standard' | 'deep' || 'standard',
                    skipReview: options.skipReview || false,
                    saveOnly: options.saveOnly || false,
                    autoCommit: options.commit || false,
                    commitMessage: options.commitMessage
                };

                spinner.start('[工作流] 正在执行任务...');

                const result = await session.runAuto(async (input) => {
                    const autoWorkflow = new AutoWorkflow(
                        gitService,
                        new ContextGatherer(gitService),
                        new CodeReviewer(gitService, undefined)
                    );
                    return autoWorkflow.run(input, session.getConfig());
                }, autoInput);

                if (result.success && result.data) {
                    spinner.succeed('自动执行完成');

                    console.log('');
                    console.log(chalk.green(`✅ 任务执行完成: ${result.data.executedTasks}/${result.data.totalTasks}`));
                    console.log(chalk.gray(`📁 修改文件数: ${result.data.filesModified.length}`));
                    console.log(chalk.gray(`💾 备份数: ${result.data.backupIds.length}`));

                    if (result.data.commitHash) {
                        console.log(chalk.cyan(`📝 提交哈希: ${result.data.commitHash}`));
                    }

                    console.log('');
                    console.log(chalk.bold.cyan('📊 会话摘要:'));
                    console.log(chalk.gray(session.getSummary()));

                    session.complete();
                } else {
                    spinner.fail('自动执行失败');

                    if (result.errors && result.errors.length > 0) {
                        console.log('');
                        console.log(chalk.bold.red('❌ 错误详情:'));
                        result.errors.forEach((error, index) => {
                            console.log(chalk.red(`  ${index + 1}. [${error.kind}] ${error.message}`));
                            if (error.suggestions && error.suggestions.length > 0) {
                                error.suggestions.forEach(suggestion => {
                                    console.log(chalk.yellow(`     💡 ${suggestion}`));
                                });
                            }
                        });
                    }

                    if (result.summary) {
                        console.log('');
                        console.log(chalk.gray(`📝 ${result.summary}`));
                    }
                }
            } catch (error: any) {
                spinner.fail(chalk.red(`执行过程中出错: ${error.message}`));

                if (error instanceof AIError) {
                    console.error(chalk.red(`Status: ${error.statusCode}`));
                }

                process.exit(1);
            }
        });
}
