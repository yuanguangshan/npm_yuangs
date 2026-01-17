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
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const commander_1 = require("commander");
const handleAICommand_1 = require("./commands/handleAICommand");
const handleAIChat_1 = require("./commands/handleAIChat");
const handleConfig_1 = require("./commands/handleConfig");
const capabilityCommands_1 = require("./commands/capabilityCommands");
const apps_1 = require("./core/apps");
const macros_1 = require("./core/macros");
const history_1 = require("./utils/history");
const packageJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;
const program = new commander_1.Command();
program
    .name('yuangs')
    .description('苑广山的个人命令行工具')
    .version(version);
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
        return 'gemini-2.5-flash-lite';
    if (args.includes('-f'))
        return 'gemini-2.5-flash-lite';
    if (args.includes('-l'))
        return 'gemini-2.5-flash-lite';
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
    .option('-p', '使用 Pro 模型 (gemini-2.5-flash-lite)')
    .option('-f', '使用 Flash 模型 (gemini-2.5-flash-lite)')
    .option('-l', '使用 Lite 模型 (gemini-2.5-flash-lite)')
    .option('-w, --with-content', '在管道模式下读取文件内容')
    .option('-v, --verbose', '详细输出（显示 Capability 匹配详情）')
    .action(async (questionArgs, options) => {
    const stdinData = await readStdin();
    let question = Array.isArray(questionArgs) ? questionArgs.join(' ').trim() : questionArgs || '';
    if (stdinData) {
        if (options.withContent) {
            const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await Promise.resolve().then(() => __importStar(require('./core/fileReader')));
            const filePaths = parseFilePathsFromLsOutput(stdinData);
            const contentMap = readFilesContent(filePaths);
            question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
        }
        else {
            question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
        }
    }
    let model = options.model;
    if (options.p)
        model = 'gemini-2.5-flash-lite';
    if (options.f)
        model = 'gemini-2.5-flash-lite';
    if (options.l)
        model = 'gemini-2.5-flash-lite';
    if (options.exec) {
        await (0, handleAICommand_1.handleAICommand)(question, { execute: false, model, verbose: options.verbose });
    }
    else {
        await (0, handleAIChat_1.handleAIChat)(question || null, model);
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
program
    .command('config')
    .description('管理本地配置 (~/.yuangs.json)')
    .argument('[action]', 'get, set, list')
    .argument('[key]', '配置项名称')
    .argument('[value]', '配置项值')
    .action(handleConfig_1.handleConfig);
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
    .action(async (name, options) => {
    if (options.fromLast) {
        const history = (0, history_1.getCommandHistory)();
        if (history.length === 0) {
            console.log(chalk_1.default.red('❌ 暂无 AI 命令历史'));
            return;
        }
        const lastItem = history[0];
        // Assume the last item in history is what we want. 
        // The history is unshifted, so index 0 is the latest.
        (0, macros_1.saveMacro)(name, lastItem.command, `Saved from: ${lastItem.question}`);
        console.log(chalk_1.default.green(`✓ 已将最近一条 AI 命令保存为 "${name}"`));
        console.log(chalk_1.default.gray(`  Command: ${lastItem.command}`));
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
(0, capabilityCommands_1.registerCapabilityCommands)(program);
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
    if (command && apps[command]) {
        (0, apps_1.openUrl)(apps[command]);
    }
    else {
        program.outputHelp();
    }
});
async function main() {
    const args = process.argv.slice(2);
    const knownCommands = ['ai', 'list', 'history', 'config', 'macros', 'save', 'run', 'help', 'shici', 'dict', 'pong', 'capabilities'];
    const globalFlags = ['-h', '--help', '-V', '--version', '-v'];
    const firstArg = args[0];
    const isKnownCommand = firstArg && knownCommands.includes(firstArg);
    const isGlobalFlag = firstArg && globalFlags.includes(firstArg);
    if (!isKnownCommand && !isGlobalFlag) {
        const stdinData = await readStdin();
        if (stdinData || args.length > 0) {
            const options = parseOptionsFromArgs(args);
            let question = args.filter(arg => !arg.startsWith('-')).join(' ');
            if (stdinData) {
                if (options.withContent) {
                    const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await Promise.resolve().then(() => __importStar(require('./core/fileReader')));
                    const filePaths = parseFilePathsFromLsOutput(stdinData);
                    const contentMap = readFilesContent(filePaths);
                    question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                }
                else {
                    question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                }
            }
            let model = options.model;
            if (options.exec) {
                await (0, handleAICommand_1.handleAICommand)(question, { execute: false, model, verbose: options.withContent });
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
    console.error('Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map