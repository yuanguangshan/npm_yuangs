"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGitCommands = registerGitCommands;
const commit_1 = require("./git/commit");
const review_1 = require("./git/review");
const status_1 = require("./git/status");
const branch_1 = require("./git/branch");
const plan_1 = require("./git/plan");
/**
 * 注册 Git 相关命令
 */
function registerGitCommands(program) {
    const gitCmd = program
        .command('git')
        .description('Git 集成工具 - 智能提交、代码审查、分支管理')
        .action((options, cmd) => {
        if (cmd.args.length === 0) {
            cmd.help();
        }
    });
    (0, commit_1.registerCommitCommand)(gitCmd);
    (0, review_1.registerReviewCommand)(gitCmd);
    (0, status_1.registerStatusCommand)(gitCmd);
    (0, branch_1.registerBranchCommand)(gitCmd);
    (0, plan_1.registerPlanCommand)(gitCmd);
}
//# sourceMappingURL=gitCommands.js.map