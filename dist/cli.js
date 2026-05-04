#!/usr/bin/env node
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
const GlobalErrorHandler_1 = require("./core/GlobalErrorHandler");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const commander_1 = require("commander");
const ConfigService_1 = require("./core/ConfigService");
const handleAIChat_1 = require("./commands/handleAIChat");
const capabilityCommands_1 = require("./commands/capabilityCommands");
const completion_1 = require("./core/completion");
const apps_1 = require("./core/apps");
const macros_1 = require("./core/macros");
const history_1 = require("./utils/history");
const syntaxHandler_1 = require("./utils/syntaxHandler");
const registryCommands_1 = require("./commands/registryCommands");
const explainCommands_1 = require("./commands/explainCommands");
const replayCommands_1 = require("./commands/replayCommands");
const skillsCommands_1 = require("./commands/skillsCommands");
const preferencesCommands_1 = require("./commands/preferencesCommands");
const config_1 = require("./commands/config");
const ssh_1 = require("./commands/ssh");
const routerCommands_1 = require("./commands/routerCommands");
const gitCommands_1 = require("./commands/gitCommands");
const globDetector_1 = require("./utils/globDetector");
// Mandatory Node.js version check
const majorVersion = Number(process.versions.node.split('.')[0]);
if (majorVersion < 18) {
    console.error(chalk_1.default.red(`Error: yuangs requires Node.js >= 18. Current version: ${process.version}`));
    process.exit(1);
}
const packageJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;
// Initialize unified config service (fire-and-forget, config loads async)
(0, ConfigService_1.getConfigService)().init().catch(() => { });
const program = new commander_1.Command();
program
    .name('yuangs')
    .description('苑广山的个人命令行工具')
    .version(version, '-V, --version');
(0, completion_1.setProgramInstance)(program);
async function readStdin() {
    if (process.stdin.isTTY)
        return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        // Simple timeout to avoid hanging if no input
        setTimeout(() => resolve(data), 2000);
    });
}
function parseOptionsFromArgs(args) {
    return {
        exec: args.includes('-e') || args.includes('--exec'),
        model: getArgValue(args, ['-m', '--model']) || getModelFromShortcuts(args),
        withContent: args.includes('-w') || args.includes('--with-content')
    };
}
function getModelFromShortcuts(args) {
    if (args.includes('-p'))
        return 'Pro'; // 高质量模型
    if (args.includes('-f'))
        return 'Flash'; // 快速响应模型
    if (args.includes('-l'))
        return 'Lite'; // 轻量/低成本模型
    return undefined;
}
function getArgValue(args, flags) {
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
            const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await Promise.resolve().then(() => __importStar(require('./core/fileReader')));
            const filePaths = parseFilePathsFromLsOutput(stdinData);
            const contentMap = await readFilesContent(filePaths, { showProgress: false });
            question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
        }
        else {
            question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
        }
    }
    let model = options.model;
    if (options.p)
        model = 'Pro';
    if (options.f)
        model = 'Flash';
    if (options.l)
        model = 'Lite';
    const { PreferencesManager } = await Promise.resolve().then(() => __importStar(require('./agent/preferences')));
    if (options.contextStrategy) {
        const validStrategies = ['smart', 'minimal', 'full'];
        if (validStrategies.includes(options.contextStrategy)) {
            PreferencesManager.setPreferences({ contextStrategy: options.contextStrategy });
            console.log(chalk_1.default.cyan(`Context strategy set to: ${options.contextStrategy}`));
        }
        else {
            console.log(chalk_1.default.red(`Invalid context strategy: ${options.contextStrategy}`));
            console.log(chalk_1.default.gray('Valid options: smart, minimal, full'));
        }
    }
    if (!question && !stdinData) {
        await (0, handleAIChat_1.handleAIChat)(null, model);
        return;
    }
    const isPlannerEnabled = options.planner || (options.noPlanner !== true && PreferencesManager.getPreference('autoConfirm') === false);
    global.yuangsOptions = {
        showContextRelevance: options.showContextRelevance
    };
    if (isPlannerEnabled) {
        const { DualAgentRuntime } = await Promise.resolve().then(() => __importStar(require('./agent')));
        console.log(chalk_1.default.magenta('--- RUNNING WITH DUAL AGENT ENGINE (PLANNER + EXECUTOR) ---'));
        const runtime = new DualAgentRuntime(await Promise.resolve().then(() => __importStar(require('./ai/client'))).then(m => m.getConversationHistory()));
        await runtime.run(question || '', undefined, model);
    }
    else {
        const { AgentRuntime } = await Promise.resolve().then(() => __importStar(require('./agent')));
        console.log(chalk_1.default.magenta('--- RUNNING WITH NEW AGENT ENGINE ---'));
        const runtime = new AgentRuntime(await Promise.resolve().then(() => __importStar(require('./ai/client'))).then(m => m.getConversationHistory()));
        await runtime.run(question || '', options.exec ? 'command' : 'chat', undefined, model);
    }
});
program
    .command('list')
    .description('列出所有应用')
    .action(() => {
    const apps = (0, apps_1.loadAppsConfig)();
    console.log(chalk_1.default.bold.cyan('\n📱 应用列表\n'));
    Object.entries(apps).forEach(([key, url]) => {
        console.log(`  ${chalk_1.default.green('●')} ${chalk_1.default.bold(key.padEnd(10))} ${chalk_1.default.blue(url)}`);
    });
});
program
    .command('history')
    .description('查看及执行命令历史')
    .option('-l, --last', '执行上一条命令')
    .action(async (options) => {
    const history = (0, history_1.getCommandHistory)();
    if (history.length === 0) {
        console.log(chalk_1.default.gray('暂无命令历史\n'));
        return;
    }
    if (options.last) {
        const lastItem = history[0]; // history is unshift-ed, so 0 is latest
        console.log(chalk_1.default.bold.cyan('\n📋 上一次执行的命令:\n'));
        console.log(chalk_1.default.white(`${lastItem.command}`));
        console.log(chalk_1.default.gray(`问题: ${lastItem.question}\n`));
        const rlLast = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const confirmLast = await rlLast.question(chalk_1.default.cyan('确认再次执行? (y/N): '));
        rlLast.close();
        if (confirmLast.toLowerCase() === 'y' || confirmLast.toLowerCase() === 'yes') {
            const { exec } = require('child_process');
            console.log(chalk_1.default.bold.cyan('执行中...\n'));
            exec(lastItem.command, (error, stdout, stderr) => {
                if (stdout)
                    console.log(stdout);
                if (stderr)
                    console.error(chalk_1.default.red(stderr));
                if (error)
                    console.error(chalk_1.default.red(error.message));
                process.exit(0);
            });
            return;
        }
        else {
            console.log(chalk_1.default.gray('已取消执行'));
        }
        return;
    }
    console.log(chalk_1.default.bold.cyan('\n📋 命令历史\n'));
    history.forEach((item, index) => {
        console.log(`${index + 1}. ${chalk_1.default.white(item.command)}`);
        console.log(chalk_1.default.gray(`   问题: ${item.question}\n`));
    });
    const rlHistory = require('node:readline/promises').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const indexInput = await rlHistory.question(chalk_1.default.cyan('输入序号选择命令 (直接回车取消): '));
    rlHistory.close();
    if (indexInput.trim()) {
        const index = parseInt(indexInput) - 1;
        if (index >= 0 && index < history.length) {
            const targetCommand = history[index].command;
            console.log(chalk_1.default.yellow(`\n即将执行: ${targetCommand}\n`));
            const rlConfirm = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const confirm = await rlConfirm.question(chalk_1.default.cyan('确认执行? (y/N): '));
            rlConfirm.close();
            if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                const { exec } = require('child_process');
                console.log(chalk_1.default.bold.cyan('执行中...\n'));
                exec(targetCommand, (error, stdout, stderr) => {
                    if (stdout)
                        console.log(stdout);
                    if (stderr)
                        console.error(chalk_1.default.red(stderr));
                    if (error)
                        console.error(chalk_1.default.red(error.message));
                    process.exit(0);
                });
                return;
            }
            else {
                console.log(chalk_1.default.gray('已取消执行'));
            }
        }
        else {
            console.log(chalk_1.default.red('无效的序号'));
        }
    }
});
program;
program
    .command('macros')
    .description('查看所有快捷指令')
    .action(() => {
    const allMacros = (0, macros_1.getMacros)();
    console.log(chalk_1.default.bold.cyan('\n🚀 快捷指令列表\n'));
    Object.keys(allMacros).forEach(name => {
        console.log(`  ${chalk_1.default.white(name)}: ${chalk_1.default.gray(allMacros[name].commands)}`);
    });
});
program
    .command('save <name>')
    .description('保存快捷指令')
    .option('-l, --from-last', 'save last executed AI command')
    .option('-g, --global', 'add alias to ~/.zshrc')
    .action(async (name, options) => {
    const addToZshrc = (aliasName) => {
        const zshrcPath = path_1.default.join(os_1.default.homedir(), '.zshrc');
        if (fs_1.default.existsSync(zshrcPath)) {
            const aliasLine = `alias ${aliasName}="yuangs run ${aliasName}"`;
            try {
                const content = fs_1.default.readFileSync(zshrcPath, 'utf8');
                if (!content.includes(aliasLine)) {
                    fs_1.default.appendFileSync(zshrcPath, `\n${aliasLine}\n`);
                    console.log(chalk_1.default.green(`✓ 已添加 alias 到 ~/.zshrc`));
                    console.log(chalk_1.default.yellow(`ℹ️  请运行 "source ~/.zshrc" 以生效`));
                }
                else {
                    console.log(chalk_1.default.yellow(`ℹ️  Alias "${aliasName}" 已存在于 ~/.zshrc`));
                }
            }
            catch (err) {
                console.error(chalk_1.default.red(`❌ 无法写入 ~/.zshrc: ${err.message}`));
            }
        }
        else {
            console.log(chalk_1.default.red(`❌ 未找到 ~/.zshrc`));
        }
    };
    if (options.fromLast) {
        const history = (0, history_1.getCommandHistory)();
        if (history.length === 0) {
            console.log(chalk_1.default.red('❌ 暂无 AI 命令历史'));
            return;
        }
        const lastItem = history[0];
        (0, macros_1.saveMacro)(name, lastItem.command, `Saved from: ${lastItem.question}`);
        console.log(chalk_1.default.green(`✓ 已将最近一条 AI 命令保存为 "${name}"`));
        console.log(chalk_1.default.gray(`  Command: ${lastItem.command}`));
        if (options.global) {
            addToZshrc(name);
        }
        return;
    }
    const rl = require('node:readline/promises').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const cmd = await rl.question(chalk_1.default.cyan('请输入要保存的命令: '));
    (0, macros_1.saveMacro)(name, cmd);
    console.log(chalk_1.default.green(`✓ 快捷指令 "${name}" 已保存`));
    rl.close();
    if (options.global) {
        addToZshrc(name);
    }
});
program
    .command('run <name>')
    .description('执行快捷指令')
    .action((name) => {
    if ((0, macros_1.runMacro)(name)) {
        console.log(chalk_1.default.green(`✓ 正在执行 "${name}"...`));
    }
    else {
        console.log(chalk_1.default.red(`错误: 快捷指令 "${name}" 不存在`));
    }
});
program
    .command('completion [shell]')
    .description('生成并安装 Shell 补全脚本')
    .action(async (shell) => {
    const shellType = shell || process.env.SHELL?.split('/').pop() || 'bash';
    if (!['bash', 'zsh'].includes(shellType)) {
        console.log(chalk_1.default.red('错误: 不支持的 shell 类型'));
        console.log(chalk_1.default.gray('支持的类型: bash, zsh'));
        process.exit(1);
    }
    console.log(chalk_1.default.cyan(`\n正在为 ${shellType} 安装 yuangs 补全...\n`));
    let success = false;
    if (shellType === 'bash') {
        success = await (0, completion_1.installBashCompletion)(program);
    }
    else if (shellType === 'zsh') {
        success = await (0, completion_1.installZshCompletion)(program);
    }
    if (success) {
        console.log(chalk_1.default.green('✓ 补全安装成功！\n'));
        console.log(chalk_1.default.yellow('请重新加载 shell 配置:'));
        console.log(chalk_1.default.gray(`  ${shellType === 'bash' ? 'source ~/.bashrc' : 'source ~/.zshrc'}\n`));
    }
    else {
        console.log(chalk_1.default.red('✗ 补全安装失败\n'));
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
        const res = await (0, completion_1.complete)({ words, currentIndex });
        console.log(res.items.map(i => i.label).join(' '));
    }
    catch {
        console.log('');
        process.exit(0);
    }
});
(0, capabilityCommands_1.registerCapabilityCommands)(program);
(0, registryCommands_1.registerRegistryCommands)(program);
(0, explainCommands_1.registerExplainCommands)(program);
(0, replayCommands_1.registerReplayCommands)(program);
(0, skillsCommands_1.registerSkillsCommands)(program);
(0, preferencesCommands_1.registerPreferencesCommands)(program);
(0, config_1.registerConfigCommands)(program);
(0, ssh_1.registerSSHCommand)(program);
(0, routerCommands_1.registerRouterCommands)(program);
(0, gitCommands_1.registerGitCommands)(program);
program
    .command('help')
    .description('显示帮助信息')
    .action(() => {
    console.log(chalk_1.default.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
    console.log(chalk_1.default.yellow(`当前版本: ${version}`));
    console.log(chalk_1.default.white('使用方法:') + chalk_1.default.gray(' yuangs <命令> [参数]\n'));
    console.log(chalk_1.default.bold('命令列表:'));
    console.log(`  ${chalk_1.default.green('ai')} "<问题>"      向 AI 提问`);
    console.log(`    ${chalk_1.default.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
    console.log(`  ${chalk_1.default.green('list')}              列出所有应用`);
    console.log(`  ${chalk_1.default.green('history')}           查看命令历史`);
    console.log(`  ${chalk_1.default.green('config')}            管理本地配置 (~/.yuangs.json)`);
    console.log(`  ${chalk_1.default.green('macros')}            查看所有快捷指令`);
    console.log(`  ${chalk_1.default.green('save')} <名称>      保存快捷指令`);
    console.log(`  ${chalk_1.default.green('run')} <名称>        执行快捷指令`);
    console.log(`  ${chalk_1.default.green('registry')}          Macro Registry 管理`);
    console.log(`  ${chalk_1.default.green('diff-edit')}         代码变更治理 (propose/approve/exec/list/status)`);
    console.log(`  ${chalk_1.default.green('help')}              显示帮助信息\n`);
});
const apps = (0, apps_1.loadAppsConfig)();
program
    .command('shici')
    .description('打开古诗词 PWA')
    .action(() => {
    const url = apps['shici'] || apps_1.DEFAULT_APPS['shici'];
    console.log(chalk_1.default.green(`✓ 正在打开 shici...`));
    (0, apps_1.openUrl)(url);
});
program
    .command('dict')
    .description('打开英语词典')
    .action(() => {
    const url = apps['dict'] || apps_1.DEFAULT_APPS['dict'];
    console.log(chalk_1.default.green(`✓ 正在打开 dict...`));
    (0, apps_1.openUrl)(url);
});
program
    .command('pong')
    .description('打开 Pong 游戏')
    .action(() => {
    const url = apps['pong'] || apps_1.DEFAULT_APPS['pong'];
    console.log(chalk_1.default.green(`✓ 正在打开 pong...`));
    (0, apps_1.openUrl)(url);
});
program
    .argument('[command]', '自定义应用命令')
    .action((command) => {
    // 先检查是否是 macro
    const macros = (0, macros_1.getMacros)();
    if (command && macros[command]) {
        (0, macros_1.runMacro)(command);
    }
    else if (command && apps[command]) {
        (0, apps_1.openUrl)(apps[command]);
    }
    else {
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
        console.log(chalk_1.default.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
        console.log(chalk_1.default.yellow(`当前版本: ${version}`));
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
                    const globMatches = (0, globDetector_1.wouldExpandAsGlob)(stdinTrimmed, process.cwd());
                    if (globMatches.wouldExpand) {
                        console.log(chalk_1.default.yellow('⚠️  Zero‑Mode 触发符 \'??\' 在当前目录可能被解释为文件名展开：'));
                        console.log(chalk_1.default.gray('匹配到：'));
                        globMatches.matches.forEach(match => {
                            console.log(chalk_1.default.gray(`- ${match}`));
                        });
                        console.log(chalk_1.default.gray('\n请使用 \':ai\' 或空行 + Enter 进入 Zero‑Mode'));
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
                    const result = await (0, syntaxHandler_1.handleSpecialSyntax)(stdinData, '');
                    if (result.processed) {
                        // 如果特殊语法被处理
                        if (result.result) {
                            if (result.type === 'management') {
                                console.log(result.result);
                                process.exit(0);
                            }
                            else if (result.isPureReference) {
                                if (result.result.startsWith('错误:')) {
                                    console.log(chalk_1.default.red(result.result));
                                    process.exit(1);
                                }
                                else {
                                    console.log(chalk_1.default.green(`✓ 已将${result.type === 'file' ? '文件' : '目录'}加入上下文`));
                                    process.exit(0);
                                }
                            }
                            else {
                                question = result.result;
                            }
                        }
                        else {
                            process.exit(0);
                        }
                    }
                    else {
                        // 如果没有被处理，继续使用原始问题
                        console.log('警告: 未能处理特殊语法，使用原始输入');
                        if (options.withContent) {
                            const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await Promise.resolve().then(() => __importStar(require('./core/fileReader')));
                            const filePaths = parseFilePathsFromLsOutput(stdinData);
                            const contentMap = await readFilesContent(filePaths, { showProgress: false });
                            question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                        }
                        else {
                            question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                        }
                    }
                }
                else {
                    if (options.withContent) {
                        const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await Promise.resolve().then(() => __importStar(require('./core/fileReader')));
                        const filePaths = parseFilePathsFromLsOutput(stdinData);
                        const contentMap = await readFilesContent(filePaths, { showProgress: false });
                        question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                    }
                    else {
                        question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                    }
                }
            }
            // If question starts with ??, check for glob expansion
            const questionTrimmed = (question || '').trim();
            if (questionTrimmed.startsWith('??')) {
                const globMatches = (0, globDetector_1.wouldExpandAsGlob)('??', process.cwd());
                if (globMatches.wouldExpand) {
                    console.log(chalk_1.default.yellow('⚠️  Zero‑Mode 触发符 \'??\' 在当前目录可能被解释为文件名展开：'));
                    console.log(chalk_1.default.gray('匹配到：'));
                    globMatches.matches.forEach(match => {
                        console.log(chalk_1.default.gray(`- ${match}`));
                    });
                    console.log(chalk_1.default.gray('\n请使用 \':ai\' 或空行 + Enter 进入 Zero‑Mode'));
                    process.exit(1);
                }
            }
            // 如果 question 本身包含特殊语法（没有 stdin 或 stdin 不是特殊语法）
            const isSpecialSyntaxPrefix = (q) => {
                const t = q.trim();
                return t.startsWith('@') || t.startsWith('#') || t === ':ls' || t === ':clear' || t === ':cat' || t.startsWith(':cat ');
            };
            if (!stdinData || !isSpecialSyntaxPrefix(stdinData)) {
                const isQuestionSpecialSyntax = isSpecialSyntaxPrefix(questionTrimmed);
                if (isQuestionSpecialSyntax) {
                    const result = await (0, syntaxHandler_1.handleSpecialSyntax)(question, stdinData);
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
                            }
                            else if (result.isPureReference) {
                                // 纯引用且没有后续提问，输出提示并退出
                                if (result.error) {
                                    console.log(chalk_1.default.red(result.result));
                                    process.exit(1);
                                }
                                else {
                                    console.log(chalk_1.default.green(`✓ ${result.result || '已加入上下文'}`));
                                    process.exit(0);
                                }
                            }
                            else {
                                // 对于带提问的引用，将结果作为问题传递给AI
                                question = result.result;
                            }
                        }
                        else {
                            // 如果没有结果，可能只是执行了命令，直接退出
                            process.exit(0);
                        }
                    }
                    else {
                        // 如果没有被处理，继续使用原始问题
                        console.log('警告: 未能处理特殊语法，使用原始输入');
                    }
                }
            }
            let model = options.model;
            if (options.exec) {
                // 统一使用 AgentRuntime 执行命令模式，与 `yuangs ai -e` 保持一致
                const { AgentRuntime } = await Promise.resolve().then(() => __importStar(require('./agent')));
                console.log(chalk_1.default.magenta('--- RUNNING WITH AGENT ENGINE (COMMAND MODE) ---'));
                const runtime = new AgentRuntime(await Promise.resolve().then(() => __importStar(require('./ai/client'))).then(m => m.getConversationHistory()));
                await runtime.run(question || '', 'command', undefined, model);
            }
            else {
                await (0, handleAIChat_1.handleAIChat)(question || null, model);
            }
            process.exit(0);
        }
    }
    program.parse();
}
main().catch(err => {
    GlobalErrorHandler_1.GlobalErrorHandler.handleError(err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map