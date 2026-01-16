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
async function handleAICommand(userInput, options) {
    const os = (0, os_1.getOSProfile)();
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('🧠 AI 正在规划中...')).start();
    try {
        // 1️⃣ 让 AI 出计划
        const prompt = (0, prompt_1.buildCommandPrompt)(userInput, os);
        const raw = await (0, client_1.askAI)(prompt, options.model);
        spinner.stop();
        let plan;
        try {
            // Extract JSON if AI wrapped it in triple backticks
            let jsonContent = raw;
            if (raw.includes('```json')) {
                jsonContent = raw.split('```json')[1].split('```')[0].trim();
            }
            else if (raw.includes('```')) {
                jsonContent = raw.split('```')[1].split('```')[0].trim();
            }
            plan = JSON.parse(jsonContent);
        }
        catch {
            console.log(chalk_1.default.red('\n❌ AI 输出不是合法 JSON:'));
            console.log(raw);
            return;
        }
        // 2️⃣ 风险兜底
        const finalRisk = (0, risk_1.assessRisk)(plan.command, plan.risk);
        // 3️⃣ 展示给用户
        console.log(chalk_1.default.bold.cyan('\n🧠 计划: ') + plan.plan);
        console.log(chalk_1.default.bold.green('💻 命令: ') + chalk_1.default.yellow(plan.command));
        const riskColor = finalRisk === 'high' ? chalk_1.default.red : (finalRisk === 'medium' ? chalk_1.default.yellow : chalk_1.default.green);
        console.log(chalk_1.default.bold('⚠️  风险: ') + riskColor(finalRisk.toUpperCase()));
        // 4️⃣ 确认
        let shouldExecute = options.execute;
        if (!shouldExecute) {
            shouldExecute = await (0, confirm_1.confirm)('是否执行该命令？');
        }
        if (!shouldExecute) {
            console.log(chalk_1.default.gray('执行已取消。'));
            return;
        }
        // 5️⃣ 执行
        console.log(chalk_1.default.gray('\n执行中...\n'));
        let result = await (0, executor_1.exec)(plan.command);
        // 6️⃣ 自动修复（仅一次）
        if (result.code !== 0 && result.code !== null) {
            console.log(chalk_1.default.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await (0, autofix_1.autoFixCommand)(plan.command, result.stderr, os, options.model);
            if (fixedPlan) {
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
                command: plan.command,
            });
            console.log(chalk_1.default.green('\n✓ 执行成功并已存入历史库'));
        }
        return result;
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('发生错误: ' + error.message));
    }
}
//# sourceMappingURL=handleAICommand.js.map