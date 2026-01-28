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
exports.registerAutoCommand = registerAutoCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ProgressBar_1 = require("../../utils/ProgressBar");
const CLIComponent_1 = require("../../utils/CLIComponent");
const GitService_1 = require("../../core/git/GitService");
const llm_1 = require("../../agent/llm");
const TodoManager_1 = require("../../core/git/TodoManager");
const CodeReviewer_1 = require("../../core/git/CodeReviewer");
const constants_1 = require("../../core/git/constants");
const CodeGenerator_1 = require("../../core/git/CodeGenerator");
const CommitMessageGenerator_1 = require("../../core/git/CommitMessageGenerator");
const ErrorHandler_1 = require("../../core/git/ErrorHandler");
const ProgressManager_1 = require("../../core/git/ProgressManager");
const ContextGatherer_1 = require("../../core/git/ContextGatherer");
/**
 * 执行单个任务
 */
async function executeTask(task, context, model, previousFeedback) {
    try {
        const response = await (0, llm_1.runLLM)({
            prompt: {
                system: `你是一个全方位的交付专家。
1. 如果当前任务涉及代码（如 .ts, .js, .py 等文件），请扮演**资深软件工程师**，确保代码健壮、注释详尽、遵循最佳实践，并追求极致的模块化与性能。
2. 如果当前任务涉及文档（如 .md, .yaml, .html 等文件），请扮演**资深内容专家或历史学者**，确保叙事优美、逻辑严密、事实准确。

**重要输出格式要求：**
- 每个文件必须以 \`### 文件: path\` 或 \`**文件**: path\` 明确标注。
- 代码内容必须包裹在对应的 Markdown 代码块中。
- 不要解释，直接输出文件内容。`,
                messages: [
                    {
                        role: 'user',
                        content: `[项目上下文]\n${context}\n\n[当前任务]\n${task.description}\n\n${previousFeedback ? `[审查反馈 - 请修复以下问题]\n${previousFeedback}\n\n` : ''}请根据以上信息开始任务。`
                    }
                ]
            },
            model: model || constants_1.DEFAULT_AI_MODEL,
            stream: false
        });
        return { code: response.rawText, success: true };
    }
    catch (error) {
        return { code: '', success: false, error: error.message };
    }
}
/**
 * 代码审查包装器
 */
async function reviewCode(level, staged = true) {
    const gitService = new GitService_1.GitService();
    const reviewer = new CodeReviewer_1.CodeReviewer(gitService);
    return await reviewer.review(level, staged);
}
function registerAutoCommand(gitCmd) {
    gitCmd
        .command('auto')
        .description('自动执行 todo.md 中的任务，直到全部完成或达到最大限制')
        .option('-n, --max-tasks <number>', '本次运行执行的最大任务数', '5')
        .option('-m, --model <model>', '使用的 AI 模型', constants_1.DEFAULT_AI_MODEL)
        .option('-s, --min-score <number>', '任务通过所需的最低评分', constants_1.MIN_REVIEW_SCORE.toString())
        .option('-l, --review-level <level>', '代码审查级别 (quick/standard/deep)', 'standard')
        .option('--skip-review', '跳过代码审查')
        .option('-o, --save-only', '只保存代码，不写入文件系统')
        .option('-c, --commit', '所有任务完成后自动提交')
        .option('--commit-message <msg>', '自定义提交信息（使用 --commit 时生效）')
        .action(async (options) => {
        const todoPath = path_1.default.join(process.cwd(), 'todo.md');
        const maxTasks = parseInt(options.maxTasks) || 5;
        const minScore = parseInt(options.minScore) || constants_1.MIN_REVIEW_SCORE;
        const progressManager = new ProgressManager_1.ProgressManager();
        console.log(chalk_1.default.bold.cyan('\n🤖 启动全自动 AI 开发工作流...\n'));
        console.log(chalk_1.default.gray(`📋 最大任务数: ${maxTasks}`));
        console.log(chalk_1.default.gray(`🎯 最低审查分数: ${minScore}`));
        console.log(chalk_1.default.gray(`🤖 AI 模型: ${options.model}\n`));
        const spinner = (0, ora_1.default)('正在初始化...').start();
        try {
            // 1. 检查 todo.md 是否存在
            await fs_1.default.promises.access(todoPath, fs_1.default.constants.F_OK);
            // 2. 解析任务
            const { metadata, tasks } = await (0, TodoManager_1.parseTodoFile)(todoPath);
            if (tasks.length === 0) {
                spinner.fail('未找到任何任务');
                console.log(chalk_1.default.yellow('💡 提示：请先运行 yuangs git plan 生成任务'));
                return;
            }
            spinner.succeed(`发现 ${tasks.length} 个任务`);
            const progress = (0, TodoManager_1.calculateProgress)(tasks);
            const progressBar = new ProgressBar_1.ProgressBar({
                total: progress.total,
                template: `${chalk_1.default.cyan('总体进度:')} {bar} {percentage}% | {value}/{total} 已完成`
            });
            console.log('');
            progressBar.update(progress.completed);
            console.log('');
            // 初始化进度管理器
            await progressManager.initialize({
                minScore,
                skipReview: options.skipReview,
                saveOnly: options.saveOnly,
                commit: options.commit,
                commitMessage: options.commitMessage
            });
            let tasksExecuted = 0;
            // 3. 循环执行任务
            while (tasksExecuted < maxTasks) {
                const nextTask = (0, TodoManager_1.getNextTask)(tasks);
                if (!nextTask) {
                    break;
                }
                // 使用组件渲染任务面板
                CLIComponent_1.CLIComponent.renderTaskPanel(nextTask.index + 1, nextTask.description, nextTask.priority);
                let attempts = nextTask.attempts || 0;
                let taskCompleted = false;
                while (attempts <= constants_1.MAX_RETRY_ATTEMPTS && !taskCompleted) {
                    attempts++;
                    // 3a. 执行任务
                    spinner.start(`[尝试 ${attempts}/${constants_1.MAX_RETRY_ATTEMPTS + 1}] 正在生成方案...`);
                    await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                        execStatus: 'in_progress',
                        attempts
                    });
                    const previousFeedback = attempts > 1 && nextTask.reviewIssues
                        ? nextTask.reviewIssues.join('\n')
                        : undefined;
                    // 采集真实上下文
                    spinner.text = `[尝试 ${attempts}] 正在采集项目上下文...`;
                    const gitService = new GitService_1.GitService();
                    const gatherer = new ContextGatherer_1.ContextGatherer(gitService);
                    const gathered = await gatherer.gather(nextTask.description);
                    spinner.text = `[尝试 ${attempts}] 正在向 AI 请求代码生成...`;
                    const { code, success } = await executeTask(nextTask, gathered.summary, options.model, previousFeedback);
                    if (!success) {
                        spinner.fail('代码生成失败');
                        await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                            execStatus: 'failed'
                        });
                        break;
                    }
                    spinner.succeed('方案生成完成');
                    // 3b. 保存原始输出
                    const savedPath = await (0, CodeGenerator_1.saveRawOutput)(code, nextTask.index);
                    progressBar.log(chalk_1.default.gray(`📄 原始输出已保存: ${path_1.default.relative(process.cwd(), savedPath)}`));
                    // 3c. 解析并写入代码
                    const generated = (0, CodeGenerator_1.parseGeneratedCode)(code);
                    if (generated.files.length > 0) {
                        progressBar.log(chalk_1.default.cyan(`\n📦 完成代码解析，涉及 ${generated.files.length} 个文件`));
                        if (!options.saveOnly) {
                            spinner.start('正在备份并写入文件...');
                            let backupId;
                            try {
                                const backup = await (0, CodeGenerator_1.backupFiles)(generated.files);
                                backupId = backup.id;
                            }
                            catch (e) { }
                            const { written } = await (0, CodeGenerator_1.writeGeneratedCode)(generated);
                            spinner.succeed(`已更新 ${written.length} 个文件`);
                            // 保存备份ID
                            await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, { backupId });
                            nextTask.backupId = backupId;
                        }
                    }
                    // 3d. 代码审查
                    if (!options.skipReview) {
                        spinner.start('正在进行 AI 质量审查...');
                        const levelMap = {
                            'quick': CodeReviewer_1.ReviewLevel.QUICK,
                            'standard': CodeReviewer_1.ReviewLevel.STANDARD,
                            'deep': CodeReviewer_1.ReviewLevel.DEEP
                        };
                        const reviewLevel = levelMap[options.reviewLevel] || CodeReviewer_1.ReviewLevel.STANDARD;
                        const review = await reviewCode(reviewLevel, false);
                        spinner.succeed(`审查完成 (评分: ${review.score}/100)`);
                        await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                            reviewScore: review.score,
                            reviewIssues: review.issues.map(i => i.message)
                        });
                        if (review.score >= minScore) {
                            progressBar.log(chalk_1.default.green(`✅ 质量达标 (${review.score} pts)`));
                            taskCompleted = true;
                            await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                                completed: true,
                                execStatus: 'done'
                            });
                            nextTask.completed = true;
                        }
                        else {
                            progressBar.log(chalk_1.default.yellow(`⚠️ 质量不合格 (${review.score} < ${minScore})`));
                            if (attempts > constants_1.MAX_RETRY_ATTEMPTS) {
                                progressBar.log(chalk_1.default.red(`❌ 达到最大尝试次数，任务失败`));
                                await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, { execStatus: 'failed' });
                            }
                        }
                    }
                    else {
                        progressBar.log(chalk_1.default.gray('⏭️  已跳过代码审查'));
                        taskCompleted = true;
                        await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                            completed: true,
                            execStatus: 'done'
                        });
                        nextTask.completed = true;
                    }
                }
                tasksExecuted++;
                // 更新总体进度
                const newProgress = (0, TodoManager_1.calculateProgress)(tasks);
                progressBar.update(newProgress.completed);
                console.log('\n');
            }
            // 4. 总结
            const finalProgress = (0, TodoManager_1.calculateProgress)(tasks);
            CLIComponent_1.CLIComponent.renderSummaryPanel(finalProgress.completed, finalProgress.total, tasksExecuted, finalProgress.completed < finalProgress.total);
            if (options.commit && finalProgress.completed === finalProgress.total) {
                const gitService = new GitService_1.GitService();
                if (!(await gitService.isWorkingTreeClean())) {
                    spinner.start('准备自动提交...');
                    await gitService.stageAll();
                    const router = await (await Promise.resolve().then(() => __importStar(require('../../core/modelRouter')))).getRouter();
                    const commitGen = new CommitMessageGenerator_1.CommitMessageGenerator(gitService, router);
                    const commit = await commitGen.generate({ detailed: false });
                    await gitService.commit(commit.full);
                    spinner.succeed('已完成自动提交');
                }
            }
        }
        catch (e) {
            if (e instanceof Error && e.code === 'ENOENT') {
                spinner.fail('未找到 todo.md 文件');
            }
            else if (e instanceof llm_1.AIError) {
                spinner.fail((0, ErrorHandler_1.formatError)(e, 'AI 调用失败'));
            }
            else if (e instanceof Error) {
                spinner.fail((0, ErrorHandler_1.formatError)(e, '执行失败'));
            }
            else {
                spinner.fail('未知严重错误');
            }
        }
    });
}
//# sourceMappingURL=auto.js.map