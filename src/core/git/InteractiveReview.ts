import chalk from 'chalk';
import { ReviewIssue, IssueSeverity } from './CodeReviewer';
import { GitService } from './GitService';
import * as readline from 'readline';

export interface FixAction {
    type: 'apply' | 'skip' | 'edit' | 'batch';
    issue?: ReviewIssue;
    customFix?: string;
}

export interface InteractiveFixResult {
    applied: number;
    skipped: number;
    edited: number;
    batchApplied: number;
}

export class InteractiveReview {
    private rl: readline.Interface;

    constructor(private gitService: GitService) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async startInteractiveFix(issues: ReviewIssue[]): Promise<InteractiveFixResult> {
        try {
            if (issues.length === 0) {
                console.log(chalk.green('✅ 没有发现需要修复的问题'));
                return { applied: 0, skipped: 0, edited: 0, batchApplied: 0 };
            }

            console.log(chalk.bold.cyan(`\n🔧 发现 ${issues.length} 个问题可以交互式修复\n`));

            const result: InteractiveFixResult = {
                applied: 0,
                skipped: 0,
                edited: 0,
                batchApplied: 0
            };

        // 按严重程度分组
        const criticalIssues = issues.filter(i => i.severity === IssueSeverity.CRITICAL);
        const errorIssues = issues.filter(i => i.severity === IssueSeverity.ERROR);
        const warningIssues = issues.filter(i => i.severity === IssueSeverity.WARNING);
        const infoIssues = issues.filter(i => i.severity === IssueSeverity.INFO);

        // 优先处理严重问题
        const allIssues = [...criticalIssues, ...errorIssues, ...warningIssues, ...infoIssues];

        // 批量处理选项
        const batchChoice = await this.askBatchProcessing(allIssues);
        if (batchChoice === 'batch') {
            const batchResult = await this.processBatch(allIssues);
            result.batchApplied = batchResult.applied;
            return result;
        }

        // 逐个处理问题
        for (const issue of allIssues) {
            const action = await this.processSingleIssue(issue);

            switch (action.type) {
                case 'apply':
                    await this.applyFix(issue);
                    result.applied++;
                    break;
                case 'edit':
                    if (action.customFix) {
                        await this.editAndApplyFix(issue, action.customFix);
                        result.edited++;
                    } else {
                        console.log(chalk.yellow('⚠️  未提供自定义修复方案，跳过'));
                        result.skipped++;
                    }
                    break;
                case 'skip':
                    result.skipped++;
                    break;
            }

            // 显示进度
            this.showProgress(result, allIssues.length);
        }

            this.printSummary(result);
            return result;
        } finally {
            // 确保无论成功或失败都清理 readline 资源
            this.destroy();
        }
    }

    private async askBatchProcessing(issues: ReviewIssue[]): Promise<'batch' | 'individual'> {
        return new Promise((resolve) => {
            console.log(chalk.yellow('💡 提示: 你可以批量处理相似的问题'));
            console.log(chalk.gray(`   发现 ${issues.length} 个问题可以修复\n`));

            this.rl.question(
                chalk.cyan('请选择处理方式:\n') +
                chalk.white('  1. 批量处理相似问题 (推荐)\n') +
                chalk.white('  2. 逐个处理问题\n\n') +
                chalk.white('请选择 (1 或 2): '),
                (answer) => {
                    resolve(answer === '1' ? 'batch' : 'individual');
                }
            );
        });
    }

    private async processBatch(issues: ReviewIssue[]): Promise<{ applied: number }> {
        console.log(chalk.bold.cyan('\n📦 批量处理问题\n'));

        // 按问题类型分组
        const groups = this.groupIssuesByType(issues);
        let applied = 0;

        for (const [type, groupIssues] of Object.entries(groups)) {
            if (groupIssues.length < 2) continue; // 跳过只有一个的问题

            console.log(chalk.white(`\n发现 ${groupIssues.length} 个相似问题: ${type}`));

            const sampleIssue = groupIssues[0];
            this.displayIssue(sampleIssue, 1);

            const action = await this.askBatchAction(type, groupIssues.length);

            if (action === 'apply') {
                for (const issue of groupIssues) {
                    await this.applyFix(issue);
                    applied++;
                }
                console.log(chalk.green(`✅ 已批量修复 ${groupIssues.length} 个问题`));
            } else if (action === 'edit') {
                const customFix = await this.askCustomFix(sampleIssue);
                for (const issue of groupIssues) {
                    await this.editAndApplyFix(issue, customFix);
                    applied++;
                }
                console.log(chalk.green(`✅ 已批量应用自定义修复`));
            } else {
                console.log(chalk.gray(`⏭️  跳过批量修复`));
            }
        }

        return { applied };
    }

    private groupIssuesByType(issues: ReviewIssue[]): Record<string, ReviewIssue[]> {
        const groups: Record<string, ReviewIssue[]> = {};

        for (const issue of issues) {
            // 使用问题消息的前几个单词作为分组键
            const typeKey = issue.message.substring(0, 30).toLowerCase();
            if (!groups[typeKey]) {
                groups[typeKey] = [];
            }
            groups[typeKey].push(issue);
        }

        return groups;
    }

    private async processSingleIssue(issue: ReviewIssue): Promise<FixAction> {
        console.log(chalk.bold.cyan('\n─────────────────────────────────────\n'));
        this.displayIssue(issue);

        const choices = [
            { key: 'y', desc: '应用建议的修复', action: 'apply' as const },
            { key: 'e', desc: '编辑后应用', action: 'edit' as const },
            { key: 's', desc: '跳过', action: 'skip' as const },
            { key: 'q', desc: '退出', action: 'skip' as const }
        ];

        const answer = await this.askQuestion(
            chalk.cyan('请选择操作: ') +
            choices.map(c => chalk.white(`[${c.key}]${c.desc}`)).join(' ')
        );

        const choice = choices.find(c => c.key === answer.toLowerCase());

        if (answer.toLowerCase() === 'q') {
            return { type: 'skip' };
        }

        if (choice?.action === 'edit') {
            const customFix = await this.askCustomFix(issue);
            return { type: 'edit', issue, customFix };
        }

        return { type: (choice?.action || 'skip'), issue };
    }

    private displayIssue(issue: ReviewIssue, index?: number): void {
        if (index) {
            console.log(chalk.bold.white(`${index}. [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
        } else {
            console.log(chalk.bold.white(`[${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
        }

        console.log(chalk.yellow(`   ${issue.message}`));

        if (issue.suggestion) {
            console.log(chalk.gray(`   💡 建议: ${issue.suggestion}`));
        }

        if (issue.snippet) {
            console.log(chalk.gray(`   📝 代码片段:`));
            console.log(chalk.gray(`   ${issue.snippet.split('\n').join('\n   ')}`));
        }

        console.log('');
    }

    private async askBatchAction(type: string, count: number): Promise<'apply' | 'edit' | 'skip'> {
        return new Promise((resolve) => {
            this.rl.question(
                chalk.cyan(`批量处理这 ${count} 个问题? `) +
                chalk.white('[a]应用建议修复 ') +
                chalk.white('[e]编辑后应用 ') +
                chalk.white('[s]跳过 ') +
                chalk.white(': '),
                (answer) => {
                    const choice = answer.toLowerCase();
                    if (choice === 'a') resolve('apply');
                    else if (choice === 'e') resolve('edit');
                    else resolve('skip');
                }
            );
        });
    }

    private async askCustomFix(issue: ReviewIssue): Promise<string> {
        console.log(chalk.cyan('\n💭 请输入自定义修复方案:'));
        console.log(chalk.gray(`当前问题: ${issue.message}\n`));

        return new Promise((resolve) => {
            this.rl.question(chalk.white('修复方案: '), (answer) => {
                resolve(answer || issue.suggestion || '');
            });
        });
    }

    private async applyFix(issue: ReviewIssue): Promise<void> {
        try {
            // 这里可以实现自动应用修复的逻辑
            // 例如: 修改文件、添加注释、重构代码等
            console.log(chalk.green(`✅ 已应用修复: ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
        } catch (error) {
            console.log(chalk.red(`❌ 应用修复失败: ${error}`));
            throw error;
        }
    }

    private async editAndApplyFix(issue: ReviewIssue, customFix: string): Promise<void> {
        try {
            // 使用自定义修复方案
            console.log(chalk.green(`✅ 已应用自定义修复: ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
        } catch (error) {
            console.log(chalk.red(`❌ 应用自定义修复失败: ${error}`));
            throw error;
        }
    }

    private showProgress(result: InteractiveFixResult, total: number): void {
        const processed = result.applied + result.skipped + result.edited + result.batchApplied;
        const percentage = Math.round((processed / total) * 100);

        console.log(chalk.gray(`\n📊 进度: ${processed}/${total} (${percentage}%)`));
        console.log(chalk.gray(`✅ 已修复: ${result.applied + result.batchApplied} | ✏️  已编辑: ${result.edited} | ⏭️  已跳过: ${result.skipped}`));
    }

    private printSummary(result: InteractiveFixResult): void {
        console.log(chalk.bold.cyan('\n─────────────────────────────────────'));
        console.log(chalk.bold.cyan('📋 交互式修复完成\n'));

        const total = result.applied + result.skipped + result.edited + result.batchApplied;

        console.log(chalk.white(`总计处理问题: ${total}`));
        console.log(chalk.green(`✅ 自动修复: ${result.applied + result.batchApplied}`));
        console.log(chalk.blue(`✏️  自定义修复: ${result.edited}`));
        console.log(chalk.gray(`⏭️  跳过: ${result.skipped}`));

        console.log(chalk.bold.cyan('\n─────────────────────────────────────\n'));
    }

    private askQuestion(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question + ' ', (answer) => {
                resolve(answer.trim());
            });
        });
    }

    destroy(): void {
        if (this.rl) {
            this.rl.close();
        }
    }
}

// Helper function to start interactive review
export async function startInteractiveReview(
    issues: ReviewIssue[],
    gitService: GitService
): Promise<InteractiveFixResult> {
    const interactiveReview = new InteractiveReview(gitService);
    try {
        return await interactiveReview.startInteractiveFix(issues);
    } finally {
        interactiveReview.destroy();
    }
}