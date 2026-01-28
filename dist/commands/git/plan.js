"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlanCommand = registerPlanCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const GitService_1 = require("../../core/git/GitService");
const llm_1 = require("../../agent/llm");
const CapabilityLevel_1 = require("../../core/capability/CapabilityLevel");
const CostProfile_1 = require("../../core/capability/CostProfile");
const DEFAULT_PLAN_PROMPT = '分析项目现状并规划下一步开发任务';
const METADATA_PREFIX = '>';
/**
 * 解析用户指令（优先级：命令行 > todo.md > 默认值）
 */
async function resolveUserPrompt(cliPrompt, todoPath) {
    if (cliPrompt) {
        return { prompt: cliPrompt, fromFile: false };
    }
    try {
        await fs_1.default.promises.access(todoPath, fs_1.default.constants.F_OK);
        const content = await fs_1.default.promises.readFile(todoPath, 'utf8');
        // 过滤掉文件开头由 yuangs 生成的元数据行（连续的 > 开头的行）
        const lines = content.split('\n');
        let startIndex = 0;
        // 跳过开头连续的元数据行
        while (startIndex < lines.length && lines[startIndex].trim().startsWith(METADATA_PREFIX)) {
            startIndex++;
        }
        // 跳过元数据后的空行
        while (startIndex < lines.length && lines[startIndex].trim() === '') {
            startIndex++;
        }
        const filePrompt = lines.slice(startIndex).join('\n').trim();
        if (filePrompt) {
            return { prompt: filePrompt, fromFile: true };
        }
    }
    catch (e) {
        if (e instanceof Error && e.code !== 'ENOENT') {
            console.warn(chalk_1.default.yellow(`⚠️  读取 todo.md 失败: ${e.message}`));
        }
    }
    return { prompt: DEFAULT_PLAN_PROMPT, fromFile: false };
}
/**
 * 注册 git plan 命令
 */
function registerPlanCommand(gitCmd) {
    gitCmd
        .command('plan [prompt...]')
        .description('自动读取最近 10 次提交，由两个 AI (架构师 & 审查员) 协作生成 todo.md')
        .option('-r, --rounds <number>', '对话轮数', '2')
        .action(async (promptParts, options) => {
        const cliPrompt = promptParts.join(' ').trim();
        const maxRounds = parseInt(options.rounds) || 2;
        const todoPath = path_1.default.join(process.cwd(), 'todo.md');
        const { prompt: userPrompt, fromFile } = await resolveUserPrompt(cliPrompt, todoPath);
        // 使用主 spinner 管理整体状态
        const spinner = (0, ora_1.default)(fromFile ? '正在从 todo.md 读取并初始化分析规划...' : '正在初始化分析规划...').start();
        try {
            const gitService = new GitService_1.GitService();
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
            console.log(chalk_1.default.bold.cyan('\n🚀 启动双智能体协作引擎...\n'));
            // --- 阶段 1: 架构师起草初稿 ---
            spinner.start(`[架构师] ${ARCHITECT_MODEL} 正在起草初步方案...`);
            const draftPrompt = [
                {
                    role: 'system',
                    content: `你是一个资深软件架构师。请根据 Git 历史确保新功能与现有代码风格一致。
请基于用户需求输出一份初步的开发计划 (Draft Plan)。
包含：核心目标、修改文件列表、关键步骤。`
                },
                { role: 'user', content: projectContext }
            ];
            const draftRes = await (0, llm_1.runLLM)({
                prompt: { messages: draftPrompt },
                model: ARCHITECT_MODEL,
                stream: false,
                bypassRouter: true
            });
            currentPlan = draftRes.rawText;
            spinner.succeed(chalk_1.default.blue(`[架构师] 初稿已完成`));
            // console.log(chalk.gray(currentPlan.substring(0, 100) + '...'));
            // --- 阶段 2: 循环打磨 ---
            for (let i = 1; i <= maxRounds; i++) {
                console.log(chalk_1.default.gray(`\n--- Round ${i}/${maxRounds} ---`));
                // Step A: 审查员 (Gemini) 评审
                spinner.start(`[审查员] ${REVIEWER_MODEL} 正在评审方案...`);
                const reviewPrompt = [
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
                const reviewRes = await (0, llm_1.runLLM)({
                    prompt: { messages: reviewPrompt },
                    model: REVIEWER_MODEL,
                    stream: false,
                    bypassRouter: true
                });
                reviewComments = reviewRes.rawText;
                spinner.succeed(chalk_1.default.magenta(`[审查员] 已提出修改意见`));
                console.log(chalk_1.default.gray(`   💬 "${reviewComments.replace(/\n/g, ' ').substring(0, 80)}..."`));
                // Step B: 架构师 (Assistant) 修正
                spinner.start(`[架构师] ${ARCHITECT_MODEL} 正在根据意见修订方案...`);
                const refinePrompt = [
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
                const refineRes = await (0, llm_1.runLLM)({
                    prompt: { messages: refinePrompt },
                    model: ARCHITECT_MODEL,
                    stream: false,
                    bypassRouter: true
                });
                currentPlan = refineRes.rawText;
                spinner.succeed(chalk_1.default.blue(`[架构师] 方案已修订`));
            }
            // 4. 生成最终 todo.md
            spinner.start('正在生成最终 todo.md 文件...');
            // 计算任务复杂度和能力需求
            const diff = await gitService.getDiff();
            const allFiles = [...diff.files.staged, ...diff.files.unstaged];
            // 使用 git diff --numstat 获取准确的行数统计
            let estimatedTotalLines = 0;
            try {
                const numstat = await gitService.getDiffNumstat();
                // numstat 直接提供准确的 added 和 deleted 行数
                estimatedTotalLines = numstat.added + numstat.deleted;
                // 如果 numstat 没有数据（如没有变更），使用文件数估算
                if (estimatedTotalLines === 0 && allFiles.length > 0) {
                    estimatedTotalLines = allFiles.length * 50; // 假设平均每个文件 50 行变更
                }
            }
            catch (e) {
                // numstat 失败，使用文件数 * 100 作为后备
                estimatedTotalLines = allFiles.length * 100;
            }
            const costProfile = CostProfile_1.defaultCostProfileCalculator.calculate(allFiles, estimatedTotalLines);
            const finalPrompt = [
                {
                    role: 'system',
                    content: `你是一个技术文档专家。请将以下开发方案整理为一份标准的 todo.md 文档。

重要要求：
1. 格式清晰，使用 Markdown Checkbox (- [ ] )。
2. 包含 [目标]、[文件变更]、[详细步骤]。
3. 直接输出 Markdown 内容，不要使用 Markdown 代码块 (\`\`\`) 包裹。
4. 不要包含任何对话式前缀（如"好的"、"这是"）或后缀（如"希望这对你有帮助"）。
5. 开头直接输出内容，不要有任何问候语或开场白。

能力等级标注：
- SEMANTIC: 语义理解，需要理解代码意图和设计
- STRUCTURAL: 结构分析，需要理解代码结构和依赖关系
- LINE: 行级分析，需要理解具体代码行
- TEXT: 文本分析，只需要处理文本内容
- NONE: 无需智能分析

格式示例：
- [ ] 实现用户认证 [SEMANTIC]
  - capability: SEMANTIC
  - fallbackChain: [STRUCTURAL, LINE, TEXT, NONE]`
                },
                {
                    role: 'user',
                    content: currentPlan
                }
            ];
            const finalResponse = await (0, llm_1.runLLM)({
                prompt: { messages: finalPrompt },
                model: 'Assistant',
                stream: false,
                bypassRouter: true
            });
            const todoContent = finalResponse.rawText;
            const filePath = path_1.default.join(process.cwd(), 'todo.md');
            // 安全的 LLM 输出清理逻辑
            // 策略：仅在明确检测到 Markdown fence 时才进行清理
            // 避免误删真实内容中的对话式文本
            const cleanedContent = (() => {
                let content = todoContent.trim();
                // 检测是否存在 Markdown fence
                const hasOpeningFence = /^```(markdown|md)?\s*\n/i.test(content);
                const hasClosingFence = /\n\s*```$/.test(content);
                if (hasOpeningFence || hasClosingFence) {
                    // 仅在存在 fence 时进行清理
                    content = content.replace(/^```(markdown|md)?\s*\n/i, '');
                    content = content.replace(/\n\s*```$/, '');
                }
                // 移除开头极短的对话式前缀（不超过 10 个字符）
                // 避免误删真实内容
                const shortPrefixes = [
                    /^(好的|当然|没问题)\s*[:，]?/,
                    /^(Sure|OK|Of course)\s*[:，]?/i,
                ];
                for (const prefix of shortPrefixes) {
                    const match = content.match(prefix);
                    if (match && match.index === 0 && match[0].length <= 10) {
                        content = content.substring(match[0].length).trim();
                        break;
                    }
                }
                return content.trim();
            })();
            // 添加能力元数据到文件头
            const metadataLines = [
                `> 📅 Generated by Yuangs Git Plan at ${new Date().toLocaleString()}`,
                `> 🎯 Context: ${userPrompt}`,
                `> 🔧 Capability Level: ${CapabilityLevel_1.CapabilityLevel[costProfile.requiredCapability]}`,
                `> ⚙️  Estimated Time: ${costProfile.estimatedTime}ms`,
                `> 📊 Estimated Tokens: ${costProfile.estimatedTokens}`,
                '',
            ];
            const fileOutput = metadataLines.join('\n') + cleanedContent;
            fs_1.default.writeFileSync(filePath, fileOutput);
            spinner.succeed(chalk_1.default.green(`\n✅ 规划完成！文件已生成: ${chalk_1.default.bold('todo.md')}`));
            console.log(chalk_1.default.gray(`👉 你可以使用 'code todo.md' 打开查看`));
        }
        catch (error) {
            spinner.fail(chalk_1.default.red(`规划过程中出错: ${error.message}`));
            if (error instanceof llm_1.AIError) {
                console.error(chalk_1.default.red(`Status: ${error.statusCode}`));
            }
        }
    });
}
//# sourceMappingURL=plan.js.map