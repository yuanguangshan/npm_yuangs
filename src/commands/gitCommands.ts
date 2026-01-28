import { Command } from 'commander';
import { registerCommitCommand } from './git/commit';
import { registerReviewCommand } from './git/review';
import { registerStatusCommand } from './git/status';
import { registerBranchCommand } from './git/branch';
import { registerPlanCommand } from './git/plan';

/**
 * 注册 Git 相关命令
 */
export function registerGitCommands(program: Command) {
    const gitCmd = program
        .command('git')
        .description('Git 集成工具 - 智能提交、代码审查、分支管理')
        .action((options: any, cmd: any) => {
            if (cmd.args.length === 0) {
                cmd.help();
            }
        });

    registerCommitCommand(gitCmd);
    registerReviewCommand(gitCmd);
    registerStatusCommand(gitCmd);
    registerBranchCommand(gitCmd);
    registerPlanCommand(gitCmd);
}
