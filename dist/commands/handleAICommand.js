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
const executionStore_1 = require("../core/executionStore");
const validation_1 = require("../core/validation");
const macros_1 = require("../core/macros");
const capabilitySystem_1 = require("../core/capabilitySystem");
const capabilityInference_1 = require("../core/capabilityInference");
const contextBuffer_1 = require("./contextBuffer");
const contextStorage_1 = require("./contextStorage");
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
    const capabilitySystem = new capabilitySystem_1.CapabilitySystem();
    const spinner = (0, ora_1.default)(chalk_1.default.cyan('🧠 AI 正在规划中...')).start();
    const startTime = Date.now();
    try {
        const requirement = (0, capabilityInference_1.inferCapabilityRequirement)(userInput);
        let matchResult;
        let selectedModel;
        if (options.model) {
            matchResult = {
                selected: null,
                candidates: [],
                fallbackOccurred: false,
            };
            selectedModel = options.model;
        }
        else {
            matchResult = capabilitySystem.matchCapability(requirement);
            selectedModel = matchResult.selected?.name || 'Assistant';
        }
        spinner.stop();
        // Load context
        const contextBuffer = new contextBuffer_1.ContextBuffer();
        const persistedContext = await (0, contextStorage_1.loadContext)();
        contextBuffer.import(persistedContext);
        const contextStr = contextBuffer.isEmpty() ? '' : contextBuffer.buildPrompt('');
        const prompt = (0, prompt_1.buildCommandPrompt)(userInput, os, macros, contextStr);
        const raw = await (0, client_1.askAI)(prompt, selectedModel);
        const { aiCommandPlanSchema } = require('../core/validation');
        const parseResult = (0, validation_1.safeParseJSON)(raw, aiCommandPlanSchema, {});
        if (!parseResult.success) {
            console.log(chalk_1.default.red('\n❌ AI 输出不是合法 JSON:'));
            console.log(raw);
            console.log(chalk_1.default.gray('\n验证错误: ' + parseResult.error.issues.map((e) => e.message).join(', ')));
            return { code: 1 };
        }
        const plan = parseResult.data;
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
            return { code: 1 };
        }
        const commandToExecute = actualCommand;
        const finalRisk = (0, risk_1.assessRisk)(commandToExecute, plan.risk);
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
        if (options.verbose) {
            console.log(chalk_1.default.bold.cyan('\n🔍 Capability 匹配详情:'));
            console.log(chalk_1.default.gray(`  用户意图能力: ${requirement.required.join(', ')}`));
            console.log(chalk_1.default.gray(`  使用的模型: ${selectedModel}`));
            if (matchResult.selected) {
                console.log(chalk_1.default.gray(`  模型能力覆盖: ${matchResult.selected.atomicCapabilities.join(', ')}`));
            }
            if (matchResult.fallbackOccurred) {
                console.log(chalk_1.default.yellow('  ⚠️  触发了 Fallback'));
            }
            matchResult.candidates.forEach(c => {
                const icon = c.hasRequired ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                console.log(chalk_1.default.gray(`  ${icon} ${c.modelName}: ${c.reason}`));
            });
        }
        if (options.dryRun) {
            console.log(chalk_1.default.gray('\n[Dry Run] 仅模拟，不执行命令。'));
            return { code: 0 };
        }
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
        if (!shouldExecute) {
            shouldExecute = await (0, confirm_1.confirm)('是否执行该命令？');
        }
        if (!shouldExecute) {
            console.log(chalk_1.default.gray('执行已取消。'));
            return { code: 1 };
        }
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
        const latencyMs = Date.now() - startTime;
        if (!isUsingMacro && result.code !== 0 && result.code !== null) {
            // === Anti-Pattern Memory ===
            const failBuffer = new contextBuffer_1.ContextBuffer();
            const persistedFailContext = await (0, contextStorage_1.loadContext)();
            failBuffer.import(persistedFailContext);
            failBuffer.add({
                type: 'antipattern',
                path: `fail:${userInput}`,
                content: `
Intent:
${userInput}

Command:
${commandToExecute}

Error:
${result.stderr}
`,
                tags: ['failure', 'command']
            });
            await (0, contextStorage_1.saveContext)(failBuffer.export());
            console.log(chalk_1.default.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await (0, autofix_1.autoFixCommand)(commandToExecute, result.stderr, os, selectedModel);
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
            const reward = result.code === 0
                ? latencyMs < 500 ? 1 : 0.5
                : -1;
            if (!isUsingMacro) {
                capabilitySystem.createAndSaveExecutionRecord('ai-command', requirement, matchResult, commandToExecute, userInput, 'command');
                const records = (0, executionStore_1.listExecutionRecords)(1);
                if (records.length > 0) {
                    const lastRecord = records[0];
                    lastRecord.outcome.reward = reward;
                    (0, executionStore_1.saveExecutionRecord)(lastRecord);
                }
            }
            // === Execution Result to Context ===
            const successBuffer = new contextBuffer_1.ContextBuffer();
            const persistedContext = await (0, contextStorage_1.loadContext)();
            successBuffer.import(persistedContext);
            successBuffer.add({
                type: 'memory',
                path: `Execution: ${commandToExecute}`,
                alias: 'Last Successful Execution',
                content: `
Command:
${commandToExecute}

Stdout:
${result.stdout ?? ''}

Stderr:
${result.stderr ?? ''}
`
            }, true);
            await (0, contextStorage_1.saveContext)(successBuffer.export());
            // === Trigger Reflection ===
            if (Math.random() < 0.1) {
                try {
                    const { ReflectionAgent } = await Promise.resolve().then(() => __importStar(require('../agent/ReflectionAgent')));
                    await ReflectionAgent.run();
                }
                catch (error) {
                    // Reflection is optional, fail silently
                }
            }
            // Clear context after successful one-shot command execution
            await (0, contextStorage_1.saveContext)([]);
        }
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk_1.default.red('发生错误: ' + message));
        return { code: 1 };
    }
}
//# sourceMappingURL=handleAICommand.js.map