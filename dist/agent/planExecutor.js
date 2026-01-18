"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePlan = executePlan;
const actions_1 = require("./actions");
const chalk_1 = __importDefault(require("chalk"));
async function executePlan(plan, options) {
    const completed = new Set();
    const failed = new Set();
    if (options?.verbose) {
        console.log(chalk_1.default.bold.cyan(`\n🚀 开始执行计划: ${plan.goal}`));
        console.log(chalk_1.default.gray(`共 ${plan.tasks.length} 个任务\n`));
    }
    for (const task of plan.tasks) {
        // 检查依赖
        if (task.dependsOn?.some(depId => !completed.has(depId))) {
            if (options?.verbose) {
                console.log(chalk_1.default.yellow(`⏭️ 跳过任务 ${task.id}: 依赖未完成`));
            }
            continue;
        }
        if (failed.has(task.id))
            continue;
        try {
            task.status = 'running';
            if (options?.verbose) {
                console.log(chalk_1.default.cyan(`⚙️ 执行任务 ${task.id}: ${task.description}`));
            }
            await executeTask(task, options);
            task.status = 'success';
            completed.add(task.id);
        }
        catch (error) {
            task.status = 'failed';
            failed.add(task.id);
            console.error(chalk_1.default.red(`❌ 任务 ${task.id} 失败: ${error.message}`));
            // 如果一个任务失败，后续依赖它的任务都会被跳过
        }
    }
    if (options?.verbose) {
        console.log(chalk_1.default.bold.green(`\n✅ 计划执行完成 (${completed.size}/${plan.tasks.length} 成功)\n`));
    }
    return {
        success: failed.size === 0 && completed.size > 0,
        completedCount: completed.size,
        totalCount: plan.tasks.length
    };
}
async function executeTask(task, options) {
    switch (task.type) {
        case 'shell':
            await (0, actions_1.executeAction)({
                type: 'confirm',
                next: {
                    type: 'execute',
                    command: task.payload.command,
                    risk: task.payload.risk || 'medium'
                }
            }, options);
            break;
        case 'custom':
            if (task.payload?.kind === 'print' && task.payload?.text) {
                console.log(task.payload.text);
            }
            break;
        case 'llm':
            // 未来可以支持任务中再次调用 LLM (Recursive Agent)
            console.log(chalk_1.default.gray(`[LLM Task] ${task.description} (Not implemented in MVP)`));
            break;
    }
}
//# sourceMappingURL=planExecutor.js.map