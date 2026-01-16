#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handleAICommand_1 = require("./commands/handleAICommand");
const handleAIChat_1 = require("./commands/handleAIChat");
const handleConfig_1 = require("./commands/handleConfig");
const apps_1 = require("./core/apps");
const macros_1 = require("./core/macros"); // I need to implement runMacro
const history_1 = require("./utils/history");
const packageJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;
const args = process.argv.slice(2);
const command = args[0];
// Parse flags from args
const hasFlag = (flags) => args.some(a => flags.includes(a));
const isExecMode = hasFlag(['-e']);
const isDryRun = hasFlag(['--dry-run', '--dry']);
const isAutoYes = hasFlag(['--yes', '-y']);
const isLastHistory = hasFlag(['--last']);
function printHelp() {
    console.log(chalk_1.default.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
    console.log(chalk_1.default.yellow(`当前版本: ${version}`));
    console.log(chalk_1.default.white('使用方法:') + chalk_1.default.gray(' yuangs <命令> [参数]\n'));
    console.log(chalk_1.default.bold('命令列表:'));
    console.log(`  ${chalk_1.default.green('ai')} "<问题>"      向 AI 提问`);
    console.log(`    ${chalk_1.default.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
    console.log(`    ${chalk_1.default.gray('--dry-run')}       仅模拟不执行`);
    console.log(`    ${chalk_1.default.gray('--yes, -y')}       自动确认`);
    console.log(`  ${chalk_1.default.green('list')}              列出所有应用`);
    console.log(`  ${chalk_1.default.green('history')}           查看命令历史`);
    console.log(`    ${chalk_1.default.gray('--last')}          查看并重新执行上一条命令`);
    console.log(`  ${chalk_1.default.green('config')}            管理本地配置 (~/.yuangs.json)`);
    console.log(`  ${chalk_1.default.green('help')}              显示帮助信息\n`);
}
async function readStdin() {
    if (process.stdin.isTTY)
        return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        // Safety timeout
        setTimeout(() => resolve(data), 2000);
    });
}
async function main() {
    const apps = (0, apps_1.loadAppsConfig)();
    const stdinData = await readStdin();
    switch (command) {
        case 'ai':
            const aiArgs = args.slice(1);
            // Cleanup args for question extraction: remove flags
            const questionParts = aiArgs.filter(a => !['-e', '--dry-run', '--dry', '--yes', '-y'].includes(a));
            let question = questionParts.join(' ').trim();
            if (stdinData) {
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
            if (isExecMode) {
                await (0, handleAICommand_1.handleAICommand)(question, {
                    execute: false, // Default is false, handleAICommand internals decide based on prompt confirmation or --yes
                    dryRun: isDryRun,
                    autoYes: isAutoYes
                });
            }
            else {
                await (0, handleAIChat_1.handleAIChat)(question || null);
            }
            break;
        case 'list':
            console.log(chalk_1.default.bold.cyan('\n📱 应用列表\n'));
            Object.entries(apps).forEach(([key, url]) => {
                console.log(`  ${chalk_1.default.green('●')} ${chalk_1.default.bold(key.padEnd(10))} ${chalk_1.default.blue(url)}`);
            });
            break;
        case 'shici':
        case 'dict':
        case 'pong':
            const url = apps[command] || apps_1.DEFAULT_APPS[command];
            console.log(chalk_1.default.green(`✓ 正在打开 ${command}...`));
            (0, apps_1.openUrl)(url);
            break;
        case 'history':
            const history = (0, history_1.getCommandHistory)();
            if (history.length === 0) {
                console.log(chalk_1.default.gray('暂无命令历史\n'));
                break;
            }
            if (isLastHistory) {
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
                break;
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
            break;
        case 'config':
            (0, handleConfig_1.handleConfig)(args.slice(1));
            break;
        case 'macros':
            const allMacros = (0, macros_1.getMacros)();
            console.log(chalk_1.default.bold.cyan('\n🚀 快捷指令列表\n'));
            Object.keys(allMacros).forEach(name => {
                console.log(`  ${chalk_1.default.white(name)}: ${chalk_1.default.gray(allMacros[name].commands)}`);
            });
            break;
        case 'save':
            const macroName = args[1];
            if (!macroName) {
                console.log(chalk_1.default.red('\n错误: 请指定快捷指令名称'));
                break;
            }
            const rlSave = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const cmd = await rlSave.question(chalk_1.default.cyan('请输入要保存的命令: '));
            (0, macros_1.saveMacro)(macroName, cmd);
            console.log(chalk_1.default.green(`✓ 快捷指令 "${macroName}" 已保存`));
            rlSave.close();
            break;
        case 'run':
            const runName = args[1];
            if (!runName)
                break;
            if ((0, macros_1.runMacro)(runName)) {
                console.log(chalk_1.default.green(`✓ 正在执行 "${runName}"...`));
            }
            else {
                console.log(chalk_1.default.red(`错误: 快捷指令 "${runName}" 不存在`));
            }
            break;
        case 'help':
        case '--help':
        case '-h':
        default:
            if (command && apps[command]) {
                (0, apps_1.openUrl)(apps[command]);
            }
            else {
                printHelp();
            }
            break;
    }
}
main().catch(err => {
    console.error(chalk_1.default.red('Fatal Error:'), err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map