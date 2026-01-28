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
 */
const ALLOWED_IMPORTS = [
    '../../core/git/BranchAdvisor'
];
/**
 * 列出分支的公共动作函数
 */
async function listBranchesAction() {
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
    }
}
function registerBranchCommand(gitCmd) {
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
        .action(async (branchName) => {
        try {
            const gitService = new GitService_1.GitService();
            if (!(await gitService.isGitRepository())) {
                console.log(chalk_1.default.red('当前目录不是 Git 仓库'));
                return;
            }
            // 使用原生 Git 校验
            if (!(await gitService.isValidBranchName(branchName))) {
                console.log(chalk_1.default.red(`❌ 无效的分支名称: "${branchName}"`));
                return;
            }
            const branches = await gitService.getBranches();
            if (!branches.all.includes(branchName)) {
                console.log(chalk_1.default.red(`❌ 分支 "${branchName}" 不存在`));
                return;
            }
            if (branchName === branches.current) {
                console.log(chalk_1.default.yellow(`ℹ️  已经在分支 "${branchName}" 上`));
                return;
            }
            const isClean = await gitService.isWorkingTreeClean();
            if (!isClean) {
                const status = await gitService.getStatusSummary();
                console.log(chalk_1.default.red(`⚠️  无法切换: 当前工作区有未提交的变更`));
                return;
            }
            const spinner = (0, ora_1.default)(`正在切换到 "${branchName}"...`).start();
            await gitService.switchBranch(branchName);
            spinner.succeed(chalk_1.default.green(`已切换到分支 ${chalk_1.default.bold(branchName)}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n切换失败: ${error.message}`));
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
            const router = (0, modelRouter_1.getRouter)();
            if (!router) {
                spinner.fail('未检测到 AI 模型配置');
                return;
            }
            const importPath = '../../core/git/BranchAdvisor';
            if (!ALLOWED_IMPORTS.includes(importPath)) {
                throw new Error('Security: Import path not in whitelist');
            }
            const { BranchAdvisor } = await Promise.resolve(`${importPath}`).then(s => __importStar(require(s)));
            const advisor = new BranchAdvisor(gitService, router);
            const suggestion = await advisor.suggest();
            spinner.stop();
            console.log(chalk_1.default.bold.cyan('\n💡 分支操作建议\n'));
            let actionIcon = suggestion.action === 'stay' ? '➡️' : (suggestion.action === 'switch' ? '🔀' : '🌱');
            console.log(`${actionIcon}  ${chalk_1.default.bold('建议操作:')} ${suggestion.action}`);
            console.log(`📝 ${chalk_1.default.bold('原因:')} ${suggestion.reason}`);
            if (suggestion.action === 'create' && suggestion.newBranch) {
                console.log(chalk_1.default.gray(`\n   git checkout -b ${suggestion.newBranch.name}`));
            }
            else if (suggestion.action === 'switch' && suggestion.targetBranch) {
                console.log(chalk_1.default.gray(`\n   git checkout ${suggestion.targetBranch}`));
            }
            const confidence = Math.round(suggestion.confidence * 100);
            console.log(chalk_1.default.gray(`\n🎯 置信度: ${confidence}%`));
        }
        catch (error) {
            spinner.fail(`分析失败: ${error.message}`);
        }
    });
}
//# sourceMappingURL=branch.js.map