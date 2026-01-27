"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStatusCommand = registerStatusCommand;
const chalk_1 = __importDefault(require("chalk"));
const GitService_1 = require("../../core/git/GitService");
function registerStatusCommand(gitCmd) {
    // git status - 增强的状态显示
    gitCmd
        .command('status')
        .description('显示增强的 Git 状态信息')
        .action(async () => {
        try {
            const gitService = new GitService_1.GitService();
            if (!(await gitService.isGitRepository())) {
                console.log(chalk_1.default.red('当前目录不是 Git 仓库'));
                return;
            }
            const [branchInfo, statusSummary, recentCommits] = await Promise.all([
                gitService.getBranchInfo(),
                gitService.getStatusSummary(),
                gitService.getRecentCommits(5),
            ]);
            console.log(chalk_1.default.bold.cyan('\n📊 Git 状态\n'));
            // 分支信息
            console.log(chalk_1.default.bold('🌿 分支:'));
            console.log(chalk_1.default.white(`  当前: ${branchInfo.current}`));
            if (branchInfo.upstream) {
                console.log(chalk_1.default.gray(`  上游: ${branchInfo.upstream}`));
                if (branchInfo.ahead > 0) {
                    console.log(chalk_1.default.green(`  ↑ 领先 ${branchInfo.ahead} 个提交`));
                }
                if (branchInfo.behind > 0) {
                    console.log(chalk_1.default.yellow(`  ↓ 落后 ${branchInfo.behind} 个提交`));
                }
            }
            console.log();
            // 变更统计
            console.log(chalk_1.default.bold('📝 变更:'));
            if (statusSummary.modified > 0) {
                console.log(chalk_1.default.yellow(`  修改: ${statusSummary.modified} 个文件`));
            }
            if (statusSummary.added > 0) {
                console.log(chalk_1.default.green(`  新增: ${statusSummary.added} 个文件`));
            }
            if (statusSummary.deleted > 0) {
                console.log(chalk_1.default.red(`  删除: ${statusSummary.deleted} 个文件`));
            }
            if (statusSummary.untracked > 0) {
                console.log(chalk_1.default.gray(`  未跟踪: ${statusSummary.untracked} 个文件`));
            }
            if (Object.values(statusSummary).every(v => v === 0)) {
                console.log(chalk_1.default.green('  工作区干净'));
            }
            console.log();
            // 最近提交
            if (recentCommits.length > 0) {
                console.log(chalk_1.default.bold('📜 最近提交:\n'));
                for (const commit of recentCommits) {
                    console.log(chalk_1.default.gray(`  ${commit.hash.substring(0, 7)}`), chalk_1.default.white(commit.message));
                    console.log(chalk_1.default.gray(`    ${commit.author} · ${new Date(commit.date).toLocaleString()}`));
                }
                console.log();
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
}
//# sourceMappingURL=status.js.map