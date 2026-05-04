#!/usr/bin/env node
import { GlobalErrorHandler } from './core/GlobalErrorHandler';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Command } from 'commander';
import { getConfigService } from './core/ConfigService';
import { handleAIChat } from './commands/handleAIChat';
import { registerCapabilityCommands } from './commands/capabilityCommands';
import { getAllCommands, getCommandSubcommands, getCommandDescription, installBashCompletion, installZshCompletion, complete, setProgramInstance } from './core/completion';
import { loadAppsConfig, openUrl, DEFAULT_APPS } from './core/apps';
import { getMacros, saveMacro, runMacro } from './core/macros';
import { getCommandHistory } from './utils/history';
import { handleSpecialSyntax } from './utils/syntaxHandler';
import { registerRegistryCommands } from './commands/registryCommands';
import { registerExplainCommands } from './commands/explainCommands';
import { registerReplayCommands } from './commands/replayCommands';
import { registerSkillsCommands } from './commands/skillsCommands';
import { registerPreferencesCommands } from './commands/preferencesCommands';
import { registerConfigCommands } from './commands/config';
import { registerSSHCommand } from './commands/ssh';
import { registerRouterCommands } from './commands/routerCommands';
import { registerGitCommands } from './commands/gitCommands';
import { wouldExpandAsGlob } from './utils/globDetector';

// Mandatory Node.js version check
const majorVersion = Number(process.versions.node.split('.')[0]);
if (majorVersion < 18) {
    console.error(chalk.red(`Error: yuangs requires Node.js >= 18. Current version: ${process.version}`));
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

// Initialize unified config service (fire-and-forget, config loads async)
getConfigService().init().catch(() => {});

const program = new Command();

program
    .name('yuangs')
    .description('苑广山的个人命令行工具')
    .version(version, '-V, --version');

setProgramInstance(program);

async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        // Simple timeout to avoid hanging if no input
        setTimeout(() => resolve(data), 2000);
    });
}

function parseOptionsFromArgs(args: string[]): {
    exec: boolean;
    model?: string;
    withContent: boolean;
} {
    return {
        exec: args.includes('-e') || args.includes('--exec'),
        model: getArgValue(args, ['-m', '--model']) || getModelFromShortcuts(args),
        withContent: args.includes('-w') || args.includes('--with-content')
    };
}

function getModelFromShortcuts(args: string[]): string | undefined {
    if (args.includes('-p')) return 'Pro';       // 高质量模型
    if (args.includes('-f')) return 'Flash';     // 快速响应模型
    if (args.includes('-l')) return 'Lite';      // 轻量/低成本模型
    return undefined;
}

function getArgValue(args: string[], flags: string[]): string | undefined {
    for (let i = 0; i < args.length; i++) {
        for (const flag of flags) {
            if (args[i] === flag && i + 1 < args.length && !args[i + 1].startsWith('-')) {
                return args[i + 1];
            }
        }
    }
    return undefined;
}

program
    .command('ai [question...]')
    .description('向 AI 提问')
    .option('-e, --exec', '生成并执行 Linux 命令')
    .option('-m, --model <model>', '指定 AI 模型')
    .option('-p', '使用 Pro 模型')
    .option('-f', '使用 Flash 模型')
    .option('-l', '使用 Lite 模型')
    .option('-w, --with-content', '在管道模式下读取文件内容')
    .option('--verbose', '详细输出（显示 Capability 匹配详情）')
    .option('--planner', '启用双Agent模式（Planner + Executor）')
    .option('--no-planner', '禁用双Agent模式')
    .option('--show-context-relevance', '显示上下文相关性评分')
    .option('--context-strategy <strategy>', '上下文策略: smart/minimal/full')
    .action(async (questionArgs, options) => {
        const stdinData = await readStdin();
        let question = Array.isArray(questionArgs) ? questionArgs.join(' ').trim() : questionArgs || '';

        if (stdinData) {
            if (options.withContent) {
                const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                const filePaths = parseFilePathsFromLsOutput(stdinData);
                const contentMap = await readFilesContent(filePaths, { showProgress: false });
                question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
            } else {
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
        }

        let model = options.model;
        if (options.p) model = 'Pro';
        if (options.f) model = 'Flash';
        if (options.l) model = 'Lite';

        const { PreferencesManager } = await import('./agent/preferences');

        if (options.contextStrategy) {
            const validStrategies = ['smart', 'minimal', 'full'];
            if (validStrategies.includes(options.contextStrategy)) {
                PreferencesManager.setPreferences({ contextStrategy: options.contextStrategy });
                console.log(chalk.cyan(`Context strategy set to: ${options.contextStrategy}`));
            } else {
                console.log(chalk.red(`Invalid context strategy: ${options.contextStrategy}`));
                console.log(chalk.gray('Valid options: smart, minimal, full'));
            }
        }

        if (!question && !stdinData) {
            await handleAIChat(null, model);
            return;
        }

        const isPlannerEnabled = options.planner || (options.noPlanner !== true && PreferencesManager.getPreference('autoConfirm') === false);

        (global as any).yuangsOptions = {
            showContextRelevance: options.showContextRelevance
        };

        if (isPlannerEnabled) {
            const { DualAgentRuntime } = await import('./agent/DualAgentRuntime');
            console.log(chalk.magenta('--- RUNNING WITH DUAL AGENT ENGINE (PLANNER + EXECUTOR) ---'));
            const { getConversationHistory } = await import('./ai/client');
            const runtime = new DualAgentRuntime(getConversationHistory());
            await runtime.run(question || '', undefined, model);
        } else {
            const { AgentRuntime } = await import('./agent/AgentRuntime');
            console.log(chalk.magenta('--- RUNNING WITH NEW AGENT ENGINE ---'));
            const { getConversationHistory } = await import('./ai/client');
            const runtime = new AgentRuntime(getConversationHistory());
            await runtime.run(question || '', options.exec ? 'command' : 'chat', undefined, model);
        }
    });

program
    .command('list')
    .description('列出所有应用')
    .action(() => {
        const apps = loadAppsConfig();
        console.log(chalk.bold.cyan('\n📱 应用列表\n'));
        Object.entries(apps).forEach(([key, url]) => {
            console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(10))} ${chalk.blue(url)}`);
        });
    });

program
    .command('history')
    .description('查看及执行命令历史')
    .option('-l, --last', '执行上一条命令')
    .action(async (options) => {
        const history = getCommandHistory();
        if (history.length === 0) {
            console.log(chalk.gray('暂无命令历史\n'));
            return;
        }

        if (options.last) {
            const lastItem = history[0]; // history is unshift-ed, so 0 is latest
            console.log(chalk.bold.cyan('\n📋 上一次执行的命令:\n'));
            console.log(chalk.white(`${lastItem.command}`));
            console.log(chalk.gray(`问题: ${lastItem.question}\n`));

            const rlLast = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const confirmLast = await rlLast.question(chalk.cyan('确认再次执行? (y/N): '));
            rlLast.close();

            if (confirmLast.toLowerCase() === 'y' || confirmLast.toLowerCase() === 'yes') {
                const { exec } = require('child_process');
                console.log(chalk.bold.cyan('执行中...\n'));
                exec(lastItem.command, (error: any, stdout: string, stderr: string) => {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(chalk.red(stderr));
                    if (error) console.error(chalk.red(error.message));
                    process.exit(0);
                });
                return;
            } else {
                console.log(chalk.gray('已取消执行'));
            }
            return;
        }

        console.log(chalk.bold.cyan('\n📋 命令历史\n'));
        history.forEach((item, index) => {
            console.log(`${index + 1}. ${chalk.white(item.command)}`);
            console.log(chalk.gray(`   问题: ${item.question}\n`));
        });

        const rlHistory = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const indexInput = await rlHistory.question(chalk.cyan('输入序号选择命令 (直接回车取消): '));
        rlHistory.close();

        if (indexInput.trim()) {
            const index = parseInt(indexInput) - 1;
            if (index >= 0 && index < history.length) {
                const targetCommand = history[index].command;
                console.log(chalk.yellow(`\n即将执行: ${targetCommand}\n`));
                const rlConfirm = require('node:readline/promises').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const confirm = await rlConfirm.question(chalk.cyan('确认执行? (y/N): '));
                rlConfirm.close();

                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    const { exec } = require('child_process');
                    console.log(chalk.bold.cyan('执行中...\n'));
                    exec(targetCommand, (error: any, stdout: string, stderr: string) => {
                        if (stdout) console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));
                        if (error) console.error(chalk.red(error.message));
                        process.exit(0);
                    });
                    return;
                } else {
                    console.log(chalk.gray('已取消执行'));
                }
            } else {
                console.log(chalk.red('无效的序号'));
            }
        }
    });

program

program
    .command('macros')
    .description('查看所有快捷指令')
    .action(() => {
        const allMacros = getMacros();
        console.log(chalk.bold.cyan('\n🚀 快捷指令列表\n'));
        Object.keys(allMacros).forEach(name => {
            console.log(`  ${chalk.white(name)}: ${chalk.gray(allMacros[name].commands)}`);
        });
    });

program
    .command('save <name>')
    .description('保存快捷指令')
    .option('-l, --from-last', 'save last executed AI command')
    .option('-g, --global', 'add alias to ~/.zshrc')
    .action(async (name, options) => {
        const addToZshrc = (aliasName: string) => {
            const zshrcPath = path.join(os.homedir(), '.zshrc');
            if (fs.existsSync(zshrcPath)) {
                const aliasLine = `alias ${aliasName}="yuangs run ${aliasName}"`;
                try {
                    const content = fs.readFileSync(zshrcPath, 'utf8');
                    if (!content.includes(aliasLine)) {
                        fs.appendFileSync(zshrcPath, `\n${aliasLine}\n`);
                        console.log(chalk.green(`✓ 已添加 alias 到 ~/.zshrc`));
                        console.log(chalk.yellow(`ℹ️  请运行 "source ~/.zshrc" 以生效`));
                    } else {
                        console.log(chalk.yellow(`ℹ️  Alias "${aliasName}" 已存在于 ~/.zshrc`));
                    }
                } catch (err) {
                    console.error(chalk.red(`❌ 无法写入 ~/.zshrc: ${(err as Error).message}`));
                }
            } else {
                console.log(chalk.red(`❌ 未找到 ~/.zshrc`));
            }
        };

        if (options.fromLast) {
            const history = getCommandHistory();
            if (history.length === 0) {
                console.log(chalk.red('❌ 暂无 AI 命令历史'));
                return;
            }
            const lastItem = history[0];

            saveMacro(name, lastItem.command, `Saved from: ${lastItem.question}`);
            console.log(chalk.green(`✓ 已将最近一条 AI 命令保存为 "${name}"`));
            console.log(chalk.gray(`  Command: ${lastItem.command}`));

            if (options.global) {
                addToZshrc(name);
            }
            return;
        }

        const rl = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const cmd = await rl.question(chalk.cyan('请输入要保存的命令: '));
        saveMacro(name, cmd);
        console.log(chalk.green(`✓ 快捷指令 "${name}" 已保存`));
        rl.close();

        if (options.global) {
            addToZshrc(name);
        }
    });

program
    .command('run <name>')
    .description('执行快捷指令')
    .action((name) => {
        if (runMacro(name)) {
            console.log(chalk.green(`✓ 正在执行 "${name}"...`));
        } else {
            console.log(chalk.red(`错误: 快捷指令 "${name}" 不存在`));
        }
    });

program
    .command('completion [shell]')
    .description('生成并安装 Shell 补全脚本')
    .action(async (shell) => {
        const shellType = shell || process.env.SHELL?.split('/').pop() || 'bash';

        if (!['bash', 'zsh'].includes(shellType)) {
            console.log(chalk.red('错误: 不支持的 shell 类型'));
            console.log(chalk.gray('支持的类型: bash, zsh'));
            process.exit(1);
        }

        console.log(chalk.cyan(`\n正在为 ${shellType} 安装 yuangs 补全...\n`));

        let success = false;
        if (shellType === 'bash') {
            success = await installBashCompletion(program);
        } else if (shellType === 'zsh') {
            success = await installZshCompletion(program);
        }

        if (success) {
            console.log(chalk.green('✓ 补全安装成功！\n'));
            console.log(chalk.yellow('请重新加载 shell 配置:'));
            console.log(chalk.gray(`  ${shellType === 'bash' ? 'source ~/.bashrc' : 'source ~/.zshrc'}\n`));
        } else {
            console.log(chalk.red('✗ 补全安装失败\n'));
            process.exit(1);
        }
    });

program
    .command('_complete')
    .description('(internal) unified completion entry')
    .option('--words <json>', 'JSON encoded argv')
    .option('--current <index>', 'Current word index')
    .action(async (options) => {
        try {
            const words = JSON.parse(options.words);
            const currentIndex = Number(options.current);

            const res = await complete({ words, currentIndex });

            console.log(res.items.map(i => i.label).join(' '));
        } catch {
            console.log('');
            process.exit(0);
        }
    });

registerCapabilityCommands(program);
registerRegistryCommands(program);
registerExplainCommands(program);
registerReplayCommands(program);
registerSkillsCommands(program);
registerPreferencesCommands(program);
registerConfigCommands(program);
registerSSHCommand(program);
registerRouterCommands(program);
registerGitCommands(program);

program
    .command('help')
    .description('显示帮助信息')
    .action(() => {
        console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
        console.log(chalk.yellow(`当前版本: ${version}`));
        console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
        console.log(chalk.bold('命令列表:'));
        console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问`);
        console.log(`    ${chalk.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
        console.log(`  ${chalk.green('list')}              列出所有应用`);
        console.log(`  ${chalk.green('history')}           查看命令历史`);
        console.log(`  ${chalk.green('config')}            管理本地配置 (~/.yuangs.json)`);
        console.log(`  ${chalk.green('macros')}            查看所有快捷指令`);
        console.log(`  ${chalk.green('save')} <名称>      保存快捷指令`);
        console.log(`  ${chalk.green('run')} <名称>        执行快捷指令`);
        console.log(`  ${chalk.green('registry')}          Macro Registry 管理`);
        console.log(`  ${chalk.green('diff-edit')}         代码变更治理 (propose/approve/exec/list/status)`);
        console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
    });

const apps = loadAppsConfig();

program
    .command('shici')
    .description('打开古诗词 PWA')
    .action(() => {
        const url = apps['shici'] || DEFAULT_APPS['shici'];
        console.log(chalk.green(`✓ 正在打开 shici...`));
        openUrl(url);
    });

program
    .command('dict')
    .description('打开英语词典')
    .action(() => {
        const url = apps['dict'] || DEFAULT_APPS['dict'];
        console.log(chalk.green(`✓ 正在打开 dict...`));
        openUrl(url);
    });

program
    .command('pong')
    .description('打开 Pong 游戏')
    .action(() => {
        const url = apps['pong'] || DEFAULT_APPS['pong'];
        console.log(chalk.green(`✓ 正在打开 pong...`));
        openUrl(url);
    });

program
    .argument('[command]', '自定义应用命令')
    .action((command) => {
        // 先检查是否是 macro
        const macros = getMacros();
        if (command && macros[command]) {
            runMacro(command);
        } else if (command && apps[command]) {
            openUrl(apps[command]);
        } else {
            program.outputHelp();
        }
    });

async function main() {
    const args = process.argv.slice(2);

    const knownCommands = ['ai', 'list', 'history', 'config', 'macros', 'save', 'run', 'help', 'shici', 'dict', 'pong', 'capabilities', 'completion', '_complete_subcommand', '_describe', 'registry', 'explain', 'replay', 'skills', 'diff-edit', 'ny', 'ni', 'll', 'gdoc', 'install', 'update', 'ssh', 'router', 'git'];
    const globalFlags = ['-h', '--help', '-V', '--version', '-v'];
    const firstArg = args[0];
    const isKnownCommand = firstArg && knownCommands.includes(firstArg);
    const isGlobalFlag = firstArg && globalFlags.includes(firstArg);

    if (args.length === 0 && !await readStdin()) {
        console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
        console.log(chalk.yellow(`当前版本: ${version}`));
        program.outputHelp();
        process.exit(0);
    }

    if (!isKnownCommand && !isGlobalFlag) {
        const stdinData = await readStdin();

        if (stdinData || args.length > 0) {
            const options = parseOptionsFromArgs(args);
            let question = args.filter(arg => !arg.startsWith('-')).join(' ');

            if (stdinData) {
                // 检查 stdin 数据是否是特殊语法
                const stdinTrimmed = stdinData.trim();

                // Check for ?? pattern which could be expanded by shell glob
                if (stdinTrimmed === '??') {
                    const globMatches = wouldExpandAsGlob(stdinTrimmed, process.cwd());
                    if (globMatches.wouldExpand) {
                        console.log(chalk.yellow('⚠️  Zero‑Mode 触发符 \'??\' 在当前目录可能被解释为文件名展开：'));
                        console.log(chalk.gray('匹配到：'));
                        globMatches.matches.forEach(match => {
                            console.log(chalk.gray(`- ${match}`));
                        });
                        console.log(chalk.gray('\n请使用 \':ai\' 或空行 + Enter 进入 Zero‑Mode'));
                        process.exit(1);
                    }
                }

                const isStdinSpecialSyntax = stdinTrimmed.startsWith('@') ||
                    stdinTrimmed.startsWith('#') ||
                    stdinTrimmed === ':ls' ||
                    stdinTrimmed === ':clear' ||
                    stdinTrimmed === ':cat' ||
                    stdinTrimmed.startsWith(':cat ');

                if (isStdinSpecialSyntax) {
                    const result = await handleSpecialSyntax(stdinData, '');

                    if (result.processed) {
                        // 如果特殊语法被处理
                        if (result.result) {
                            if (result.type === 'management') {
                                console.log(result.result);
                                process.exit(0);
                            } else if (result.isPureReference) {
                                if (result.result.startsWith('错误:')) {
                                    console.log(chalk.red(result.result));
                                    process.exit(1);
                                } else {
                                    console.log(chalk.green(`✓ 已将${result.type === 'file' ? '文件' : '目录'}加入上下文`));
                                    process.exit(0);
                                }
                            } else {
                                question = result.result;
                            }
                        } else {
                            process.exit(0);
                        }
                    } else {
                        // 如果没有被处理，继续使用原始问题
                        console.log('警告: 未能处理特殊语法，使用原始输入');
                        if (options.withContent) {
                            const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                            const filePaths = parseFilePathsFromLsOutput(stdinData);
                            const contentMap = await readFilesContent(filePaths, { showProgress: false });
                            question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                        } else {
                            question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                        }
                    }
                } else {
                    if (options.withContent) {
                        const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                        const filePaths = parseFilePathsFromLsOutput(stdinData);
                        const contentMap = await readFilesContent(filePaths, { showProgress: false });
                        question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                    } else {
                        question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                    }
                }
            }

            // If question starts with ??, check for glob expansion
            const questionTrimmed = (question || '').trim();
            if (questionTrimmed.startsWith('??')) {
                const globMatches = wouldExpandAsGlob('??', process.cwd());
                if (globMatches.wouldExpand) {
                    console.log(chalk.yellow('⚠️  Zero‑Mode 触发符 \'??\' 在当前目录可能被解释为文件名展开：'));
                    console.log(chalk.gray('匹配到：'));
                    globMatches.matches.forEach(match => {
                        console.log(chalk.gray(`- ${match}`));
                    });
                    console.log(chalk.gray('\n请使用 \':ai\' 或空行 + Enter 进入 Zero‑Mode'));
                    process.exit(1);
                }
            }

            // 如果 question 本身包含特殊语法（没有 stdin 或 stdin 不是特殊语法）
            const isSpecialSyntaxPrefix = (q: string) => {
                const t = q.trim();
                return t.startsWith('@') || t.startsWith('#') || t === ':ls' || t === ':clear' || t === ':cat' || t.startsWith(':cat ');
            };

            if (!stdinData || !isSpecialSyntaxPrefix(stdinData)) {
                const isQuestionSpecialSyntax = isSpecialSyntaxPrefix(questionTrimmed);

                if (isQuestionSpecialSyntax) {
                    const result = await handleSpecialSyntax(question, stdinData);

                    if (result.processed) {
                        // 如果特殊语法被处理
                        if (result.result) {
                            // 检查是否是管理命令（如 :ls, :clear, :cat），这些命令的结果应该直接输出
                            const trimmedQuestion = question.trim();
                            const isManagementCommand = result.type === 'management';

                            if (isManagementCommand) {
                                // 直接输出结果并退出
                                console.log(result.result);
                                process.exit(0);
                            } else if (result.isPureReference) {
                                // 纯引用且没有后续提问，输出提示并退出
                                if (result.error) {
                                    console.log(chalk.red(result.result));
                                    process.exit(1);
                                } else {
                                    console.log(chalk.green(`✓ ${result.result || '已加入上下文'}`));
                                    process.exit(0);
                                }
                            } else {
                                // 对于带提问的引用，将结果作为问题传递给AI
                                question = result.result;
                            }
                        } else {
                            // 如果没有结果，可能只是执行了命令，直接退出
                            process.exit(0);
                        }
                    } else {
                        // 如果没有被处理，继续使用原始问题
                        console.log('警告: 未能处理特殊语法，使用原始输入');
                    }
                }
            }

            let model = options.model;
            if (options.exec) {
                // 统一使用 AgentRuntime 执行命令模式，与 `yuangs ai -e` 保持一致
                const { AgentRuntime } = await import('./agent/AgentRuntime');
                console.log(chalk.magenta('--- RUNNING WITH AGENT ENGINE (COMMAND MODE) ---'));
                const { getConversationHistory } = await import('./ai/client');
                const runtime = new AgentRuntime(getConversationHistory());
                await runtime.run(question || '', 'command', undefined, model);
            } else {
                await handleAIChat(question || null, model);
            }
            process.exit(0);
        }
    }

    program.parse();
}

main().catch(err => {
    GlobalErrorHandler.handleError(err);
    process.exit(1);
});
