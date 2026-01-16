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
    console.log(chalk.bold.cyan('\nyuangs CLI — Personal Command Line Toolkit'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('A lightweight CLI that combines:'));
    console.log(`• ${chalk.blue('App launcher')}`);
    console.log(`• ${chalk.green('AI assistant')}`);
    console.log(`• ${chalk.yellow('Command helper')}\n`);

    console.log(chalk.italic.gray('Design philosophy:'));
    console.log(chalk.italic.gray('AI suggests, you decide.\n'));

    console.log(chalk.bold('Usage:'));
    console.log(chalk.white(`  yuangs <command> [options]\n`));

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Core Commands\n'));
    console.log(`  ${chalk.green('shici'.padEnd(16))} Open Chinese poetry PWA`);
    console.log(`  ${chalk.green('dict'.padEnd(16))} Open English dictionary`);
    console.log(`  ${chalk.green('pong'.padEnd(16))} Open Pong game\n`);

    console.log(`  ${chalk.green('ai'.padEnd(16))} Ask AI questions / analyze output`);
    console.log(`  ${chalk.green('ai -e'.padEnd(16))} Let AI generate shell commands (manual confirm)\n`);

    console.log(`  ${chalk.green('list'.padEnd(16))} List all available apps`);
    console.log(`  ${chalk.green('help'.padEnd(16))} Show this help message\n`);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('AI Command\n'));
    console.log(`  ${chalk.white('yuangs ai "your question"')}`);
    console.log(chalk.gray('      Ask AI directly (safe, no side effects)\n'));

    console.log(`  ${chalk.white('yuangs ai')}`);
    console.log(chalk.gray('      Interactive chat mode\n'));

    console.log(`  ${chalk.white('yuangs ai -e "task description"')}`);
    console.log(chalk.gray('      Generate shell command and prefill for execution'));
    console.log(chalk.gray('      (command is NOT executed automatically)\n'));

    console.log(`  ${chalk.white('cat file | yuangs ai "explain this"')}`);
    console.log(chalk.gray('      Pipe command output to AI for analysis\n'));

    console.log(chalk.bold('Options:'));
    console.log(`  ${chalk.gray('-p'.padEnd(16))} Use gemini-pro-latest`);
    console.log(`  ${chalk.gray('-f'.padEnd(16))} Use gemini-flash-latest`);
    console.log(`  ${chalk.gray('-l'.padEnd(16))} Use gemini-flash-lite-latest`);
    console.log(`  ${chalk.gray('-m, --model'.padEnd(16))} Specify model explicitly\n`);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Macros (Shortcuts)\n'));
    console.log(`  ${chalk.white('yuangs save <name>')}   Save a complex command as a macro`);
    console.log(`  ${chalk.white('yuangs run <name>')}    Run a saved macro`);
    console.log(`  ${chalk.white('yuangs macros')}        List all saved macros\n`);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Configuration\n'));
    console.log(`  ${chalk.white('yuangs config <key> <value>')}   Update configuration\n`);
    console.log(chalk.bold('Common keys:'));
    console.log(`  ${chalk.gray('defaultModel'.padEnd(16))} Default AI model`);
    console.log(`  ${chalk.gray('aiProxyUrl'.padEnd(16))} Custom AI endpoint`);
    console.log(`  ${chalk.gray('accountType'.padEnd(16))} free | pro\n`);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Custom Apps\n'));
    console.log(chalk.gray('  Define your own apps in:'));
    console.log(chalk.gray('    .yuangs.json, yuangs.config.json, ~/.yuangs.json\n'));
    console.log(chalk.gray('  Then run:'));
    console.log(`    ${chalk.white('yuangs <appName>')}\n`);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Examples\n'));
    console.log(`  ${chalk.gray('yuangs ai "Who is Li Bai?"')}`);
    console.log(`  ${chalk.gray('yuangs ai -e "find files larger than 100M"')}`);
    console.log(`  ${chalk.gray('ls -la | yuangs ai "summarize these files"')}`);
    console.log(`  ${chalk.gray('yuangs save deploy')}`);
    console.log(`  ${chalk.gray('yuangs run deploy')}\n`);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.bold('Version:')} ${chalk.yellow(version)}`);
    console.log(`${chalk.bold('Repository:')} ${chalk.blue('https://github.com/yuanguangshan/yuangs')}\n`);
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
