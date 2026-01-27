"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommitCommand = registerCommitCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const GitService_1 = require("../../core/git/GitService");
const CommitMessageGenerator_1 = require("../../core/git/CommitMessageGenerator");
const modelRouter_1 = require("../../core/modelRouter");
function registerCommitCommand(gitCmd) {
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
        const spinner = (0, ora_1.default)('初始化 Git 服务...').start();
        try {
            const gitService = new GitService_1.GitService();
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
            const router = options.ai !== false ? (0, modelRouter_1.getRouter)() : undefined;
            const generator = new CommitMessageGenerator_1.CommitMessageGenerator(gitService, router);
            const result = await generator.generate({
                detailed: options.detailed,
                type: options.type,
                scope: options.scope,
            });
            spinner.succeed('Commit message 生成完成');
            // 显示生成的 message
            console.log(chalk_1.default.bold.cyan('\n📝 生成的 Commit Message:\n'));
            console.log(chalk_1.default.white(result.full));
            console.log(chalk_1.default.gray(`\n变更统计: ${result.summary.filesChanged} 个文件, +${result.summary.insertions}/-${result.summary.deletions} 行\n`));
            if (options.dryRun) {
                console.log(chalk_1.default.yellow('🔍 Dry run 模式,未实际提交'));
                return;
            }
            // 执行提交
            const commitSpinner = (0, ora_1.default)('提交变更...').start();
            try {
                await gitService.commit(result.full);
                commitSpinner.succeed(chalk_1.default.green('✅ 提交成功!'));
                // 显示提交信息
                const hash = await gitService.getCurrentCommitHash();
                console.log(chalk_1.default.gray(`Commit: ${hash.substring(0, 7)}`));
            }
            catch (error) {
                commitSpinner.fail(`提交失败: ${error.message}`);
            }
        }
        catch (error) {
            spinner.fail(`错误: ${error.message}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=commit.js.map