"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAutoCommand = registerAutoCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const path_1 = __importDefault(require("path"));
const GitService_1 = require("../../core/git/GitService");
const llm_1 = require("../../agent/llm");
const workflows_1 = require("../../core/workflows");
const CapabilityLevel_1 = require("../../core/capability/CapabilityLevel");
const ContextGatherer_1 = require("../../core/git/ContextGatherer");
const CodeReviewer_1 = require("../../core/git/CodeReviewer");
function registerAutoCommand(gitCmd) {
    gitCmd
        .command('auto')
        .description('自动执行 todo.md 中的任务，直到全部完成或达到最大限制')
        .option('-n, --max-tasks <number>', '本次运行执行的最大任务数', '5')
        .option('-m, --model <model>', '使用的 AI 模型', 'Assistant')
        .option('-s, --min-score <number>', '任务通过所需的最低评分', '70')
        .option('-l, --review-level <level>', '代码审查级别 (quick/standard/deep)', 'standard')
        .option('--skip-review', '跳过代码审查')
        .option('-o, --save-only', '只保存代码，不写入文件系统')
        .option('-c, --commit', '所有任务完成后自动提交')
        .option('--commit-message <msg>', '自定义提交信息（使用 --commit 时生效）')
        .action(async (options) => {
        const spinner = (0, ora_1.default)('正在初始化工作流会话...').start();
        try {
            const gitService = new GitService_1.GitService();
            const todoPath = path_1.default.join(process.cwd(), 'todo.md');
            if (!(await gitService.isGitRepository())) {
                spinner.fail('当前目录不是 Git 仓库');
                return;
            }
            spinner.succeed('Git 仓库验证通过');
            const workflowConfig = {
                sessionId: Date.now().toString(36) + Math.random().toString(36).substring(2, 11),
                model: options.model || 'Assistant',
                capability: CapabilityLevel_1.CapabilityLevel.STRUCTURAL
            };
            const session = new workflows_1.GitWorkflowSession(workflowConfig);
            console.log(chalk_1.default.bold.cyan('\n🤖 启动自动执行工作流...\n'));
            spinner.succeed('工作流会话已初始化');
            const autoInput = {
                maxTasks: parseInt(options.maxTasks) || 5,
                minScore: parseInt(options.minScore) || 70,
                reviewLevel: options.reviewLevel || 'standard',
                skipReview: options.skipReview || false,
                saveOnly: options.saveOnly || false,
                autoCommit: options.commit || false,
                commitMessage: options.commitMessage
            };
            spinner.start('[工作流] 正在执行任务...');
            const result = await session.runAuto(async (input) => {
                const autoWorkflow = new workflows_1.AutoWorkflow(gitService, new ContextGatherer_1.ContextGatherer(gitService), new CodeReviewer_1.CodeReviewer(gitService));
                return autoWorkflow.run({ ...input, ...autoInput }, session.getConfig());
            });
            if (result.success && result.data) {
                spinner.succeed('自动执行完成');
                console.log('');
                console.log(chalk_1.default.green(`✅ 任务执行完成: ${result.data.executedTasks}/${result.data.totalTasks}`));
                console.log(chalk_1.default.gray(`📁 修改文件数: ${result.data.filesModified.length}`));
                console.log(chalk_1.default.gray(`💾 备份数: ${result.data.backupIds.length}`));
                if (result.data.commitHash) {
                    console.log(chalk_1.default.cyan(`📝 提交哈希: ${result.data.commitHash}`));
                }
                console.log('');
                console.log(chalk_1.default.bold.cyan('📊 会话摘要:'));
                console.log(chalk_1.default.gray(session.getSummary()));
                session.complete();
            }
            else {
                spinner.fail('自动执行失败');
                if (result.errors && result.errors.length > 0) {
                    console.log('');
                    console.log(chalk_1.default.bold.red('❌ 错误详情:'));
                    result.errors.forEach((error, index) => {
                        console.log(chalk_1.default.red(`  ${index + 1}. [${error.kind}] ${error.message}`));
                        if (error.suggestions && error.suggestions.length > 0) {
                            error.suggestions.forEach(suggestion => {
                                console.log(chalk_1.default.yellow(`     💡 ${suggestion}`));
                            });
                        }
                    });
                }
                if (result.summary) {
                    console.log('');
                    console.log(chalk_1.default.gray(`📝 ${result.summary}`));
                }
            }
        }
        catch (error) {
            spinner.fail(chalk_1.default.red(`执行过程中出错: ${error.message}`));
            if (error instanceof llm_1.AIError) {
                console.error(chalk_1.default.red(`Status: ${error.statusCode}`));
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=auto.js.map