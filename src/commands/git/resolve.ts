import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { GitService } from '../../core/git/GitService';
import { ConflictResolver, ConflictResolutionResult } from '../../core/git/ConflictResolver';
import { DEFAULT_AI_MODEL, SUPPORTED_AI_MODELS } from '../../core/git/constants';
import pLimit from 'p-limit';

export function registerResolveCommand(gitCmd: Command) {
    gitCmd
        .command('resolve')
        .description('使用 AI 自动分析并解决当前仓库中的 Git 合并冲突')
        .option('-m, --model <model>', '使用的 AI 模型', DEFAULT_AI_MODEL)
        .option('-a, --auto-add', '冲突解决后自动执行 git add', false)
        .option('--dry-run', '预览分析结果，不实际修改文件', false)
        .option('--no-backup', '不生成备份文件 (.bak)', false)
        .option('-c, --concurrency <number>', '并发处理数量', '2')
        .action(async (options) => {
            const gitService = new GitService();
            const resolver = new ConflictResolver(gitService);
            const spinner = ora('正在检查冲突文件...').start();

            // 校验模型名称合法性 (正则 + 白名单)
            const isStandardModel = SUPPORTED_AI_MODELS.includes(options.model);
            const isValidFormat = /^[a-zA-Z0-9\-_/]+$/.test(options.model);

            if (!isValidFormat) {
                spinner.fail(`无效的模型名称格式: ${options.model}`);
                return;
            }

            if (!isStandardModel) {
                spinner.warn(`非官方推荐模型: ${chalk.yellow(options.model)} (可能解析效果不佳)`);
            }

            // 额外验证模型是否真实可用
            try {
                await runLLM({
                    prompt: {
                        system: "请回复 'OK'",
                        messages: [{ role: 'user', content: '测试模型连接' }]
                    },
                    model: options.model,
                    stream: false
                });
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                spinner.fail(`模型不可用: ${options.model} (${errorMessage})`);
                return;
            }

            try {
                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                const conflictedFiles = await gitService.getConflictedFiles();

                if (conflictedFiles.length === 0) {
                    spinner.succeed('未发现任何合并冲突');
                    return;
                }

                spinner.succeed(`发现 ${conflictedFiles.length} 个冲突文件:\n` +
                    conflictedFiles.map(f => chalk.red(`  • ${f}`)).join('\n') + '\n');

                const concurrency = Math.max(1, Math.min(10, parseInt(options.concurrency, 10) || 2)); // 限制并发数在1-10之间
                const limit = pLimit(concurrency);
                const results: ConflictResolutionResult[] = [];

                const tasks = conflictedFiles.map(file =>
                    limit(async () => {
                        const taskSpinner = ora(`正在解决: ${chalk.cyan(file)}...`).start();
                        try {
                            const result = await resolver.resolveFile(file, {
                                model: options.model,
                                dryRun: options.dryRun,
                                backup: options.backup !== false
                            });

                            if (result.success) {
                                taskSpinner.succeed(`解决成功: ${chalk.green(file}`);
                                if (result.backupFile && !options.dryRun) {
                                    console.log(chalk.gray(`  └─ 备份已生成: ${path.basename(result.backupFile)}`));
                                }
                                if (options.autoAdd && !options.dryRun) {
                                    await gitService.stageFiles([file]);
                                    console.log(chalk.gray(`  └─ 已执行 git add ${file}`));
                                }
                            } else {
                                taskSpinner.fail(`解决失败: ${chalk.red(file)}`);
                                if (result.error) {
                                    console.log(chalk.yellow(`     原因: ${result.error}`));
                                }
                            }
                            return result;
                        } catch (err: any) {
                            taskSpinner.fail(`执行异常: ${chalk.red(file)}`);
                            console.log(chalk.red(`     错误: ${err.message || String(err)}`));
                            return { file, success: false, error: err.message || String(err) };
                        }
                    })
                );

                // 使用更安全的 Promise.allSettled 替代，确保单个文件失败不会影响其他文件
                const promiseResults = await Promise.allSettled(tasks);

                for (const result of promiseResults) {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        // 处理 rejected 的情况
                        console.log(chalk.red(`     任务执行异常: ${result.reason.message || String(result.reason)}`));
                    }
                }

                const successCount = results.filter(r => r.success).length;
                console.log(chalk.bold(`\n✨ 完成！成功解决 ${successCount}/${results.length} 个文件的冲突\n`));

                if (options.dryRun) {
                    console.log(chalk.blue('💡 当前处于 Dry-run 模式，未对实际文件进行修改。'));
                } else if (successCount < results.length) {
                    console.log(chalk.yellow('💡 提示: 部分冲突无法自动解决，请手动检查。'));
                } else if (!options.autoAdd) {
                    console.log(chalk.cyan('💡 提示: 所有冲突已解决，请确认后执行 git add 提交。'));
                }

            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : String(error));
                spinner.fail(`执行过程中出现错误: ${errMsg}`);
            }
        });
}
