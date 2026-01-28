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
    const prompt = [
        {
            role: 'system',
            content: `你是一个全方位的交付专家。
1. 如果当前任务涉及代码（如 .ts, .js, .py 等文件），请扮演**资深软件工程师**，确保代码健壮、注释详尽、遵循最佳实践，并追求极致的模块化与性能。
2. 如果当前任务涉及文档（如 .md, .yaml, .html 等文件），请扮演**资深内容专家或历史学者**，确保叙事优美、逻辑严密、事实准确。

**重要输出格式要求：**
对于每个需要创建或修改的文件，请使用以下格式之一标明：

### 文件: path/to/file.ext
\`\`\`language
// 完整的具体内容
\`\`\`

或

\`\`\`filepath
文件路径
\`\`\`
\`\`\`code
文件具体内容
\`\`\`

要求：
1. 明确指出每个文件的完整路径。
2. 提供完整的、可直接使用的内容，禁止使用占位符（如 "// rest of code..."）。
3. 遵循所属领域（代码或文学）的全球最高标准最佳实践。
4. 确保文件路径格式与 todo.md 中的定义 100% 匹配。
5. 必须使用合适的代码块语法标明对应格式，便于解析引擎识别。`
        },
        {
            role: 'user',
            content: `
[项目上下文]
${context}

[当前任务]
${task.description}

${previousFeedback ? `\n[上次实现的问题]\n${previousFeedback}\n\n请根据以上反馈重新实现。` : ''}

请生成完整的实现代码，并明确标注每个文件的路径。
`
        }
    ];
    try {
        const response = await (0, ErrorHandler_1.withRetry)(() => (0, llm_1.runLLM)({
            prompt: { messages: prompt },
            model,
            stream: false,
            bypassRouter: true
        }), {
            maxAttempts: 3,
            delay: 1000,
            backoff: true,
            shouldRetry: ErrorHandler_1.isRetryableError,
            onRetry: (error, attempt) => {
                console.log(chalk_1.default.yellow(`⚠️  AI 调用失败，第 ${attempt} 次重试...`));
            }
        });
        return { code: response.rawText, success: true };
    }
    catch (e) {
        const errorMsg = e.message || '未知错误';
        console.error(chalk_1.default.red(`\n❌ AI 执行阶段发生异常: ${errorMsg}`));
        return { code: '', success: false, error: errorMsg };
    }
}
/**
 * 执行代码审查
 */
async function reviewCode(staged = true) {
    try {
        const { CodeReviewer } = await Promise.resolve().then(() => __importStar(require('../../core/git/CodeReviewer')));
        const { getRouter } = await Promise.resolve().then(() => __importStar(require('../../core/modelRouter')));
        const gitService = new GitService_1.GitService();
        const router = getRouter();
        const reviewer = new CodeReviewer(gitService, router);
        const result = await (0, ErrorHandler_1.withRetry)(() => reviewer.review(CodeReviewer_1.ReviewLevel.STANDARD, staged), {
            maxAttempts: 2,
            delay: 500,
            backoff: true,
            shouldRetry: ErrorHandler_1.isRetryableError,
            onRetry: (error, attempt) => {
                console.log(chalk_1.default.yellow(`⚠️  代码审查失败，第 ${attempt} 次重试...`));
            }
        });
        return {
            score: result.score,
            issues: result.issues.map(i => `${i.severity}: ${i.message}`)
        };
    }
    catch (e) {
        const errorMsg = e instanceof Error ? e.message : '未知错误';
        console.warn(chalk_1.default.yellow(`⚠️  代码审查失败: ${errorMsg}`));
        // 审查失败时返回低分，避免掩盖问题
        return {
            score: constants_1.REVIEW_FAILURE_SCORE,
            issues: [`审查系统错误: ${errorMsg}`],
            error: errorMsg
        };
    }
}
/**
 * 注册 git auto 命令
 */
function registerAutoCommand(gitCmd) {
    gitCmd
        .command('auto')
        .description('全自动工作流：plan → exec → review 循环')
        .option('--max-tasks <number>', '最大执行任务数', '5')
        .option('--model <model>', '指定 AI 模型', 'Assistant')
        .option('--min-score <score>', '最低审查分数', '85')
        .option('--skip-review', '跳过代码审查')
        .option('--save-only', '只保存代码，不写入文件系统')
        .option('--commit', '所有任务完成后自动提交')
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
            const { metadata, tasks, rawContent } = await (0, TodoManager_1.parseTodoFile)(todoPath);
            if (tasks.length === 0) {
                spinner.fail('未找到任何任务');
                console.log(chalk_1.default.yellow('💡 提示：请先运行 yuangs git plan 生成任务'));
                return;
            }
            spinner.succeed(`发现 ${tasks.length} 个任务`);
            const progress = (0, TodoManager_1.calculateProgress)(tasks);
            console.log(chalk_1.default.cyan(`📊 当前进度: ${progress.completed}/${progress.total}\n`));
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
                    console.log(chalk_1.default.green('\n🎉 所有任务已完成！'));
                    break;
                }
                console.log(chalk_1.default.bold.cyan(`\n━━━ 任务 #${nextTask.index + 1} ━━━`));
                console.log(chalk_1.default.white(`📝 ${nextTask.description}\n`));
                let attempts = nextTask.attempts || 0;
                let taskCompleted = false;
                while (attempts <= constants_1.MAX_RETRY_ATTEMPTS && !taskCompleted) {
                    attempts++;
                    // 3a. 执行任务
                    spinner.start(`[尝试 ${attempts}/${constants_1.MAX_RETRY_ATTEMPTS + 1}] 正在生成代码...`);
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
                    spinner.text = `[尝试 ${attempts}/${constants_1.MAX_RETRY_ATTEMPTS + 1}] 正在生成实现方案...`;
                    const { code, success } = await executeTask(nextTask, gathered.summary, options.model, previousFeedback);
                    if (!success) {
                        spinner.fail('代码生成失败');
                        await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                            execStatus: 'failed'
                        });
                        break;
                    }
                    spinner.succeed('代码已生成');
                    // 3b. 保存原始输出
                    const savedPath = await (0, CodeGenerator_1.saveRawOutput)(code, nextTask.index);
                    console.log(chalk_1.default.gray(`📄 原始输出已保存: ${path_1.default.relative(process.cwd(), savedPath)}`));
                    // 3c. 解析并写入代码
                    const generated = (0, CodeGenerator_1.parseGeneratedCode)(code);
                    if (generated.files.length > 0) {
                        console.log(chalk_1.default.cyan(`\n📦 检测到 ${generated.files.length} 个文件:\n`));
                        if (!options.saveOnly) {
                            // 写入前备份
                            spinner.start('正在备份当前文件状态...');
                            let backupId;
                            try {
                                const backup = await (0, CodeGenerator_1.backupFiles)(generated.files);
                                backupId = backup.id;
                                spinner.succeed('文件状态已备份');
                            }
                            catch (e) {
                                spinner.warn('备份失败，继续执行');
                            }
                            const { written, skipped } = await (0, CodeGenerator_1.writeGeneratedCode)(generated);
                            if (written.length > 0) {
                                console.log(chalk_1.default.green(`\n✅ 成功写入 ${written.length} 个文件`));
                            }
                            if (skipped.length > 0) {
                                console.log(chalk_1.default.yellow(`⚠️  跳过 ${skipped.length} 个文件`));
                            }
                            // 保存备份ID
                            await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                                backupId
                            });
                            nextTask.backupId = backupId;
                        }
                        else {
                            console.log(chalk_1.default.gray('  (--save-only 模式，未写入文件系统)'));
                            generated.files.forEach(f => {
                                console.log(chalk_1.default.gray(`  - ${f.path}`));
                            });
                        }
                    }
                    else {
                        console.log(chalk_1.default.yellow('\n⚠️  未检测到可解析的文件路径和代码'));
                        console.log(chalk_1.default.yellow('\n💡 可能的原因：'));
                        console.log(chalk_1.default.gray('  1. AI 输出格式不符合要求'));
                        console.log(chalk_1.default.gray('  2. 文件路径标识不正确'));
                        console.log(chalk_1.default.gray('  3. 代码块格式错误'));
                        console.log(chalk_1.default.cyan(`\n📄 原始输出文件: ${path_1.default.relative(process.cwd(), savedPath)}`));
                        console.log(chalk_1.default.gray('\n💡 提示：请检查原始输出文件，确认格式是否正确'));
                        console.log(chalk_1.default.gray('\n支持的格式: ### 文件: path, **path**, ```filepath/path```, ## 📄 文件：`path``'));
                    }
                    // 3b. 代码审查（如果未跳过）
                    if (!options.skipReview) {
                        spinner.start('正在进行代码审查...');
                        // 审查刚刚写入但尚未暂存的文件 (staged: false)
                        const review = await reviewCode(false);
                        spinner.succeed(`审查完成 (评分: ${review.score}/100)`);
                        await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                            reviewScore: review.score,
                            reviewIssues: review.issues
                        });
                        // 3c. 判断是否通过
                        if (review.score >= minScore) {
                            console.log(chalk_1.default.green(`✅ 审查通过！(${review.score} >= ${minScore})\n`));
                            taskCompleted = true;
                            await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                                completed: true,
                                execStatus: 'done'
                            });
                            nextTask.completed = true;
                        }
                        else {
                            console.log(chalk_1.default.yellow(`⚠️  审查未通过 (${review.score} < ${minScore})`));
                            if (review.issues.length > 0) {
                                console.log(chalk_1.default.yellow('问题列表:'));
                                review.issues.forEach(issue => {
                                    console.log(chalk_1.default.yellow(`  • ${issue}`));
                                });
                            }
                            if (attempts <= constants_1.MAX_RETRY_ATTEMPTS) {
                                console.log(chalk_1.default.cyan(`\n🔄 将根据反馈重新生成...\n`));
                            }
                            else {
                                console.log(chalk_1.default.red(`\n❌ 已达最大重试次数，跳过此任务\n`));
                                // 回滚代码
                                if (nextTask.backupId) {
                                    spinner.start('正在回滚代码变更...');
                                    try {
                                        await (0, CodeGenerator_1.restoreFromBackup)(nextTask.backupId);
                                        spinner.succeed('代码已回滚');
                                    }
                                    catch (e) {
                                        const errorMsg = e instanceof Error ? e.message : '未知错误';
                                        spinner.warn(`回滚失败: ${errorMsg}`);
                                    }
                                }
                                await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                                    execStatus: 'failed'
                                });
                            }
                        }
                    }
                    else {
                        // 跳过审查，直接标记完成
                        console.log(chalk_1.default.gray('⏭️  已跳过代码审查\n'));
                        taskCompleted = true;
                        await (0, TodoManager_1.updateTaskStatus)(todoPath, nextTask.index, {
                            completed: true,
                            execStatus: 'done'
                        });
                        nextTask.completed = true;
                    }
                }
                tasksExecuted++;
                // 更新进度管理器
                await progressManager.incrementTaskExecuted();
                await progressManager.updateCurrentTask(nextTask.index + 1);
                // 更新总体进度
                const newProgress = (0, TodoManager_1.calculateProgress)(tasks);
                await (0, TodoManager_1.updateMetadata)(todoPath, {
                    progress: newProgress,
                    currentTask: nextTask.index + 1
                });
            }
            // 4. 总结
            const finalProgress = (0, TodoManager_1.calculateProgress)(tasks);
            console.log(chalk_1.default.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk_1.default.bold.cyan('📊 工作流执行完成'));
            console.log(chalk_1.default.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
            console.log(chalk_1.default.white(`✅ 已完成: ${finalProgress.completed}/${finalProgress.total}`));
            console.log(chalk_1.default.white(`🔄 本次执行: ${tasksExecuted} 个任务\n`));
            if (finalProgress.completed < finalProgress.total) {
                console.log(chalk_1.default.yellow('💡 提示：还有未完成的任务，可以再次运行 yuangs git auto 继续'));
            }
            // 导出进度报告
            const reportMetadata = {
                ...metadata,
                progress: finalProgress
            };
            const reportPath = await progressManager.exportReport(reportMetadata);
            console.log(chalk_1.default.gray(`\n📊 进度报告已保存: ${path_1.default.relative(process.cwd(), reportPath)}`));
            // 清理状态
            if (finalProgress.completed === finalProgress.total) {
                await progressManager.clear();
            }
            if (options.commit && finalProgress.completed === finalProgress.total) {
                // 5. 自动提交
                const gitService = new GitService_1.GitService();
                const isClean = await gitService.isWorkingTreeClean();
                if (!isClean) {
                    console.log(chalk_1.default.cyan('🚀 准备自动提交...\n'));
                    // 暂存所有变更
                    spinner.start('正在暂存所有变更...');
                    await gitService.stageAll();
                    spinner.succeed('已暂存所有变更');
                    // 生成提交信息
                    let commitMessage;
                    if (options.commitMessage) {
                        commitMessage = options.commitMessage;
                        spinner.succeed('使用自定义提交信息');
                    }
                    else {
                        spinner.start('正在生成提交信息...');
                        const router = await (await Promise.resolve().then(() => __importStar(require('../../core/modelRouter')))).getRouter();
                        const commitGen = new CommitMessageGenerator_1.CommitMessageGenerator(gitService, router);
                        const commit = await commitGen.generate({ detailed: false });
                        commitMessage = commit.full;
                        spinner.succeed('提交信息已生成');
                    }
                    console.log(chalk_1.default.gray(`\n📝 提交信息:\n  ${commitMessage}\n`));
                    // 执行提交
                    spinner.start('正在提交...');
                    try {
                        await gitService.commit(commitMessage);
                        spinner.succeed('提交成功！');
                        console.log(chalk_1.default.green('✅ 代码已自动提交到 Git 仓库'));
                    }
                    catch (error) {
                        spinner.fail('提交失败');
                        console.log(chalk_1.default.red(`错误: ${error.message}`));
                        console.log(chalk_1.default.yellow('💡 请手动提交代码'));
                    }
                }
                else {
                    console.log(chalk_1.default.yellow('\n⚠️  没有需要提交的变更'));
                }
            }
            else if (finalProgress.completed === finalProgress.total) {
                console.log(chalk_1.default.cyan('\n💡 提示：所有任务已完成'));
                console.log(chalk_1.default.gray('   使用 --commit 选项可以自动提交代码'));
            }
        }
        catch (e) {
            if (e instanceof Error && e.code === 'ENOENT') {
                spinner.fail('未找到 todo.md 文件');
                console.log(chalk_1.default.yellow('\n💡 建议流程:'));
                console.log(chalk_1.default.gray('  1. yuangs git plan "你的需求"  # 生成任务清单'));
                console.log(chalk_1.default.gray('  2. yuangs git auto            # 启动自动化工作流\n'));
            }
            else if (e instanceof llm_1.AIError) {
                spinner.fail((0, ErrorHandler_1.formatError)(e, 'AI 调用失败'));
                const suggestion = (0, ErrorHandler_1.getSuggestion)(e);
                if (suggestion) {
                    console.log(chalk_1.default.yellow(`💡 ${suggestion}`));
                }
            }
            else if (e instanceof Error) {
                spinner.fail((0, ErrorHandler_1.formatError)(e, '执行失败'));
                const suggestion = (0, ErrorHandler_1.getSuggestion)(e);
                if (suggestion) {
                    console.log(chalk_1.default.yellow(`💡 ${suggestion}`));
                }
            }
            else {
                spinner.fail('未知错误');
            }
        }
    });
}
//# sourceMappingURL=auto.js.map