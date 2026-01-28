"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReviewCommand = registerReviewCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const GitService_1 = require("../../core/git/GitService");
const CodeReviewer_1 = require("../../core/git/CodeReviewer");
const modelRouter_1 = require("../../core/modelRouter");
function registerReviewCommand(gitCmd) {
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
            const gitService = new GitService_1.GitService();
            const diff = await gitService.getDiff();
            const files = options.unstaged ? diff.files.unstaged : diff.files.staged;
            console.log(chalk_1.default.yellow('\nℹ️  AI 代码审查已禁用。'));
            console.log(chalk_1.default.white(`本次涉及变更文件数: ${files.length} 个`));
            console.log(chalk_1.default.gray('💡 建议使用 "git diff" 或 IDE 插件进行人工审查。'));
            return;
        }
        const spinner = (0, ora_1.default)('初始化代码审查...').start();
        try {
            const gitService = new GitService_1.GitService();
            if (!(await gitService.isGitRepository())) {
                spinner.fail('当前目录不是 Git 仓库');
                return;
            }
            const router = (0, modelRouter_1.getRouter)();
            const reviewer = new CodeReviewer_1.CodeReviewer(gitService, router);
            const level = options.level;
            spinner.text = `执行 ${level} 级别代码审查...`;
            let result;
            if (options.file) {
                result = await reviewer.reviewFile(options.file, level);
            }
            else {
                result = await reviewer.review(level, !options.unstaged);
            }
            spinner.succeed('代码审查完成');
            // 显示审查结果
            console.log(chalk_1.default.bold.cyan('\n🔍 代码审查报告\n'));
            const scoreColor = getScoreColor(result.score);
            console.log(chalk_1.default.bold('评分: ') + scoreColor(result.score.toString()) + chalk_1.default.bold('/100'));
            console.log(chalk_1.default.gray(`审查文件: ${result.filesReviewed} 个\n`));
            console.log(chalk_1.default.bold('📋 总体评价:'));
            console.log(chalk_1.default.white(`  ${result.summary}\n`));
            if (result.issues.length > 0) {
                console.log(chalk_1.default.bold.red(`⚠️  发现 ${result.issues.length} 个问题:\n`));
                for (const issue of result.issues) {
                    const icon = getSeverityIcon(issue.severity);
                    const color = getSeverityColor(issue.severity);
                    console.log(color(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
                    console.log(color(`     ${issue.message}`));
                    if (issue.suggestion) {
                        console.log(chalk_1.default.gray(`     💡 ${issue.suggestion}`));
                    }
                    console.log();
                }
            }
            else {
                console.log(chalk_1.default.green('✅ 未发现明显问题\n'));
            }
            if (result.strengths.length > 0) {
                console.log(chalk_1.default.bold.green('👍 优点:\n'));
                for (const strength of result.strengths) {
                    console.log(chalk_1.default.green(`  ✓ ${strength}`));
                }
                console.log();
            }
            if (result.recommendations.length > 0) {
                console.log(chalk_1.default.bold.yellow('💡 建议:\n'));
                for (const rec of result.recommendations) {
                    console.log(chalk_1.default.yellow(`  • ${rec}`));
                }
                console.log();
            }
        }
        catch (error) {
            if (error.message.includes('requires model configuration') || error.message.includes('not configured')) {
                spinner.fail('当前未配置 AI 模型，无法执行代码审查');
                console.log(chalk_1.default.yellow('请运行 "yuangs config" 配置 AI 模型，或使用其他命令。'));
            }
            else if (error.message.includes('Deep review is not recommended')) {
                spinner.fail('代码变更较多，跳过 deep 审查');
                console.log(chalk_1.default.yellow('💡 建议：'));
                console.log('  • 使用 --level standard');
                console.log('  • 或指定 --file 进行重点审查');
            }
            else if (error.message.includes('No changes to review')) {
                const gitService = new GitService_1.GitService();
                const diff = await gitService.getDiff();
                if (!options.unstaged && diff.files.unstaged.length > 0) {
                    spinner.warn('当前没有已暂存 (staged) 的文件变更');
                    console.log(chalk_1.default.cyan('\n💡 建议：'));
                    console.log(`  • 运行 ${chalk_1.default.green('git add <file>')} 将文件加入暂存区`);
                    console.log(`  • 或运行 ${chalk_1.default.green('yuangs git review --unstaged')} 直接审查未暂存的变更`);
                }
                else {
                    spinner.fail('没有检测到任何代码变更');
                }
            }
            else {
                spinner.fail(`错误: ${error.message}`);
            }
            process.exit(1);
        }
    });
}
// 辅助函数
function getScoreColor(score) {
    if (score >= 90)
        return chalk_1.default.green;
    if (score >= 70)
        return chalk_1.default.yellow;
    return chalk_1.default.red;
}
function getSeverityIcon(severity) {
    const icons = {
        [CodeReviewer_1.IssueSeverity.INFO]: 'ℹ️',
        [CodeReviewer_1.IssueSeverity.WARNING]: '⚠️',
        [CodeReviewer_1.IssueSeverity.ERROR]: '❌',
        [CodeReviewer_1.IssueSeverity.CRITICAL]: '🚨',
    };
    return icons[severity] || '•';
}
function getSeverityColor(severity) {
    const colors = {
        [CodeReviewer_1.IssueSeverity.INFO]: chalk_1.default.blue,
        [CodeReviewer_1.IssueSeverity.WARNING]: chalk_1.default.yellow,
        [CodeReviewer_1.IssueSeverity.ERROR]: chalk_1.default.red,
        [CodeReviewer_1.IssueSeverity.CRITICAL]: chalk_1.default.bgRed.white,
    };
    return colors[severity] || chalk_1.default.white;
}
//# sourceMappingURL=review.js.map