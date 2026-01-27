import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../../core/git/GitService';
import { getRouter } from '../../core/modelRouter';

/**
 * 允许的动态导入路径白名单
 */
const ALLOWED_IMPORTS = [
    '../../core/git/BranchAdvisor'
] as const;

/**
 * 列出分支的公共动作函数
 */
async function listBranchesAction() {
    try {
        const gitService = new GitService();
        if (!(await gitService.isGitRepository())) {
            console.log(chalk.red('当前目录不是 Git 仓库'));
            return;
        }

        const [branches, status] = await Promise.all([
            gitService.getBranches(),
            gitService.getStatusSummary()
        ]);

        console.log(chalk.bold.cyan('\n🌿 分支列表\n'));

        branches.details.forEach(b => {
            const prefix = b.isCurrent ? chalk.green('*') : ' ';
            const name = b.isCurrent ? chalk.green.bold(b.name) : chalk.white(b.name);
            let meta = [];

            if (b.upstream) {
                if (b.ahead) meta.push(chalk.green(`↑${b.ahead}`));
                if (b.behind) meta.push(chalk.red(`↓${b.behind}`));
                if (!b.ahead && !b.behind) meta.push(chalk.gray('sync'));
            }

            if (b.isCurrent) {
                const isDirty = status.modified > 0 || status.added > 0 || status.deleted > 0;
                if (isDirty) meta.push(chalk.yellow('(dirty)'));
                else meta.push(chalk.green('(clean)'));
            }

            const metaStr = meta.length ? ` ${meta.join(' ')}` : '';
            console.log(`${prefix} ${name}${metaStr}`);
            if (b.subject) {
                console.log(chalk.gray(`    └─ ${b.hash} ${b.subject}`));
            }
        });
        console.log();

    } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
    }
}

export function registerBranchCommand(gitCmd: Command) {
    // git branch - 分支管理
    const branchCmd = gitCmd
        .command('branch')
        .description('智能分支管理');

    // 关键修复：定义父命令的 action 
    // 当输入 "yuangs git branch" (无子命令) 时触发
    branchCmd.action(async (_options, cmd) => {
        if (cmd.args.length === 0) {
            await listBranchesAction();
        }
    });

    // branch list
    branchCmd
        .command('list')
        .description('列出分支及上下文信息说明')
        .action(listBranchesAction);

    // branch switch
    branchCmd
        .command('switch <branch>')
        .description('安全切换分支')
        .action(async (branchName: string) => {
            try {
                const gitService = new GitService();
                if (!(await gitService.isGitRepository())) {
                    console.log(chalk.red('当前目录不是 Git 仓库'));
                    return;
                }

                // 使用原生 Git 校验
                if (!(await gitService.isValidBranchName(branchName))) {
                    console.log(chalk.red(`❌ 无效的分支名称: "${branchName}"`));
                    return;
                }

                const branches = await gitService.getBranches();
                if (!branches.all.includes(branchName)) {
                    console.log(chalk.red(`❌ 分支 "${branchName}" 不存在`));
                    return;
                }

                if (branchName === branches.current) {
                    console.log(chalk.yellow(`ℹ️  已经在分支 "${branchName}" 上`));
                    return;
                }

                const isClean = await gitService.isWorkingTreeClean();
                if (!isClean) {
                    const status = await gitService.getStatusSummary();
                    console.log(chalk.red(`⚠️  无法切换: 当前工作区有未提交的变更`));
                    return;
                }

                const spinner = ora(`正在切换到 "${branchName}"...`).start();
                await gitService.switchBranch(branchName);
                spinner.succeed(chalk.green(`已切换到分支 ${chalk.bold(branchName)}`));

            } catch (error: any) {
                console.error(chalk.red(`\n切换失败: ${error.message}`));
            }
        });

    // branch suggest
    branchCmd
        .command('suggest')
        .description('🧠 获取分支操作建议 (AI)')
        .action(async () => {
            const spinner = ora('正在分析 Git 上下文...').start();
            try {
                const gitService = new GitService();
                const router = getRouter();
                if (!router) {
                    spinner.fail('未检测到 AI 模型配置');
                    return;
                }

                const importPath = '../../core/git/BranchAdvisor';
                if (!ALLOWED_IMPORTS.includes(importPath as any)) {
                    throw new Error('Security: Import path not in whitelist');
                }

                const { BranchAdvisor } = await import(importPath);
                const advisor = new BranchAdvisor(gitService, router);

                const suggestion = await advisor.suggest();
                spinner.stop();

                console.log(chalk.bold.cyan('\n💡 分支操作建议\n'));

                let actionIcon = suggestion.action === 'stay' ? '➡️' : (suggestion.action === 'switch' ? '🔀' : '🌱');
                console.log(`${actionIcon}  ${chalk.bold('建议操作:')} ${suggestion.action}`);
                console.log(`📝 ${chalk.bold('原因:')} ${suggestion.reason}`);

                if (suggestion.action === 'create' && suggestion.newBranch) {
                    console.log(chalk.gray(`\n   git checkout -b ${suggestion.newBranch.name}`));
                } else if (suggestion.action === 'switch' && suggestion.targetBranch) {
                    console.log(chalk.gray(`\n   git checkout ${suggestion.targetBranch}`));
                }

                const confidence = Math.round(suggestion.confidence * 100);
                console.log(chalk.gray(`\n🎯 置信度: ${confidence}%`));

            } catch (error: any) {
                spinner.fail(`分析失败: ${error.message}`);
            }
        });
}
