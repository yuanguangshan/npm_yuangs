"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAICommand = handleAICommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const os_1 = require("../core/os");
const prompt_1 = require("../ai/prompt");
const client_1 = require("../ai/client");
const executor_1 = require("../core/executor");
const risk_1 = require("../core/risk");
const autofix_1 = require("../core/autofix");
const confirm_1 = require("../utils/confirm");
const history_1 = require("../utils/history");
const validation_1 = require("../core/validation");
const macros_1 = require("../core/macros");
function validateAIPlan(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.plan === 'string' &&
        ['low', 'medium', 'high'].includes(obj.risk) &&
        (typeof obj.command === 'string' || typeof obj.macro === 'string'));
}
async function handleAICommand(userInput, options) {
    const os = (0, os_1.getOSProfile)();
    const macros = (0, macros_1.getMacros)();
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('🧠 AI 正在规划中...')).start();
    try {
        // 1️⃣ 让 AI 出计划
        const prompt = (0, prompt_1.buildCommandPrompt)(userInput, os, macros);
        const raw = await (0, client_1.askAI)(prompt, options.model);
        spinner.stop();
        const { aiCommandPlanSchema } = require('../core/validation');
        const parseResult = (0, validation_1.safeParseJSON)(raw, aiCommandPlanSchema, {});
        if (!parseResult.success) {
            console.log(chalk_1.default.red('\n❌ AI 输出不是合法 JSON:'));
            console.log(raw);
            console.log(chalk_1.default.gray('\n验证错误: ' + parseResult.error.issues.map((e) => e.message).join(', ')));
            return;
        }
        const plan = parseResult.data;
        // Determine if we're using a macro or a new command
        const isUsingMacro = !!plan.macro;
        let actualCommand = plan.macro ? macros[plan.macro]?.commands : plan.command;
        if (!actualCommand) {
            console.log(chalk_1.default.red('\n❌ 无效的计划：'));
            if (plan.macro) {
                console.log(chalk_1.default.red(`未找到名为 "${plan.macro}" 的 Macro`));
            }
            else {
                console.log(chalk_1.default.red('未提供有效的命令'));
            }
            return;
        }
        const commandToExecute = actualCommand;
        // 2️⃣ 风险兜底
        const finalRisk = (0, risk_1.assessRisk)(commandToExecute, plan.risk);
        // 3️⃣ 展示给用户
        console.log(chalk_1.default.bold.cyan('\n🧠 计划: ') + plan.plan);
        if (isUsingMacro) {
            console.log(chalk_1.default.bold.green('✨ 复用 Macro: ') + chalk_1.default.yellow(plan.macro));
            console.log(chalk_1.default.gray('   (已验证的命令，无需重新生成)'));
        }
        else {
            console.log(chalk_1.default.bold.green('💻 命令: ') + chalk_1.default.yellow(commandToExecute));
        }
        const riskColor = finalRisk === 'high' ? chalk_1.default.red : (finalRisk === 'medium' ? chalk_1.default.yellow : chalk_1.default.green);
        console.log(chalk_1.default.bold('⚠️  风险判断: ') + riskColor(finalRisk.toUpperCase()));
        // Check Dry Run
        if (options.dryRun) {
            console.log(chalk_1.default.gray('\n[Dry Run] 仅模拟，不执行命令。'));
            return;
        }
        // 4️⃣ 确认
        console.log(chalk_1.default.gray('─'.repeat(50)));
        if (isUsingMacro) {
            console.log(chalk_1.default.yellow('⚠️  注意: AI 正在复用已验证的 Macro。'));
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  注意: 以上命令由 AI 生成，请在执行前仔细检查。'));
            console.log(chalk_1.default.gray('   AI 可能会犯错，安全由您掌控。'));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        let shouldExecute = options.execute || options.autoYes;
        // If high risk, maybe force confirm even with autoYes?
        // For now, let's respect autoYes as the "I know what I'm doing" flag.
        // But if risk is high and NOT autoYes, we definitely ask.
        if (!shouldExecute) {
            shouldExecute = await (0, confirm_1.confirm)('是否执行该命令？');
        }
        if (!shouldExecute) {
            console.log(chalk_1.default.gray('执行已取消。'));
            return;
        }
        // 5️⃣ 执行
        console.log(chalk_1.default.gray('\n执行中...\n'));
        let result;
        if (isUsingMacro) {
            const macroSuccess = (0, macros_1.runMacro)(plan.macro);
            result = { code: 0, stdout: '', stderr: '' };
            console.log(chalk_1.default.green('✓ Macro 已执行'));
        }
        else {
            result = await (0, executor_1.exec)(commandToExecute);
        }
        // 6️⃣ 自动修复（仅针对新生成的命令，不针对 Macros）
        if (!isUsingMacro && result.code !== 0 && result.code !== null) {
            console.log(chalk_1.default.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await (0, autofix_1.autoFixCommand)(commandToExecute, result.stderr, os, options.model);
            if (fixedPlan && fixedPlan.command) {
                console.log(chalk_1.default.bold.cyan('🔁 修复方案: ') + fixedPlan.plan);
                console.log(chalk_1.default.bold.green('💻 修复命令: ') + chalk_1.default.yellow(fixedPlan.command));
                const retry = await (0, confirm_1.confirm)('是否执行修复后的命令？');
                if (retry) {
                    console.log(chalk_1.default.gray('\n正在重试...\n'));
                    result = await (0, executor_1.exec)(fixedPlan.command);
                    if (result.code === 0) {
                        (0, history_1.saveHistory)({
                            question: userInput,
                            command: fixedPlan.command,
                        });
                        console.log(chalk_1.default.green('\n✓ 修复命令执行成功并已存入历史库'));
                        return result;
                    }
                }
            }
        }
        // 7️⃣ 记录历史
        if (result.code === 0) {
            (0, history_1.saveHistory)({
                question: userInput,
                command: commandToExecute,
            });
            if (isUsingMacro) {
                console.log(chalk_1.default.green('\n✓ Macro 执行成功并已存入历史库'));
            }
            else {
                console.log(chalk_1.default.green('\n✓ 执行成功并已存入历史库'));
            }
        }
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk_1.default.red('发生错误: ' + message));
    }
}
//# sourceMappingURL=handleAICommand.js.map