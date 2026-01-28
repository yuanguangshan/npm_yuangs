"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerExecCommand = registerExecCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const llm_1 = require("../../agent/llm");
const CodeGenerator_1 = require("../../core/git/CodeGenerator");
const METADATA_PREFIX = '>';
/**
 * 从 todo.md 中提取任务列表
 */
async function parseTodoFile(filePath) {
    const content = await fs_1.default.promises.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    // 跳过元数据
    let startIndex = 0;
    while (startIndex < lines.length && lines[startIndex].trim().startsWith(METADATA_PREFIX)) {
        startIndex++;
    }
    while (startIndex < lines.length && lines[startIndex].trim() === '') {
        startIndex++;
    }
    const mainContent = lines.slice(startIndex).join('\n');
    // 提取所有未完成的任务（- [ ] 格式）
    const tasks = [];
    const taskRegex = /^[\s]*-\s*\[\s*\]\s*(.+)$/gm;
    let match;
    while ((match = taskRegex.exec(mainContent)) !== null) {
        tasks.push(match[1].trim());
    }
    return { tasks, context: mainContent };
}
/**
 * 注册 git exec 命令
 */
function registerExecCommand(gitCmd) {
    gitCmd
        .command('exec')
        .description('根据 todo.md 自动生成代码并执行任务')
        .option('-f, --fromfile <file>', '指定 todo 文件路径', 'todo.md')
        .option('-t, --task <number>', '执行指定编号的任务（从 1 开始）')
        .option('-m, --model <model>', '指定 AI 模型', 'Assistant')
        .action(async (options) => {
        const todoPath = path_1.default.join(process.cwd(), options.fromfile);
        const spinner = (0, ora_1.default)('正在读取任务文件...').start();
        try {
            // 1. 检查文件是否存在
            await fs_1.default.promises.access(todoPath, fs_1.default.constants.F_OK);
            // 2. 解析任务
            const { tasks, context } = await parseTodoFile(todoPath);
            if (tasks.length === 0) {
                spinner.fail('未找到待执行的任务（- [ ] 格式）');
                console.log(chalk_1.default.yellow('💡 提示：请确保 todo.md 中包含未完成的任务，格式如：- [ ] 任务描述'));
                return;
            }
            spinner.succeed(`发现 ${tasks.length} 个待执行任务`);
            // 3. 确定要执行的任务
            let taskIndex = 0;
            if (options.task) {
                taskIndex = parseInt(options.task) - 1;
                if (taskIndex < 0 || taskIndex >= tasks.length) {
                    console.error(chalk_1.default.red(`❌ 任务编号 ${options.task} 超出范围（1-${tasks.length}）`));
                    return;
                }
            }
            else {
                // 默认执行第一个任务
                taskIndex = 0;
            }
            const currentTask = tasks[taskIndex];
            console.log(chalk_1.default.cyan(`\n📋 准备执行任务 #${taskIndex + 1}: ${chalk_1.default.bold(currentTask)}\n`));
            // 4. 构建 AI 提示
            spinner.start('正在生成实现方案...');
            const prompt = [
                {
                    role: 'system',
                    content: `你是一个资深软件工程师。请根据任务描述和上下文，生成完整的代码实现。
要求：
1. 输出可直接使用的代码
2. 包含必要的注释
3. 遵循最佳实践
4. 如果需要创建新文件，明确指出文件路径`
                },
                {
                    role: 'user',
                    content: `
[项目上下文 - 来自 todo.md]
${context}

[当前任务]
${currentTask}

请生成完整的实现代码。如果需要创建或修改文件，请按以下格式输出：

\`\`\`filepath
文件路径
\`\`\`

\`\`\`code
代码内容
\`\`\`
`
                }
            ];
            const response = await (0, llm_1.runLLM)({
                prompt: { messages: prompt },
                model: options.model,
                stream: false,
                bypassRouter: true
            });
            spinner.succeed('实现方案已生成');
            // 5. 显示生成的代码
            console.log(chalk_1.default.gray('━'.repeat(60)));
            console.log(response.rawText);
            console.log(chalk_1.default.gray('━'.repeat(60)));
            // 6. 询问是否应用
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const answer = await new Promise((resolve) => {
                readline.question(chalk_1.default.yellow('\n是否应用以上代码？(y/N): '), resolve);
            });
            readline.close();
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                // 7. 解析并应用代码
                spinner.start('正在解析生成的代码...');
                const generated = (0, CodeGenerator_1.parseGeneratedCode)(response.rawText);
                if (generated.files.length > 0) {
                    spinner.succeed(`检测到 ${generated.files.length} 个文件`);
                    // 保存原始输出
                    const savedPath = await (0, CodeGenerator_1.saveRawOutput)(response.rawText, taskIndex);
                    console.log(chalk_1.default.gray(`📄 原始输出已保存: ${path_1.default.relative(process.cwd(), savedPath)}\n`));
                    // 写入文件
                    console.log(chalk_1.default.cyan('开始写入文件...\n'));
                    const { written, skipped } = await (0, CodeGenerator_1.writeGeneratedCode)(generated);
                    if (written.length > 0) {
                        console.log(chalk_1.default.green(`\n✅ 成功写入 ${written.length} 个文件`));
                    }
                    if (skipped.length > 0) {
                        console.log(chalk_1.default.yellow(`⚠️  跳过 ${skipped.length} 个文件`));
                    }
                    // 更新 todo.md 任务状态
                    const todoLineRegex = /^(\s*)-\s*\[\s*\]\s*(.+)$/;
                    const todoContent = await fs_1.default.promises.readFile(todoPath, 'utf8');
                    const lines = todoContent.split('\n');
                    let taskFound = false;
                    for (let i = 0; i < lines.length; i++) {
                        const match = lines[i].match(todoLineRegex);
                        if (match && taskIndex > 0) {
                            taskIndex--;
                            continue;
                        }
                        if (match && taskIndex === 0) {
                            lines[i] = `${match[1]}- [x] ${match[2]}`;
                            taskFound = true;
                            break;
                        }
                    }
                    if (taskFound) {
                        await fs_1.default.promises.writeFile(todoPath, lines.join('\n'), 'utf8');
                        console.log(chalk_1.default.green('\n✅ 任务已标记为完成'));
                    }
                }
                else {
                    spinner.fail('未检测到可解析的文件路径和代码');
                    console.log(chalk_1.default.yellow('\n💡 请检查 AI 输出格式，或查看原始输出文件'));
                }
            }
            else {
                console.log(chalk_1.default.gray('\n已取消应用'));
            }
        }
        catch (e) {
            if (e instanceof Error && e.code === 'ENOENT') {
                spinner.fail(`文件不存在: ${todoPath}`);
                console.log(chalk_1.default.yellow('💡 提示：请先运行 yuangs git plan 生成任务文件'));
            }
            else if (e instanceof llm_1.AIError) {
                spinner.fail(`AI 调用失败: ${e.message}`);
                console.error(chalk_1.default.red(`Status: ${e.statusCode}`));
            }
            else if (e instanceof Error) {
                spinner.fail(`执行失败: ${e.message}`);
            }
            else {
                spinner.fail('未知错误');
            }
        }
    });
}
//# sourceMappingURL=exec.js.map