import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../../core/git/GitService';
import { CodeReviewer, ReviewLevel, IssueSeverity } from '../../core/git/CodeReviewer';
import { getRouter } from '../../core/modelRouter';

export function registerReviewCommand(gitCmd: Command) {
    // git review - AI 代码审查
    gitCmd
        .command('review')
        .description('AI 代码审查')
        .option('-l, --level <level>', '审查级别 (quick/standard/deep)', 'standard')
        .option('-f, --file <file>', '审查特定文件')
        .option('--unstaged', '审查未暂存的变更')
        .option('--no-ai', '禁用 AI (将显示变更摘要)')
        .action(async (options) => {
            if (options.ai === false) {
                const gitService = new GitService();
                const diff = await gitService.getDiff();
                const files = options.unstaged ? diff.files.unstaged : diff.files.staged;

                console.log(chalk.yellow('\nℹ️  AI 代码审查已禁用。'));
                console.log(chalk.white(`本次涉及变更文件数: ${files.length} 个`));
                console.log(chalk.gray('💡 建议使用 "git diff" 或 IDE 插件进行人工审查。'));
                return;
            }

            const spinner = ora('初始化代码审查...').start();

            try {
                const gitService = new GitService();

                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                const router = getRouter();
                const reviewer = new CodeReviewer(gitService, router);

                const level = options.level as ReviewLevel;
                spinner.text = `执行 ${level} 级别代码审查...`;

                let result;
                if (options.file) {
                    result = await reviewer.reviewFile(options.file, level);
                } else {
                    result = await reviewer.review(level, !options.unstaged);
                }

                spinner.succeed('代码审查完成');

                // 显示审查结果
                console.log(chalk.bold.cyan('\n🔍 代码审查报告\n'));
                const scoreColor = getScoreColor(result.score);
                console.log(chalk.bold('评分: ') + scoreColor(result.score.toString()) + chalk.bold('/100'));
                console.log(chalk.gray(`审查文件: ${result.filesReviewed} 个\n`));

                console.log(chalk.bold('📋 总体评价:'));
                console.log(chalk.white(`  ${result.summary}\n`));

                if (result.issues.length > 0) {
                    console.log(chalk.bold.red(`⚠️  发现 ${result.issues.length} 个问题:\n`));
                    for (const issue of result.issues) {
                        const icon = getSeverityIcon(issue.severity);
                        const color = getSeverityColor(issue.severity);
                        console.log(color(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
                        console.log(color(`     ${issue.message}`));
                        if (issue.suggestion) {
                            console.log(chalk.gray(`     💡 ${issue.suggestion}`));
                        }
                        console.log();
                    }
                } else {
                    console.log(chalk.green('✅ 未发现明显问题\n'));
                }

                if (result.strengths.length > 0) {
                    console.log(chalk.bold.green('👍 优点:\n'));
                    for (const strength of result.strengths) {
                        console.log(chalk.green(`  ✓ ${strength}`));
                    }
                    console.log();
                }

                if (result.recommendations.length > 0) {
                    console.log(chalk.bold.yellow('💡 建议:\n'));
                    for (const rec of result.recommendations) {
                        console.log(chalk.yellow(`  • ${rec}`));
                    }
                    console.log();
                }
            } catch (error: any) {
                if (error.message.includes('requires model configuration') || error.message.includes('not configured')) {
                    spinner.fail('当前未配置 AI 模型，无法执行代码审查');
                    console.log(chalk.yellow('请运行 "yuangs config" 配置 AI 模型，或使用其他命令。'));
                } else if (error.message.includes('Deep review is not recommended')) {
                    spinner.fail('代码变更较多，跳过 deep 审查');
                    console.log(chalk.yellow('💡 建议：'));
                    console.log('  • 使用 --level standard');
                    console.log('  • 或指定 --file 进行重点审查');
                } else if (error.message.includes('No changes to review')) {
                    const gitService = new GitService();
                    const diff = await gitService.getDiff();
                    
                    if (!options.unstaged && diff.files.unstaged.length > 0) {
                        spinner.warn('当前没有已暂存 (staged) 的文件变更');
                        console.log(chalk.cyan('\n💡 建议：'));
                        console.log(`  • 运行 ${chalk.green('git add <file>')} 将文件加入暂存区`);
                        console.log(`  • 或运行 ${chalk.green('yuangs git review --unstaged')} 直接审查未暂存的变更`);
                    } else {
                        spinner.fail('没有检测到任何代码变更');
                    }
                } else {
                    spinner.fail(`错误: ${error.message}`);
                }
                process.exit(1);
            }
        });
}

// 辅助函数
function getScoreColor(score: number) {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    return chalk.red;
}

function getSeverityIcon(severity: IssueSeverity): string {
    const icons = {
        [IssueSeverity.INFO]: 'ℹ️',
        [IssueSeverity.WARNING]: '⚠️',
        [IssueSeverity.ERROR]: '❌',
        [IssueSeverity.CRITICAL]: '🚨',
    };
    return icons[severity] || '•';
}

function getSeverityColor(severity: IssueSeverity) {
    const colors = {
        [IssueSeverity.INFO]: chalk.blue,
        [IssueSeverity.WARNING]: chalk.yellow,
        [IssueSeverity.ERROR]: chalk.red,
        [IssueSeverity.CRITICAL]: chalk.bgRed.white,
    };
    return colors[severity] || chalk.white;
}
