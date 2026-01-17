import { AgentPlan, AgentTask } from './plan';
import { executeAction } from './actions';
import chalk from 'chalk';

export interface PlanExecutionSummary {
    success: boolean;
    completedCount: number;
    totalCount: number;
}

export async function executePlan(
    plan: AgentPlan,
    options?: { autoYes?: boolean; verbose?: boolean }
): Promise<PlanExecutionSummary> {
    const completed = new Set<string>();
    const failed = new Set<string>();

    if (options?.verbose) {
        console.log(chalk.bold.cyan(`\n🚀 开始执行计划: ${plan.goal}`));
        console.log(chalk.gray(`共 ${plan.tasks.length} 个任务\n`));
    }

    for (const task of plan.tasks) {
        // 检查依赖
        if (task.dependsOn?.some(depId => !completed.has(depId))) {
            if (options?.verbose) {
                console.log(chalk.yellow(`⏭️ 跳过任务 ${task.id}: 依赖未完成`));
            }
            continue;
        }

        if (failed.has(task.id)) continue;

        try {
            task.status = 'running';
            if (options?.verbose) {
                console.log(chalk.cyan(`⚙️ 执行任务 ${task.id}: ${task.description}`));
            }

            await executeTask(task, options);

            task.status = 'success';
            completed.add(task.id);
        } catch (error: any) {
            task.status = 'failed';
            failed.add(task.id);
            console.error(chalk.red(`❌ 任务 ${task.id} 失败: ${error.message}`));
            // 如果一个任务失败，后续依赖它的任务都会被跳过
        }
    }

    if (options?.verbose) {
        console.log(chalk.bold.green(`\n✅ 计划执行完成 (${completed.size}/${plan.tasks.length} 成功)\n`));
    }

    return {
        success: failed.size === 0 && completed.size > 0,
        completedCount: completed.size,
        totalCount: plan.tasks.length
    };
}

async function executeTask(
    task: AgentTask,
    options?: { autoYes?: boolean }
): Promise<void> {
    switch (task.type) {
        case 'shell':
            await executeAction({
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
            console.log(chalk.gray(`[LLM Task] ${task.description} (Not implemented in MVP)`));
            break;
    }
}
