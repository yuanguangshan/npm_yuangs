import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { ProgressBar } from '../../utils/ProgressBar';
import { CLIComponent } from '../../utils/CLIComponent';
import { GitService } from '../../core/git/GitService';
import { runLLM, AIError } from '../../agent/llm';
import { AIRequestMessage } from '../../core/validation';
import {
    parseTodoFile,
    updateTaskStatus,
    updateMetadata,
    getNextTask,
    calculateProgress,
    TaskStatus
} from '../../core/git/TodoManager';
import { ReviewLevel, CodeReviewer } from '../../core/git/CodeReviewer';
import {
    MAX_RETRY_ATTEMPTS,
    MIN_REVIEW_SCORE,
    REVIEW_FAILURE_SCORE,
    DEFAULT_AI_MODEL
} from '../../core/git/constants';
import {
    parseGeneratedCode,
    writeGeneratedCode,
    saveRawOutput,
    backupFiles,
    restoreFromBackup,
    cleanOldBackups,
    BackupInfo
} from '../../core/git/CodeGenerator';
import { CommitMessageGenerator } from '../../core/git/CommitMessageGenerator';
import {
    withRetry,
    isRetryableError,
    formatError,
    getSuggestion
} from '../../core/git/ErrorHandler';
import { ProgressManager } from '../../core/git/ProgressManager';
import { ContextGatherer } from '../../core/git/ContextGatherer';

/**
 * 执行单个任务
 */
async function executeTask(
    task: TaskStatus,
    context: string,
    model: string,
    previousFeedback?: string
): Promise<{ code: string; success: boolean; error?: string }> {
    try {
        const response = await runLLM({
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
            model: model || DEFAULT_AI_MODEL,
            stream: false
        });
        return { code: response.rawText, success: true };
    } catch (error: any) {
        return { code: '', success: false, error: error.message };
    }
}

/**
 * 代码审查包装器
 */
async function reviewCode(level: ReviewLevel, staged: boolean = true) {
    const gitService = new GitService();
    const reviewer = new CodeReviewer(gitService);
    return await reviewer.review(level, staged);
}

export function registerAutoCommand(gitCmd: Command) {
    gitCmd
        .command('auto')
        .description('自动执行 todo.md 中的任务，直到全部完成或达到最大限制')
        .option('-n, --max-tasks <number>', '本次运行执行的最大任务数', '5')
        .option('-m, --model <model>', '使用的 AI 模型', DEFAULT_AI_MODEL)
        .option('-s, --min-score <number>', '任务通过所需的最低评分', MIN_REVIEW_SCORE.toString())
        .option('-l, --review-level <level>', '代码审查级别 (quick/standard/deep)', 'standard')
        .option('--skip-review', '跳过代码审查')
        .option('-o, --save-only', '只保存代码，不写入文件系统')
        .option('-c, --commit', '所有任务完成后自动提交')
        .option('--commit-message <msg>', '自定义提交信息（使用 --commit 时生效）')
        .action(async (options) => {
            const todoPath = path.join(process.cwd(), 'todo.md');
            const maxTasks = parseInt(options.maxTasks) || 5;
            const minScore = parseInt(options.minScore) || MIN_REVIEW_SCORE;

            const progressManager = new ProgressManager();

            console.log(chalk.bold.cyan('\n🤖 启动全自动 AI 开发工作流...\n'));
            console.log(chalk.gray(`📋 最大任务数: ${maxTasks}`));
            console.log(chalk.gray(`🎯 最低审查分数: ${minScore}`));
            console.log(chalk.gray(`🤖 AI 模型: ${options.model}\n`));

            const spinner = ora('正在初始化...').start();

            try {
                // 1. 检查 todo.md 是否存在
                await fs.promises.access(todoPath, fs.constants.F_OK);

                // 2. 解析任务
                const { metadata, tasks } = await parseTodoFile(todoPath);

                if (tasks.length === 0) {
                    spinner.fail('未找到任何任务');
                    console.log(chalk.yellow('💡 提示：请先运行 yuangs git plan 生成任务'));
                    return;
                }

                spinner.succeed(`发现 ${tasks.length} 个任务`);

                const progress = calculateProgress(tasks);
                const progressBar = new ProgressBar({
                    total: progress.total,
                    template: `${chalk.cyan('总体进度:')} {bar} {percentage}% | {value}/{total} 已完成`
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
                    const nextTask = getNextTask(tasks);

                    if (!nextTask) {
                        break;
                    }

                    // 使用组件渲染任务面板
                    CLIComponent.renderTaskPanel(nextTask.index + 1, nextTask.description, nextTask.priority);

                    let attempts = nextTask.attempts || 0;
                    let taskCompleted = false;

                    while (attempts <= MAX_RETRY_ATTEMPTS && !taskCompleted) {
                        attempts++;

                        // 3a. 执行任务
                        spinner.start(`[尝试 ${attempts}/${MAX_RETRY_ATTEMPTS + 1}] 正在生成方案...`);

                        await updateTaskStatus(todoPath, nextTask.index, {
                            execStatus: 'in_progress',
                            attempts
                        });

                        const previousFeedback = attempts > 1 && nextTask.reviewIssues
                            ? nextTask.reviewIssues.join('\n')
                            : undefined;

                        // 采集真实上下文
                        spinner.text = `[尝试 ${attempts}] 正在采集项目上下文...`;
                        const gitService = new GitService();
                        const gatherer = new ContextGatherer(gitService);
                        const gathered = await gatherer.gather(nextTask.description);

                        spinner.text = `[尝试 ${attempts}] 正在向 AI 请求代码生成...`;

                        const { code, success } = await executeTask(
                            nextTask,
                            gathered.summary,
                            options.model,
                            previousFeedback
                        );

                        if (!success) {
                            spinner.fail('代码生成失败');
                            await updateTaskStatus(todoPath, nextTask.index, {
                                execStatus: 'failed'
                            });
                            break;
                        }

                        spinner.succeed('方案生成完成');

                        // 3b. 保存原始输出
                        const savedPath = await saveRawOutput(code, nextTask.index);
                        progressBar.log(chalk.gray(`📄 原始输出已保存: ${path.relative(process.cwd(), savedPath)}`));

                        // 3c. 解析并写入代码
                        const generated = parseGeneratedCode(code);

                        if (generated.files.length > 0) {
                            progressBar.log(chalk.cyan(`\n📦 完成代码解析，涉及 ${generated.files.length} 个文件`));

                            if (!options.saveOnly) {
                                spinner.start('正在备份并写入文件...');
                                let backupId: string | undefined;
                                try {
                                    const backup = await backupFiles(generated.files);
                                    backupId = backup.id;
                                } catch (e: unknown) { }

                                const { written } = await writeGeneratedCode(generated);
                                spinner.succeed(`已更新 ${written.length} 个文件`);

                                // 保存备份ID
                                await updateTaskStatus(todoPath, nextTask.index, { backupId });
                                nextTask.backupId = backupId;
                            }
                        }

                        // 3d. 代码审查
                        if (!options.skipReview) {
                            spinner.start('正在进行 AI 质量审查...');
                            const levelMap: Record<string, ReviewLevel> = {
                                'quick': ReviewLevel.QUICK,
                                'standard': ReviewLevel.STANDARD,
                                'deep': ReviewLevel.DEEP
                            };
                            const reviewLevel = levelMap[options.reviewLevel] || ReviewLevel.STANDARD;
                            const review = await reviewCode(reviewLevel, false);

                            spinner.succeed(`审查完成 (评分: ${review.score}/100)`);

                            await updateTaskStatus(todoPath, nextTask.index, {
                                reviewScore: review.score,
                                reviewIssues: review.issues.map(i => i.message)
                            });

                            if (review.score >= minScore) {
                                progressBar.log(chalk.green(`✅ 质量达标 (${review.score} pts)`));
                                taskCompleted = true;
                                await updateTaskStatus(todoPath, nextTask.index, {
                                    completed: true,
                                    execStatus: 'done'
                                });
                                nextTask.completed = true;
                            } else {
                                progressBar.log(chalk.yellow(`⚠️ 质量不合格 (${review.score} < ${minScore})`));
                                if (attempts > MAX_RETRY_ATTEMPTS) {
                                    progressBar.log(chalk.red(`❌ 达到最大尝试次数，任务失败`));
                                    await updateTaskStatus(todoPath, nextTask.index, { execStatus: 'failed' });
                                }
                            }
                        } else {
                            progressBar.log(chalk.gray('⏭️  已跳过代码审查'));
                            taskCompleted = true;
                            await updateTaskStatus(todoPath, nextTask.index, {
                                completed: true,
                                execStatus: 'done'
                            });
                            nextTask.completed = true;
                        }
                    }

                    tasksExecuted++;

                    // 更新总体进度
                    const newProgress = calculateProgress(tasks);
                    progressBar.update(newProgress.completed);
                    console.log('\n');
                }

                // 4. 总结
                const finalProgress = calculateProgress(tasks);
                CLIComponent.renderSummaryPanel(
                    finalProgress.completed,
                    finalProgress.total,
                    tasksExecuted,
                    finalProgress.completed < finalProgress.total
                );

                if (options.commit && finalProgress.completed === finalProgress.total) {
                    const gitService = new GitService();
                    if (!(await gitService.isWorkingTreeClean())) {
                        spinner.start('准备自动提交...');
                        await gitService.stageAll();
                        const router = await (await import('../../core/modelRouter')).getRouter();
                        const commitGen = new CommitMessageGenerator(gitService, router);
                        const commit = await commitGen.generate({ detailed: false });
                        await gitService.commit(commit.full);
                        spinner.succeed('已完成自动提交');
                    }
                }

            } catch (e: unknown) {
                if (e instanceof Error && (e as any).code === 'ENOENT') {
                    spinner.fail('未找到 todo.md 文件');
                } else if (e instanceof AIError) {
                    spinner.fail(formatError(e, 'AI 调用失败'));
                } else if (e instanceof Error) {
                    spinner.fail(formatError(e, '执行失败'));
                } else {
                    spinner.fail('未知严重错误');
                }
            }
        });
}
