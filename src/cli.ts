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

// Parse flags from args
const hasFlag = (flags: string[]) => args.some(a => flags.includes(a));
const isExecMode = hasFlag(['-e']);
const isDryRun = hasFlag(['--dry-run', '--dry']);
const isAutoYes = hasFlag(['--yes', '-y']);
const isLastHistory = hasFlag(['--last']);

function printHelp() {
    console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
    console.log(chalk.yellow(`当前版本: ${version}`));
    console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
    console.log(chalk.bold('命令列表:'));
    console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问`);
    console.log(`    ${chalk.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
    console.log(`    ${chalk.gray('--dry-run')}       仅模拟不执行`);
    console.log(`    ${chalk.gray('--yes, -y')}       自动确认`);
    console.log(`  ${chalk.green('list')}              列出所有应用`);
    console.log(`  ${chalk.green('history')}           查看命令历史`);
    console.log(`    ${chalk.gray('--last')}          查看并重新执行上一条命令`);
    console.log(`  ${chalk.green('config')}            管理本地配置 (~/.yuangs.json)`);
    console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
}

async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) return '';
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
    const apps = loadAppsConfig();
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
                await handleAICommand(question, {
                    execute: false, // Default is false, handleAICommand internals decide based on prompt confirmation or --yes
                    dryRun: isDryRun,
                    autoYes: isAutoYes
                });
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
                break;
            }

            if (isLastHistory) {
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
                break;
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
            const rlSave = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const cmd = await rlSave.question(chalk.cyan('请输入要保存的命令: '));
            saveMacro(macroName, cmd);
            console.log(chalk.green(`✓ 快捷指令 "${macroName}" 已保存`));
            rlSave.close();
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
