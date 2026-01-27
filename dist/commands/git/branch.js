"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBranchCommand = registerBranchCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const GitService_1 = require("../../core/git/GitService");
const modelRouter_1 = require("../../core/modelRouter");
/**
 * 允许的动态导入路径白名单
 * 用于防止恶意代码注入
 */
const ALLOWED_IMPORTS = [
    '../../core/git/BranchAdvisor'
];
/**
 * 验证分支名称的安全性
 * 防止命令注入和路径遍历攻击
 */
function validateBranchName(branchName) {
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
function registerBranchCommand(gitCmd) {
    /**
     * 列出分支的通用逻辑
     */
    async function listBranches() {
        try {
            const gitService = new GitService_1.GitService();
            if (!(await gitService.isGitRepository())) {
                console.log(chalk_1.default.red('当前目录不是 Git 仓库'));
                return;
            }
            const [branches, status] = await Promise.all([
                gitService.getBranches(),
                gitService.getStatusSummary()
            ]);
            console.log(chalk_1.default.bold.cyan('\n🌿 分支列表\n'));
            branches.details.forEach(b => {
                const prefix = b.isCurrent ? chalk_1.default.green('*') : ' ';
                const name = b.isCurrent ? chalk_1.default.green.bold(b.name) : chalk_1.default.white(b.name);
                let meta = [];
                if (b.upstream) {
                    if (b.ahead)
                        meta.push(chalk_1.default.green(`↑${b.ahead}`));
                    if (b.behind)
                        meta.push(chalk_1.default.red(`↓${b.behind}`));
                    if (!b.ahead && !b.behind)
                        meta.push(chalk_1.default.gray('sync'));
                }
                // 如果是当前分支，显示工作区状态
                if (b.isCurrent) {
                    const isDirty = status.modified > 0 || status.added > 0 || status.deleted > 0;
                    if (isDirty)
                        meta.push(chalk_1.default.yellow('(dirty)'));
                    else
                        meta.push(chalk_1.default.green('(clean)'));
                }
                const metaStr = meta.length ? ` ${meta.join(' ')}` : '';
                console.log(`${prefix} ${name}${metaStr}`);
                if (b.subject) {
                    console.log(chalk_1.default.gray(`    └─ ${b.hash} ${b.subject}`));
                }
            });
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    }
    // git branch - 分支管理
    const branchCmd = gitCmd
        .command('branch')
        .description('智能分支管理')
        .action(async (options, cmd) => {
        // 如果没有子命令，默认执行 list
        if (cmd.args.length === 0) {
            await listBranches();
        }
        else {
            // 如果有子命令但没匹配到（虽然 Commander 通常会自动处理，但这里加个兜底以防万一出现 exit 1）
            cmd.help();
        }
    });
    // branch list
    branchCmd
        .command('list')
        .description('列出分支及上下文信息')
        .action(async () => {
        await listBranches();
    });
    // branch switch
    branchCmd
        .command('switch <branch>')
        .description('安全切换分支')
        .action(async (branchName) => {
        try {
            // 安全检查：验证分支名称
            if (!validateBranchName(branchName)) {
                console.log(chalk_1.default.red(`❌ 无效的分支名称: "${branchName}"`));
                console.log(chalk_1.default.gray('分支名称只能包含字母、数字、连字符(-)、下划线(_)和点(.)'));
                console.log(chalk_1.default.gray('示例: feature/new-feature, hotfix/bug-fix-123'));
                return;
            }
            const gitService = new GitService_1.GitService();
            if (!(await gitService.isGitRepository())) {
                console.log(chalk_1.default.red('当前目录不是 Git 仓库'));
                return;
            }
            // 1. 检查分支是否存在
            const branches = await gitService.getBranches();
            if (!branches.all.includes(branchName)) {
                console.log(chalk_1.default.red(`❌ 分支 "${branchName}" 不存在`));
                return;
            }
            if (branchName === branches.current) {
                console.log(chalk_1.default.yellow(`ℹ️  已经在分支 "${branchName}" 上`));
                return;
            }
            // 2. 检查工作区
            const isClean = await gitService.isWorkingTreeClean();
            if (!isClean) {
                const status = await gitService.getStatusSummary();
                console.log(chalk_1.default.red(`⚠️  无法切换: 当前工作区有未提交的变更`));
                if (status.modified)
                    console.log(chalk_1.default.gray(`   - 修改: ${status.modified}`));
                if (status.added)
                    console.log(chalk_1.default.gray(`   - 新增: ${status.added}`));
                if (status.deleted)
                    console.log(chalk_1.default.gray(`   - 删除: ${status.deleted}`));
                console.log('\n请先执行以下操作之一:');
                console.log(chalk_1.default.white('  • yuangs git commit'));
                console.log(chalk_1.default.white('  • git stash'));
                return;
            }
            // 3. 执行切换
            const spinner = (0, ora_1.default)(`正在切换到 "${branchName}"...`).start();
            await gitService.switchBranch(branchName);
            spinner.succeed(chalk_1.default.green(`已切换到分支 ${chalk_1.default.bold(branchName)}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n切换失败: ${error.message}`));
            process.exit(1);
        }
    });
    // branch suggest
    branchCmd
        .command('suggest')
        .description('🧠 获取分支操作建议 (AI)')
        .action(async () => {
        const spinner = (0, ora_1.default)('正在分析 Git 上下文...').start();
        try {
            const gitService = new GitService_1.GitService();
            if (!(await gitService.isGitRepository())) {
                spinner.fail('当前目录不是 Git 仓库');
                return;
            }
            const router = (0, modelRouter_1.getRouter)();
            if (!router) {
                spinner.fail('未检测到 AI 模型配置');
                console.log(chalk_1.default.yellow('💡 请先运行 "yuangs config" 配置 AI 模型'));
                return;
            }
            // 安全检查：动态导入路径白名单验证
            const importPath = '../../core/git/BranchAdvisor';
            if (!ALLOWED_IMPORTS.includes(importPath)) {
                throw new Error('Security: Import path not in whitelist');
            }
            const { BranchAdvisor } = await Promise.resolve(`${importPath}`).then(s => __importStar(require(s)));
            const advisor = new BranchAdvisor(gitService, router);
            const suggestion = await advisor.suggest();
            spinner.stop();
            console.log(chalk_1.default.bold.cyan('\n💡 分支操作建议\n'));
            let actionIcon = '';
            let actionColor = chalk_1.default.white;
            let actionDesc = '';
            switch (suggestion.action) {
                case 'stay':
                    actionIcon = '➡️';
                    actionColor = chalk_1.default.green;
                    actionDesc = '保持当前分支 (Stay)';
                    break;
                case 'switch':
                    actionIcon = '🔀';
                    actionColor = chalk_1.default.yellow;
                    actionDesc = `切换分支 (Switch to ${suggestion.targetBranch})`;
                    break;
                case 'create':
                    actionIcon = '🌱';
                    actionColor = chalk_1.default.blue;
                    actionDesc = `新建分支 (Create ${suggestion.newBranch?.name})`;
                    break;
            }
            console.log(`${actionIcon}  ${chalk_1.default.bold('建议操作:')} ${actionColor(actionDesc)}`);
            console.log(`📝 ${chalk_1.default.bold('原因:')} ${suggestion.reason}`);
            if (suggestion.action === 'create' && suggestion.newBranch) {
                console.log(chalk_1.default.gray(`\n   git checkout -b ${suggestion.newBranch.name}`));
            }
            else if (suggestion.action === 'switch' && suggestion.targetBranch) {
                console.log(chalk_1.default.gray(`\n   git checkout ${suggestion.targetBranch}`));
            }
            const confidence = Math.round(suggestion.confidence * 100);
            const confColor = confidence > 80 ? chalk_1.default.green : (confidence > 50 ? chalk_1.default.yellow : chalk_1.default.red);
            console.log(chalk_1.default.gray(`\n🎯 置信度: ${confColor(confidence + '%')}`));
        }
        catch (error) {
            spinner.fail(`分析失败: ${error.message}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=branch.js.map