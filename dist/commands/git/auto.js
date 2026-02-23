"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAutoCommand = registerAutoCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const GitService_1 = require("../../core/git/GitService");
const llm_1 = require("../../agent/llm");
const workflows_1 = require("../../core/workflows");
const CapabilityLevel_1 = require("../../core/capability/CapabilityLevel");
const ContextGatherer_1 = require("../../core/git/ContextGatherer");
const CodeReviewer_1 = require("../../core/git/CodeReviewer");
const CapabilityLevel_2 = require("../../core/capability/CapabilityLevel");
const modelRouter_1 = require("../../core/modelRouter");
const METADATA_PREFIX = '>';
/**
 * 用于判断计划范围的行数阈值常量
 */
const SMALL_SCOPE_LINES_THRESHOLD = 100;
const MEDIUM_SCOPE_LINES_THRESHOLD = 500;
/**
 * 元数据解析器映射
 * 使用配置驱动的方式提高可维护性
 */
const METADATA_PARSERS = {
    'Capability Level:': (line, metadata) => {
        const capabilityStr = line.split(':', 2)[1]?.trim();
        if (capabilityStr) {
            const capability = (0, CapabilityLevel_2.stringToCapabilityLevel)(capabilityStr);
            if (capability) {
                metadata.capability = {
                    minCapability: capability,
                    fallbackChain: [capability]
                };
            }
        }
    },
    'Estimated Time:': (line, metadata) => {
        // 使用正则表达式提取数字，更鲁棒
        const timeMatch = line.match(/(\d+)\s*ms/i);
        if (timeMatch) {
            const timeValue = parseInt(timeMatch[1], 10);
            if (!isNaN(timeValue)) {
                metadata.estimatedTime = timeValue;
            }
            else {
                console.warn(chalk_1.default.yellow(`⚠️  解析 Estimated Time 失败: "${timeMatch[1]}"`));
            }
        }
        else {
            console.warn(chalk_1.default.yellow(`⚠️  Estimated Time 格式无效: "${line}"`));
        }
    },
    'Estimated Tokens:': (line, metadata) => {
        // 使用正则表达式提取数字，更鲁棒
        const tokensMatch = line.match(/(\d+)/);
        if (tokensMatch) {
            const tokensValue = parseInt(tokensMatch[1], 10);
            if (!isNaN(tokensValue)) {
                metadata.estimatedTokens = tokensValue;
            }
            else {
                console.warn(chalk_1.default.yellow(`⚠️  解析 Estimated Tokens 失败: "${tokensMatch[1]}"`));
            }
        }
        else {
            console.warn(chalk_1.default.yellow(`⚠️  Estimated Tokens 格式无效: "${line}"`));
        }
    }
};
/**
 * 解析单个元数据行
 *
 * @param line 元数据行（可能包含emoji）
 * @param metadata 元数据对象
 * @returns 是否成功解析
 */
function parseMetadataLine(line, metadata) {
    // 移除emoji和特殊字符，保留英文、数字、冒号和空格
    const cleanedLine = line.replace(/[^\x00-\x7F]/g, '').trim();
    for (const [prefix, parser] of Object.entries(METADATA_PARSERS)) {
        if (cleanedLine.includes(prefix)) {
            parser(line, metadata); // 使用原始行（包含emoji）传给解析器
            return true;
        }
    }
    return false;
}
/**
 * 推断计划范围
 *
 * @param planContent 计划内容行数
 * @param explicitScope 显式指定的scope（如果存在）
 * @returns 推断的scope
 */
function inferScope(planContentLength, explicitScope) {
    // 如果有显式指定的scope，直接使用
    if (explicitScope) {
        return explicitScope;
    }
    // 否则根据行数推断
    if (planContentLength < SMALL_SCOPE_LINES_THRESHOLD) {
        return 'small';
    }
    else if (planContentLength < MEDIUM_SCOPE_LINES_THRESHOLD) {
        return 'medium';
    }
    else {
        return 'large';
    }
}
/**
 * 从todo.md文件加载计划
 *
 * @param todoPath todo.md文件路径
 * @returns 解析后的PlanOutput，如果文件不存在或解析失败则返回null
 */
async function loadPlanFromTodo(todoPath) {
    try {
        const content = await fs_1.default.promises.readFile(todoPath, 'utf8');
        const lines = content.split('\n');
        const planContent = [];
        let metadata = {};
        let explicitScope;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith(METADATA_PREFIX)) {
                // 解析元数据行 - 保留完整的行（包括emoji），传递给解析器处理
                const metadataLine = trimmedLine.substring(METADATA_PREFIX.length).trim();
                // 检查是否是显式scope
                if (metadataLine.includes('Scope:')) {
                    const scopeStr = metadataLine.split(':', 2)[1]?.trim().toLowerCase();
                    if (scopeStr && ['small', 'medium', 'large'].includes(scopeStr)) {
                        explicitScope = scopeStr;
                    }
                }
                else {
                    // 使用通用的元数据解析器（支持包含emoji的行）
                    parseMetadataLine(metadataLine, metadata);
                }
            }
            else if (trimmedLine) {
                planContent.push(line);
            }
        }
        if (planContent.length === 0) {
            console.warn(chalk_1.default.yellow('⚠️  todo.md 文件内容为空'));
            return null;
        }
        // 推断scope（优先使用显式指定的）
        const scope = inferScope(planContent.length, explicitScope);
        return {
            todoMarkdown: planContent.join('\n'),
            capability: metadata.capability || {
                minCapability: CapabilityLevel_1.CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel_1.CapabilityLevel.SEMANTIC]
            },
            estimatedTime: metadata.estimatedTime || 60000,
            estimatedTokens: metadata.estimatedTokens || 1000,
            scope
        };
    }
    catch (e) {
        const error = e;
        if (error.code === 'ENOENT') {
            console.warn(chalk_1.default.yellow('⚠️  未找到 todo.md 文件'));
        }
        else {
            console.warn(chalk_1.default.yellow(`⚠️  读取 todo.md 文件失败: ${error.message}`));
        }
        return null;
    }
}
function registerAutoCommand(gitCmd) {
    gitCmd
        .command('auto')
        .description('自动执行 todo.md 中的任务，直到全部完成或达到最大限制')
        .option('-n, --max-tasks <number>', '本次运行执行的最大任务数', '5')
        .option('-m, --model <model>', '使用的 AI 模型', 'Assistant')
        .option('-s, --min-score <number>', '任务通过所需的最低评分', '70')
        .option('-l, --review-level <level>', '代码审查级别 (quick/standard/deep)', 'standard')
        .option('--skip-review', '跳过代码审查')
        .option('-o, --save-only', '只保存代码，不写入文件系统')
        .option('-c, --commit', '所有任务完成后自动提交')
        .option('--commit-message <msg>', '自定义提交信息（使用 --commit 时生效）')
        .action(async (options) => {
        const spinner = (0, ora_1.default)('正在初始化工作流会话...').start();
        try {
            const gitService = new GitService_1.GitService();
            const todoPath = path_1.default.join(process.cwd(), 'todo.md');
            if (!(await gitService.isGitRepository())) {
                spinner.fail('当前目录不是 Git 仓库');
                return;
            }
            spinner.succeed('Git 仓库验证通过');
            const workflowConfig = {
                sessionId: Date.now().toString(36) + Math.random().toString(36).substring(2, 11),
                model: options.model || 'Assistant',
                capability: CapabilityLevel_1.CapabilityLevel.STRUCTURAL
            };
            const session = new workflows_1.GitWorkflowSession(workflowConfig);
            // Try to load plan from todo.md
            const planOutput = await loadPlanFromTodo(todoPath);
            if (planOutput) {
                console.log(chalk_1.default.gray(`📋 从 todo.md 加载计划: ${planOutput.scope} scope`));
                // Use the public method to safely load the plan
                session.loadPlanFromExternal(planOutput);
            }
            console.log(chalk_1.default.bold.cyan('\n🤖 启动自动执行工作流...\n'));
            spinner.succeed('工作流会话已初始化');
            const autoInput = {
                maxTasks: parseInt(options.maxTasks) || 5,
                minScore: parseInt(options.minScore) || 70,
                reviewLevel: options.reviewLevel || 'standard',
                skipReview: options.skipReview || false,
                saveOnly: options.saveOnly || false,
                autoCommit: options.commit || false,
                commitMessage: options.commitMessage
            };
            spinner.start('[工作流] 正在执行任务...');
            const result = await session.runAuto(async (input) => {
                const router = await (0, modelRouter_1.getRouter)();
                const autoWorkflow = new workflows_1.AutoWorkflow(gitService, new ContextGatherer_1.ContextGatherer(gitService), new CodeReviewer_1.CodeReviewer(gitService, router));
                return autoWorkflow.run({ ...input, ...autoInput }, session.getConfig());
            });
            if (result.success && result.data) {
                spinner.succeed('自动执行完成');
                console.log('');
                console.log(chalk_1.default.green(`✅ 任务执行完成: ${result.data.executedTasks}/${result.data.totalTasks}`));
                console.log(chalk_1.default.gray(`📁 修改文件数: ${result.data.filesModified.length}`));
                console.log(chalk_1.default.gray(`💾 备份数: ${result.data.backupIds.length}`));
                if (result.data.commitHash) {
                    console.log(chalk_1.default.cyan(`📝 提交哈希: ${result.data.commitHash}`));
                }
                console.log('');
                console.log(chalk_1.default.bold.cyan('📊 会话摘要:'));
                console.log(chalk_1.default.gray(session.getSummary()));
                session.complete();
            }
            else {
                spinner.fail('自动执行失败');
                if (result.errors && result.errors.length > 0) {
                    console.log('');
                    console.log(chalk_1.default.bold.red('❌ 错误详情:'));
                    result.errors.forEach((error, index) => {
                        console.log(chalk_1.default.red(`  ${index + 1}. [${error.kind}] ${error.message}`));
                        if (error.suggestions && error.suggestions.length > 0) {
                            error.suggestions.forEach(suggestion => {
                                console.log(chalk_1.default.yellow(`     💡 ${suggestion}`));
                            });
                        }
                    });
                }
                if (result.summary) {
                    console.log('');
                    console.log(chalk_1.default.gray(`📝 ${result.summary}`));
                }
            }
        }
        catch (error) {
            spinner.fail(chalk_1.default.red(`执行过程中出错: ${error.message}`));
            if (error instanceof llm_1.AIError) {
                console.error(chalk_1.default.red(`Status: ${error.statusCode}`));
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=auto.js.map