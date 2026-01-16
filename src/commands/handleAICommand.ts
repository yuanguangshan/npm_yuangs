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
import { safeParseJSON, AICommandPlan } from '../core/validation';

export async function handleAICommand(
    userInput: string,
    options: { execute: boolean; model?: string }
) {
    const os = getOSProfile();
    const spinner = ora(chalk.cyan('🧠 AI 正在规划中...')).start();

    try {
        // 1️⃣ 让 AI 出计划
        const prompt = buildCommandPrompt(userInput, os);
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

        // 2️⃣ 风险兜底
        const finalRisk = assessRisk(plan.command, plan.risk);

        // 3️⃣ 展示给用户
        console.log(chalk.bold.cyan('\n🧠 计划: ') + plan.plan);
        console.log(chalk.bold.green('💻 命令: ') + chalk.yellow(plan.command));

        const riskColor = finalRisk === 'high' ? chalk.red : (finalRisk === 'medium' ? chalk.yellow : chalk.green);
        console.log(chalk.bold('⚠️  风险: ') + riskColor(finalRisk.toUpperCase()));

        // 4️⃣ 确认
        let shouldExecute = options.execute;
        if (!shouldExecute) {
            shouldExecute = await confirm('是否执行该命令？');
        }

        if (!shouldExecute) {
            console.log(chalk.gray('执行已取消。'));
            return;
        }

        // 5️⃣ 执行
        console.log(chalk.gray('\n执行中...\n'));
        let result = await exec(plan.command);

        // 6️⃣ 自动修复（仅一次）
        if (result.code !== 0 && result.code !== null) {
            console.log(chalk.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await autoFixCommand(
                plan.command,
                result.stderr,
                os,
                options.model
            );

            if (fixedPlan) {
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
                command: plan.command,
            });
            console.log(chalk.green('\n✓ 执行成功并已存入历史库'));
        }

        return result;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red('发生错误: ' + message));
    }
}
