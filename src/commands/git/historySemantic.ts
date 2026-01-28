import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../../core/git/GitService';
import { SemanticCommitParser } from '../../core/git/semantic/SemanticCommitParser';
import { DEFAULT_AI_MODEL } from '../../core/git/constants';
import { CLIComponent } from '../../utils/CLIComponent';

export function registerSemanticHistoryCommand(gitCmd: Command) {
    gitCmd
        .command('history-semantic')
        .alias('hs')
        .description('结合代码结构分析 Git 提交历史，生成语义化报告')
        .option('-n, --count <number>', '分析的提交数量', '5')
        .option('-m, --model <model>', '使用的 AI 模型', DEFAULT_AI_MODEL)
        .action(async (options) => {
            const gitService = new GitService();
            const parser = new SemanticCommitParser(gitService);
            const count = parseInt(options.count, 10);

            const spinner = ora(chalk.cyan(`正在语义化分析最近 ${count} 条提交...`)).start();

            try {
                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                const result = await parser.parseHistory(count, options.model);
                spinner.succeed('语义分析完成\n');

                // 打印整体总结
                CLIComponent.renderInfoPanel('历史趋势概览', result.overallSummary);
                console.log('');

                // 打印每个 commit 的详细语义
                for (const commit of result.commits) {
                    const impactColors: Record<string, any> = {
                        low: chalk.gray,
                        medium: chalk.blue,
                        high: chalk.yellow,
                        breaking: chalk.red.bold
                    };

                    const color = impactColors[commit.impactLevel] || chalk.white;
                    const levelLabel = `[${commit.impactLevel.toUpperCase()}]`;

                    console.log(chalk.bold(`${chalk.gray(commit.hash.substring(0, 7))} ${color(levelLabel)}`));
                    console.log(`${chalk.white(' 原始: ')}${chalk.dim(commit.originalMessage)}`);
                    console.log(`${chalk.white(' 语义: ')}${chalk.green(commit.semanticSummary)}`);

                    // 如果有关键结构变更，打印出来
                    const structuralChanges = commit.structuralChanges.files.flatMap(f => f.changes);
                    if (structuralChanges.length > 0) {
                        const changeLabels = structuralChanges.map(c =>
                            `${c.type === 'addition' ? '+' : '-'} ${c.category}(${c.name})`
                        ).slice(0, 3);

                        console.log(`${chalk.white(' 结构: ')}${chalk.cyan(changeLabels.join(', '))}${structuralChanges.length > 3 ? ' ...' : ''}`);
                    }
                    console.log('');
                }

            } catch (error: any) {
                spinner.fail(`分析失败: ${error.message}`);
            }
        });
}
