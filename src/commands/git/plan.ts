import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { GitService } from '../../core/git/GitService';
import { runLLM, AIError } from '../../agent/llm';
import { AIRequestMessage } from '../../core/validation';

/**
 * 注册 git plan 命令
 */
export function registerPlanCommand(gitCmd: Command) {
    gitCmd
        .command('plan [prompt...]')
        .description('自动读取最近 10 次提交，由两个 AI (架构师 & 审查员) 协作生成 todo.md')
        .option('-r, --rounds <number>', '对话轮数', '2')
        .action(async (promptParts, options) => {
            const userPrompt = promptParts.join(' ').trim() || '分析项目现状并规划下一步开发任务';
            const maxRounds = parseInt(options.rounds) || 2;
            
            // 使用主 spinner 管理整体状态
            const spinner = ora('正在初始化分析规划...').start();
            
            try {
                const gitService = new GitService();
                
                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                // 1. 获取最近 10 次提交
                spinner.text = '正在读取 Git 历史记录...';
                const commits = await gitService.getRecentCommits(10);
                const commitContext = commits.length > 0 
                  ? commits.map(c => `- ${c.date} [${c.hash.substring(0, 7)}] ${c.message}`).join('\n')
                  : '暂无提交记录';

                spinner.succeed('已获取 Git 上下文');

                // 定义两个角色的配置
                const ARCHITECT_MODEL = 'Assistant'; // 负责写方案
                const REVIEWER_MODEL = 'gemini-2.5-flash-lite'; // 负责挑刺 (速度快/便宜)

                // 共享的项目上下文
                const projectContext = `
[项目背景 - 最近 Git 提交]
${commitContext}

[用户需求]
${userPrompt}
`;

                let currentPlan = ""; // 用于存储当前的方案草稿
                let reviewComments = ""; // 用于存储审查意见

                console.log(chalk.bold.cyan('\n🚀 启动双智能体协作引擎...\n'));

                // --- 阶段 1: 架构师起草初稿 ---
                spinner.start(`[架构师] ${ARCHITECT_MODEL} 正在起草初步方案...`);
                
                const draftPrompt: AIRequestMessage[] = [
                    {
                        role: 'system',
                        content: `你是一个资深软件架构师。请根据 Git 历史确保新功能与现有代码风格一致。
请基于用户需求输出一份初步的开发计划 (Draft Plan)。
包含：核心目标、修改文件列表、关键步骤。`
                    },
                    { role: 'user', content: projectContext }
                ];

                const draftRes = await runLLM({
                    prompt: { messages: draftPrompt },
                    model: ARCHITECT_MODEL,
                    stream: false,
                    bypassRouter: true
                });
                
                currentPlan = draftRes.rawText;
                spinner.succeed(chalk.blue(`[架构师] 初稿已完成`));
                // console.log(chalk.gray(currentPlan.substring(0, 100) + '...'));

                // --- 阶段 2: 循环打磨 ---
                for (let i = 1; i <= maxRounds; i++) {
                    console.log(chalk.gray(`\n--- Round ${i}/${maxRounds} ---`));

                    // Step A: 审查员 (Gemini) 评审
                    spinner.start(`[审查员] ${REVIEWER_MODEL} 正在评审方案...`);
                    
                    const reviewPrompt: AIRequestMessage[] = [
                        {
                            role: 'system',
                            content: `你是一个严格的代码审查员和产品经理。
你的任务是找出架构师方案中的漏洞、遗漏、安全风险或逻辑错误。
请简明扼要地列出修改建议。不要重写计划，只给建议。`
                        },
                        { 
                            role: 'user', 
                            content: `
${projectContext}

[待评审的方案]
${currentPlan}
` 
                        }
                    ];

                    const reviewRes = await runLLM({
                        prompt: { messages: reviewPrompt },
                        model: REVIEWER_MODEL,
                        stream: false,
                        bypassRouter: true
                    });

                    reviewComments = reviewRes.rawText;
                    spinner.succeed(chalk.magenta(`[审查员] 已提出修改意见`));
                    console.log(chalk.gray(`   💬 "${reviewComments.replace(/\n/g, ' ').substring(0, 80)}..."`));

                    // Step B: 架构师 (Assistant) 修正
                    spinner.start(`[架构师] ${ARCHITECT_MODEL} 正在根据意见修订方案...`);
                    
                    const refinePrompt: AIRequestMessage[] = [
                        {
                            role: 'system',
                            content: `你是一个资深软件架构师。请根据审查员的意见优化你的开发计划。`
                        },
                        {
                            role: 'user',
                            content: `
这是你之前的方案：
${currentPlan}

审查员给出的意见：
${reviewComments}

请输出修正后的完整方案。`
                        }
                    ];

                    const refineRes = await runLLM({
                        prompt: { messages: refinePrompt },
                        model: ARCHITECT_MODEL,
                        stream: false,
                        bypassRouter: true
                    });

                    currentPlan = refineRes.rawText;
                    spinner.succeed(chalk.blue(`[架构师] 方案已修订`));
                }

                // 4. 生成最终 todo.md
                spinner.start('正在生成最终 todo.md 文件...');
                
                const finalPrompt: AIRequestMessage[] = [
                    {
                        role: 'system',
                        content: `你是一个技术文档专家。请将以下开发方案整理为一份标准的 todo.md 文档。
要求：
1. 格式清晰，使用 Markdown Checkbox (- [ ] )。
2. 包含 [目标]、[文件变更]、[详细步骤]。
3. 仅输出 Markdown 内容，不要包含 "好的" 等废话。`
                    },
                    {
                        role: 'user',
                        content: currentPlan
                    }
                ];

                const finalResponse = await runLLM({
                    prompt: { messages: finalPrompt },
                    model: 'Assistant', // 用最好的模型做最后整理
                    stream: false,
                    bypassRouter: true
                });

                const todoContent = finalResponse.rawText;
                const filePath = path.join(process.cwd(), 'todo.md');
                
                // 增强的 Markdown 清理正则
                const cleanedContent = todoContent
                    .replace(/^```(markdown|md)?\s*\n/i, '') // 去头
                    .replace(/\n\s*```$/, '')                 // 去尾
                    .trim();
                
                // 加上一些元数据头
                const fileOutput = `> 📅 Generated by Yuangs Git Plan at ${new Date().toLocaleString()}\n> 🎯 Context: ${userPrompt}\n\n${cleanedContent}`;

                fs.writeFileSync(filePath, fileOutput);
                
                spinner.succeed(chalk.green(`\n✅ 规划完成！文件已生成: ${chalk.bold('todo.md')}`));
                console.log(chalk.gray(`👉 你可以使用 'code todo.md' 打开查看`));

            } catch (error: any) {
                spinner.fail(chalk.red(`规划过程中出错: ${error.message}`));
                if (error instanceof AIError) {
                    console.error(chalk.red(`Status: ${error.statusCode}`));
                }
            }
        });
}
