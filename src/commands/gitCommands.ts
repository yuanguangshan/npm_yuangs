import { Command } from 'commander';
import { registerCommitCommand } from './git/commit';
import { registerReviewCommand } from './git/review';
import { registerStatusCommand } from './git/status';
import { registerBranchCommand } from './git/branch';

/**
 * 注册 Git 相关命令
 */
export function registerGitCommands(program: Command) {
    const gitCmd = program
        .command('git')
        .description('Git 集成工具 - 智能提交、代码审查、分支管理');

    registerCommitCommand(gitCmd);
    registerReviewCommand(gitCmd);
    registerStatusCommand(gitCmd);
    registerBranchCommand(gitCmd);
}
