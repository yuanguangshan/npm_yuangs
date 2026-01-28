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
/**
 * 执行单个任务
 */
async function executeTask(task, context, model, previousFeedback) {
    const prompt = [
        {
            role: 'system',
            content: `你是一个资深软件工程师。请根据任务描述生成完整的代码实现。

**重要输出格式要求：**
对于每个需要创建或修改的文件，请使用以下格式：

### 文件: src/path/to/file.ts
\`\`\`typescript
// 完整的文件代码
\`\`\`

要求：
1. 明确指出每个文件的完整路径
2. 提供完整的、可直接使用的代码
3. 包含必要的注释
4. 遵循最佳实践`
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
        const response = await (0, llm_1.runLLM)({
            prompt: { messages: prompt },
            model,
            stream: false,
            bypassRouter: true
        });
        return { code: response.rawText, success: true };
    }
    catch (e) {
        return { code: '', success: false };
    }
}
/**
 * 执行代码审查
 */
async function reviewCode() {
    try {
        const { CodeReviewer } = await Promise.resolve().then(() => __importStar(require('../../core/git/CodeReviewer')));
        const { getRouter } = await Promise.resolve().then(() => __importStar(require('../../core/modelRouter')));
        const gitService = new GitService_1.GitService();
        const router = getRouter();
        const reviewer = new CodeReviewer(gitService, router);
        const result = await reviewer.review(CodeReviewer_1.ReviewLevel.STANDARD, true);
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
        .action(async (options) => {
        const todoPath = path_1.default.join(process.cwd(), 'todo.md');
        const maxTasks = parseInt(options.maxTasks) || 5;
        const minScore = parseInt(options.minScore) || constants_1.MIN_REVIEW_SCORE;
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
                    const { code, success } = await executeTask(nextTask, rawContent, options.model, previousFeedback);
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
                            const { written, skipped } = await (0, CodeGenerator_1.writeGeneratedCode)(generated);
                            if (written.length > 0) {
                                console.log(chalk_1.default.green(`\n✅ 成功写入 ${written.length} 个文件`));
                            }
                            if (skipped.length > 0) {
                                console.log(chalk_1.default.yellow(`⚠️  跳过 ${skipped.length} 个文件`));
                            }
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
                        console.log(chalk_1.default.gray('💡 提示：请检查 AI 输出格式，或查看原始输出文件'));
                    }
                    // 3b. 代码审查（如果未跳过）
                    if (!options.skipReview) {
                        spinner.start('正在进行代码审查...');
                        const review = await reviewCode();
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
        }
        catch (e) {
            if (e instanceof Error && e.code === 'ENOENT') {
                spinner.fail('未找到 todo.md 文件');
                console.log(chalk_1.default.yellow('\n💡 建议流程:'));
                console.log(chalk_1.default.gray('  1. yuangs git plan "你的需求"  # 生成任务清单'));
                console.log(chalk_1.default.gray('  2. yuangs git auto            # 启动自动化工作流\n'));
            }
            else if (e instanceof llm_1.AIError) {
                spinner.fail(`AI 调用失败: ${e.message}`);
            }
            else if (e instanceof Error) {
                spinner.fail(`执行失败: ${e.message}`);
            }
            else {
                spinner.fail('未知错误');
            }
        }
    });
}
//# sourceMappingURL=auto.js.map