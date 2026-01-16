#!/usr/bin/env node
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { handleAICommand } from './commands/handleAICommand';
import { handleAIChat } from './commands/handleAIChat';
import { handleConfig } from './commands/handleConfig';
import { loadAppsConfig, openUrl, DEFAULT_APPS } from './core/apps';

import { getMacros, saveMacro, runMacro } from './core/macros'; // I need to implement runMacro
import { getCommandHistory } from './utils/history';
import { getUserConfig } from './ai/client';

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
    console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
    console.log(chalk.yellow(`当前版本: ${version}`));
    console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
    console.log(chalk.bold('命令列表:'));
    console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问`);
    console.log(`    ${chalk.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
    console.log(`  ${chalk.green('list')}              列出所有应用`);
    console.log(`  ${chalk.green('history')}           查看命令历史`);
    console.log(`  ${chalk.green('config')}            管理本地配置 (~/.yuangs.json)`);
    console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
}

async function main() {
    const apps = loadAppsConfig();

    switch (command) {
        case 'ai':
            const aiArgs = args.slice(1);
            const isExecMode = aiArgs.includes('-e');
            const questionParts = aiArgs.filter(a => a !== '-e');
            const question = questionParts.join(' ').trim();

            if (isExecMode) {
                await handleAICommand(question, { execute: false });
            } else {
                await handleAIChat(question || null);
            }
            break;

        case 'list':
            console.log(chalk.bold.cyan('\n📱 应用列表\n'));
            Object.entries(apps).forEach(([key, url]) => {
                console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(10))} ${chalk.blue(url)}`);
            });
            break;

        case 'shici':
        case 'dict':
        case 'pong':
            const url = apps[command] || (DEFAULT_APPS as any)[command];
            console.log(chalk.green(`✓ 正在打开 ${command}...`));
            openUrl(url);
            break;

        case 'history':
            const history = getCommandHistory();
            if (history.length === 0) {
                console.log(chalk.gray('暂无命令历史\n'));
            } else {
                console.log(chalk.bold.cyan('\n📋 命令历史\n'));
                history.forEach((item, index) => {
                    console.log(`${index + 1}. ${chalk.white(item.command)}`);
                    console.log(chalk.gray(`   问题: ${item.question}\n`));
                });
            }
            break;

        case 'config':
            handleConfig(args.slice(1));
            break;


        case 'macros':
            const allMacros = getMacros();
            console.log(chalk.bold.cyan('\n🚀 快捷指令列表\n'));
            Object.keys(allMacros).forEach(name => {
                console.log(`  ${chalk.white(name)}: ${chalk.gray(allMacros[name].commands)}`);
            });
            break;

        case 'save':
            const macroName = args[1];
            if (!macroName) {
                console.log(chalk.red('\n错误: 请指定快捷指令名称'));
                break;
            }
            const readline = require('readline');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question(chalk.cyan('请输入要保存的命令: '), (cmd: string) => {
                saveMacro(macroName, cmd);
                console.log(chalk.green(`✓ 快捷指令 "${macroName}" 已保存`));
                rl.close();
            });
            break;

        case 'run':
            const runName = args[1];
            if (!runName) break;
            if (runMacro(runName)) {
                console.log(chalk.green(`✓ 正在执行 "${runName}"...`));
            } else {
                console.log(chalk.red(`错误: 快捷指令 "${runName}" 不存在`));
            }
            break;

        case 'help':
        case '--help':
        case '-h':
        default:
            if (command && apps[command]) {
                openUrl(apps[command]);
            } else {
                printHelp();
            }
            break;
    }
}

main().catch(err => {
    console.error(chalk.red('Fatal Error:'), err);
    process.exit(1);
});
