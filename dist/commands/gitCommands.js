"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGitCommands = registerGitCommands;
const commit_1 = require("./git/commit");
const review_1 = require("./git/review");
const status_1 = require("./git/status");
const branch_1 = require("./git/branch");
const plan_1 = require("./git/plan");
const exec_1 = require("./git/exec");
const auto_1 = require("./git/auto");
const semanticDiff_1 = require("./git/semanticDiff");
const resolve_1 = require("./git/resolve");
const historySemantic_1 = require("./git/historySemantic");
const smartCommit_1 = require("./git/smartCommit");
/**
 * 注册 Git 相关命令
 */
function registerGitCommands(program) {
    const gitCmd = program
        .command('git')
        .description('Git 集成工具 - 智能提交、代码审查、分支管理、自动化工作流')
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
    (0, exec_1.registerExecCommand)(gitCmd);
    (0, auto_1.registerAutoCommand)(gitCmd);
    (0, semanticDiff_1.registerSemanticDiffCommand)(gitCmd);
    (0, resolve_1.registerResolveCommand)(gitCmd);
    (0, historySemantic_1.registerSemanticHistoryCommand)(gitCmd);
    (0, smartCommit_1.registerSmartCommitCommand)(gitCmd);
}
//# sourceMappingURL=gitCommands.js.map