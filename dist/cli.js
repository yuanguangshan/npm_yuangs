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
function printHelp() {
    console.log(chalk_1.default.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
    console.log(chalk_1.default.yellow(`当前版本: ${version}`));
    console.log(chalk_1.default.white('使用方法:') + chalk_1.default.gray(' yuangs <命令> [参数]\n'));
    console.log(chalk_1.default.bold('命令列表:'));
    console.log(`  ${chalk_1.default.green('ai')} "<问题>"      向 AI 提问`);
    console.log(`    ${chalk_1.default.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
    console.log(`  ${chalk_1.default.green('list')}              列出所有应用`);
    console.log(`  ${chalk_1.default.green('history')}           查看命令历史`);
    console.log(`  ${chalk_1.default.green('config')}            管理本地配置 (~/.yuangs.json)`);
    console.log(`  ${chalk_1.default.green('help')}              显示帮助信息\n`);
}
async function main() {
    const apps = (0, apps_1.loadAppsConfig)();
    let stdinData = '';
    // Check if there is data in stdin (Pipe mode)
    if (!process.stdin.isTTY) {
        stdinData = await new Promise((resolve) => {
            let data = '';
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', chunk => data += chunk);
            process.stdin.on('end', () => resolve(data));
            // timeout if no data comes
            setTimeout(() => resolve(data), 1000);
        });
    }
    switch (command) {
        case 'ai':
            const aiArgs = args.slice(1);
            const isExecMode = aiArgs.includes('-e');
            const questionParts = aiArgs.filter(a => a !== '-e');
            let question = questionParts.join(' ').trim();
            if (stdinData) {
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
            if (isExecMode) {
                await (0, handleAICommand_1.handleAICommand)(question, { execute: false });
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
            }
            else {
                console.log(chalk_1.default.bold.cyan('\n📋 命令历史\n'));
                history.forEach((item, index) => {
                    console.log(`${index + 1}. ${chalk_1.default.white(item.command)}`);
                    console.log(chalk_1.default.gray(`   问题: ${item.question}\n`));
                });
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
            const readline = require('readline');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question(chalk_1.default.cyan('请输入要保存的命令: '), (cmd) => {
                (0, macros_1.saveMacro)(macroName, cmd);
                console.log(chalk_1.default.green(`✓ 快捷指令 "${macroName}" 已保存`));
                rl.close();
            });
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