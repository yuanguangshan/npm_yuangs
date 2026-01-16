import chalk from 'chalk';
import ora from 'ora';
import { getOSProfile } from '../core/os';
import { buildCommandPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { exec } from '../core/executor';
import { assessRisk } from '../core/risk';
import { autoFixCommand } from '../core/autofix';
import { confirm } from '../utils/confirm';
import { saveHistory } from '../utils/history';
import { safeParseJSON, AICommandPlan, AIFixPlan } from '../core/validation';
import { getMacros, runMacro } from '../core/macros';

function validateAIPlan(obj: any): obj is AICommandPlan {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.plan === 'string' &&
        ['low', 'medium', 'high'].includes(obj.risk) &&
        (typeof obj.command === 'string' || typeof obj.macro === 'string')
    );
}

export async function handleAICommand(
    userInput: string,
    options: { execute: boolean; model?: string; dryRun?: boolean; autoYes?: boolean }
) {
    const os = getOSProfile();
    const macros = getMacros();
    const spinner = ora(chalk.cyan('🧠 AI 正在规划中...')).start();

    try {
        // 1️⃣ 让 AI 出计划
        const prompt = buildCommandPrompt(userInput, os, macros);
        const raw = await askAI(prompt, options.model);
        spinner.stop();

        const { aiCommandPlanSchema } = require('../core/validation');
        const parseResult = safeParseJSON(raw, aiCommandPlanSchema, {} as AICommandPlan);

        if (!parseResult.success) {
            console.log(chalk.red('\n❌ AI 输出不是合法 JSON:'));
            console.log(raw);
            console.log(chalk.gray('\n验证错误: ' + parseResult.error.issues.map((e: any) => e.message).join(', ')));
            return;
        }

        const plan = parseResult.data;

        // Determine if we're using a macro or a new command
        const isUsingMacro = !!plan.macro;
        let actualCommand = plan.macro ? macros[plan.macro]?.commands : plan.command;

        if (!actualCommand) {
            console.log(chalk.red('\n❌ 无效的计划：'));
            if (plan.macro) {
                console.log(chalk.red(`未找到名为 "${plan.macro}" 的 Macro`));
            } else {
                console.log(chalk.red('未提供有效的命令'));
            }
            return;
        }

        const commandToExecute: string = actualCommand;

        // 2️⃣ 风险兜底
        const finalRisk = assessRisk(commandToExecute, plan.risk);

        // 3️⃣ 展示给用户
        console.log(chalk.bold.cyan('\n🧠 计划: ') + plan.plan);

        if (isUsingMacro) {
            console.log(chalk.bold.green('✨ 复用 Macro: ') + chalk.yellow(plan.macro!));
            console.log(chalk.gray('   (已验证的命令，无需重新生成)'));
        } else {
            console.log(chalk.bold.green('💻 命令: ') + chalk.yellow(commandToExecute));
        }

        const riskColor = finalRisk === 'high' ? chalk.red : (finalRisk === 'medium' ? chalk.yellow : chalk.green);
        console.log(chalk.bold('⚠️  风险判断: ') + riskColor(finalRisk.toUpperCase()));

        // Check Dry Run
        if (options.dryRun) {
            console.log(chalk.gray('\n[Dry Run] 仅模拟，不执行命令。'));
            return;
        }

        // 4️⃣ 确认
        console.log(chalk.gray('─'.repeat(50)));
        if (isUsingMacro) {
            console.log(chalk.yellow('⚠️  注意: AI 正在复用已验证的 Macro。'));
        } else {
            console.log(chalk.yellow('⚠️  注意: 以上命令由 AI 生成，请在执行前仔细检查。'));
            console.log(chalk.gray('   AI 可能会犯错，安全由您掌控。'));
        }
        console.log(chalk.gray('─'.repeat(50)));

        let shouldExecute = options.execute || options.autoYes;

        // If high risk, maybe force confirm even with autoYes?
        // For now, let's respect autoYes as the "I know what I'm doing" flag.
        // But if risk is high and NOT autoYes, we definitely ask.
        if (!shouldExecute) {
            shouldExecute = await confirm('是否执行该命令？');
        }

        if (!shouldExecute) {
            console.log(chalk.gray('执行已取消。'));
            return;
        }

        // 5️⃣ 执行
        console.log(chalk.gray('\n执行中...\n'));
        let result: { code: number | null; stdout?: string; stderr?: string };

        if (isUsingMacro) {
            const macroSuccess = runMacro(plan.macro!);
            result = { code: 0, stdout: '', stderr: '' };
            console.log(chalk.green('✓ Macro 已执行'));
        } else {
            result = await exec(commandToExecute);
        }

        // 6️⃣ 自动修复（仅针对新生成的命令，不针对 Macros）
        if (!isUsingMacro && result.code !== 0 && result.code !== null) {
            console.log(chalk.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await autoFixCommand(
                commandToExecute,
                result.stderr!,
                os,
                options.model
            );

            if (fixedPlan && fixedPlan.command) {
                console.log(chalk.bold.cyan('🔁 修复方案: ') + fixedPlan.plan);
                console.log(chalk.bold.green('💻 修复命令: ') + chalk.yellow(fixedPlan.command));

                const retry = await confirm('是否执行修复后的命令？');
                if (retry) {
                    console.log(chalk.gray('\n正在重试...\n'));
                    result = await exec(fixedPlan.command);
                    if (result.code === 0) {
                        saveHistory({
                            question: userInput,
                            command: fixedPlan.command,
                        });
                        console.log(chalk.green('\n✓ 修复命令执行成功并已存入历史库'));
                        return result;
                    }
                }
            }
        }

        // 7️⃣ 记录历史
        if (result.code === 0) {
            saveHistory({
                question: userInput,
                command: commandToExecute,
            });
            if (isUsingMacro) {
                console.log(chalk.green('\n✓ Macro 执行成功并已存入历史库'));
            } else {
                console.log(chalk.green('\n✓ 执行成功并已存入历史库'));
            }
        }

        return result;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red('发生错误: ' + message));
    }
}
