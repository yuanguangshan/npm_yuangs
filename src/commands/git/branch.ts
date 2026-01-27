import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../../core/git/GitService';
import { getRouter } from '../../core/modelRouter';

/**
 * 允许的动态导入路径白名单
 * 用于防止恶意代码注入
 */
const ALLOWED_IMPORTS = [
    '../../core/git/BranchAdvisor'
] as const;

/**
 * 验证分支名称的安全性
 * 防止命令注入和路径遍历攻击
 */
function validateBranchName(branchName: string): boolean {
    // Git 分支名称规范：
    // 1. 不能包含空格
    // 2. 不能包含特殊字符 (除 -, _, ., /)
    // 3. 不能以 .. 开头（防止路径遍历）
    // 4. 不能以 . 开头或结尾（避免隐藏文件问题）
    
    const branchNamePattern = /^[a-zA-Z0-9\-_\.]+(?:\/[a-zA-Z0-9\-_\.]+)*$/;
    
    // 基本格式检查
    if (!branchNamePattern.test(branchName)) {
        return false;
    }
    
    // 防止路径遍历
    if (branchName.includes('..')) {
        return false;
    }
    
    // 防止以 . 开头或结尾
    if (branchName.startsWith('.') || branchName.endsWith('.')) {
        return false;
    }
    
    // 限制长度
    if (branchName.length > 255) {
        return false;
    }
    
    return true;
}

export function registerBranchCommand(gitCmd: Command) {
    // git branch - 分支管理
    const branchCmd = gitCmd
        .command('branch')
        .description('智能分支管理');

    // branch list
    branchCmd
        .command('list')
        .description('列出分支及上下文信息')
        .action(async () => {
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

                    // 如果是当前分支，显示工作区状态
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
                process.exit(1);
            }
        });

    // branch switch
    branchCmd
        .command('switch <branch>')
        .description('安全切换分支')
        .action(async (branchName) => {
            try {
                // 安全检查：验证分支名称
                if (!validateBranchName(branchName)) {
                    console.log(chalk.red(`❌ 无效的分支名称: "${branchName}"`));
                    console.log(chalk.gray('分支名称只能包含字母、数字、连字符(-)、下划线(_)和点(.)'));
                    console.log(chalk.gray('示例: feature/new-feature, hotfix/bug-fix-123'));
                    return;
                }

                const gitService = new GitService();
                if (!(await gitService.isGitRepository())) {
                    console.log(chalk.red('当前目录不是 Git 仓库'));
                    return;
                }

                // 1. 检查分支是否存在
                const branches = await gitService.getBranches();
                if (!branches.all.includes(branchName)) {
                    console.log(chalk.red(`❌ 分支 "${branchName}" 不存在`));
                    return;
                }

                if (branchName === branches.current) {
                    console.log(chalk.yellow(`ℹ️  已经在分支 "${branchName}" 上`));
                    return;
                }

                // 2. 检查工作区
                const isClean = await gitService.isWorkingTreeClean();
                if (!isClean) {
                    const status = await gitService.getStatusSummary();
                    console.log(chalk.red(`⚠️  无法切换: 当前工作区有未提交的变更`));
                    if (status.modified) console.log(chalk.gray(`   - 修改: ${status.modified}`));
                    if (status.added) console.log(chalk.gray(`   - 新增: ${status.added}`));
                    if (status.deleted) console.log(chalk.gray(`   - 删除: ${status.deleted}`));

                    console.log('\n请先执行以下操作之一:');
                    console.log(chalk.white('  • yuangs git commit'));
                    console.log(chalk.white('  • git stash'));
                    return;
                }

                // 3. 执行切换
                const spinner = ora(`正在切换到 "${branchName}"...`).start();
                await gitService.switchBranch(branchName);
                spinner.succeed(chalk.green(`已切换到分支 ${chalk.bold(branchName)}`));

            } catch (error: any) {
                console.error(chalk.red(`\n切换失败: ${error.message}`));
                process.exit(1);
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
                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                const router = getRouter();
                if (!router) {
                    spinner.fail('未检测到 AI 模型配置');
                    console.log(chalk.yellow('💡 请先运行 "yuangs config" 配置 AI 模型'));
                    return;
                }

                // 安全检查：动态导入路径白名单验证
                const importPath = '../../core/git/BranchAdvisor';
                if (!ALLOWED_IMPORTS.includes(importPath as any)) {
                    throw new Error('Security: Import path not in whitelist');
                }

                const { BranchAdvisor } = await import(importPath);
                const advisor = new BranchAdvisor(gitService, router);

                const suggestion = await advisor.suggest();
                spinner.stop();

                console.log(chalk.bold.cyan('\n💡 分支操作建议\n'));

                let actionIcon = '';
                let actionColor = chalk.white;
                let actionDesc = '';

                switch (suggestion.action) {
                    case 'stay':
                        actionIcon = '➡️';
                        actionColor = chalk.green;
                        actionDesc = '保持当前分支 (Stay)';
                        break;
                    case 'switch':
                        actionIcon = '🔀';
                        actionColor = chalk.yellow;
                        actionDesc = `切换分支 (Switch to ${suggestion.targetBranch})`;
                        break;
                    case 'create':
                        actionIcon = '🌱';
                        actionColor = chalk.blue;
                        actionDesc = `新建分支 (Create ${suggestion.newBranch?.name})`;
                        break;
                }

                console.log(`${actionIcon}  ${chalk.bold('建议操作:')} ${actionColor(actionDesc)}`);
                console.log(`📝 ${chalk.bold('原因:')} ${suggestion.reason}`);

                if (suggestion.action === 'create' && suggestion.newBranch) {
                    console.log(chalk.gray(`\n   git checkout -b ${suggestion.newBranch.name}`));
                } else if (suggestion.action === 'switch' && suggestion.targetBranch) {
                    console.log(chalk.gray(`\n   git checkout ${suggestion.targetBranch}`));
                }

                const confidence = Math.round(suggestion.confidence * 100);
                const confColor = confidence > 80 ? chalk.green : (confidence > 50 ? chalk.yellow : chalk.red);
                console.log(chalk.gray(`\n🎯 置信度: ${confColor(confidence + '%')}`));

            } catch (error: any) {
                spinner.fail(`分析失败: ${error.message}`);
                process.exit(1);
            }
        });
}
