#!/usr/bin/env node

const yuangs = require('./index.js');
const chalk = require('chalk');
const { version } = require('./package.json');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;
const { marked } = require('marked');
const TerminalRenderer = require('marked-terminal').default;
const { exec } = require('child_process');

marked.setOptions({
    renderer: new TerminalRenderer({
        code: chalk.yellow,
        heading: chalk.magenta.bold,
        firstHeading: chalk.magenta.underline.bold,
        listitem: chalk.cyan,
        table: chalk.white,
        strong: chalk.bold.red,
        em: chalk.italic
    })
});

const args = process.argv.slice(2);
const command = args[0];

async function readStdin() {
    if (process.stdin.isTTY) return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            resolve(data);
        });
    });
}

function printHelp() {
    console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器\n'));
    console.log(chalk.yellow(`当前版本: ${version}`)); // 显示版本号
    console.log(chalk.gray('仓库地址: https://www.npmjs.com/package/yuangs?activeTab=readme\n'));
    console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
    console.log(chalk.bold('命令列表:'));

    // Show default commands
    console.log(`  ${chalk.green('shici')}             打开古诗词 PWA`);
    console.log(`  ${chalk.green('dict')}              打开英语词典`);
    console.log(`  ${chalk.green('pong')}              打开 Pong 游戏`);
    console.log(`  ${chalk.green('list')}              列出所有应用链接`);

    // Show dynamically configured apps
    const dynamicApps = Object.keys(yuangs.urls).filter(key =>
        !['shici', 'dict', 'pong'].includes(key)
    );
    if (dynamicApps.length > 0) {
        console.log(chalk.bold('\n自定义应用:'));
        dynamicApps.forEach(app => {
            console.log(`  ${chalk.green(app)}              打开 ${app} 应用`);
        });
    }

    console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问（不写问题进入交互模式）`);
    console.log(`    ${chalk.gray('--model, -m <模型名称>')}  指定 AI 模型 (可选)`);
    console.log(`    ${chalk.gray('-p -f -l')}  指定 pro,flash,lite 模型 (可选)`);
    console.log(`    ${chalk.gray('-e <描述>')}         生成 Linux 命令`);
    console.log(`  ${chalk.green('config')} <key> <value>  设置配置项`);
    console.log(`  ${chalk.green('history')}           查看命令历史`);
    console.log(`  ${chalk.green('save')} <名称>         创建快捷指令`);
    console.log(`  ${chalk.green('run')} <名称>          执行快捷指令`);
    console.log(`  ${chalk.green('macros')}            查看所有快捷指令`);
    console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
    console.log(chalk.bold('AI 交互模式命令:'));
    console.log(`    ${chalk.gray('/clear')}           清空对话历史`);
    console.log(`    ${chalk.gray('/history')}         查看对话历史\n`);
    console.log(chalk.gray('AI 示例: yuangs ai "你好" --model gemini-pro-latest'));
    console.log(chalk.gray('AI 生成命令: yuangs ai -e "查看当前目录"'));
    console.log(chalk.gray('普通示例: yuangs shici\n'));
    console.log(chalk.gray('配置文件: 您可以通过创建 yuangs.config.json 或 ~/.yuangs.json 来自定义应用列表\n'));
}

function printSuccess(app, url) {
    console.log(chalk.green(`✓ 正在打开 ${app}...`));
    console.log(chalk.gray(`  ${url}`));
}

async function askOnce(question, model) {
    const startTime = Date.now();
    let i = 0;
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const interval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        process.stdout.write(chalk.cyan(`\r${spinner[i++ % spinner.length]} 正在请求 AI，请稍候... (${elapsedTime}s}`));
    }, 100);

    try {
        const answer = await yuangs.getAIAnswer(question, model, true);
        clearInterval(interval);

        if (process.stdout.clearLine) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        } else {
            process.stdout.write('\r');
        }

        const totalElapsedTime = (Date.now() - startTime) / 1000;
        if (answer && answer.explanation) {
            console.log(marked(answer.explanation));
        } else {
            console.log(chalk.yellow('AI 未返回有效内容。'));
        }
        console.log(chalk.gray(`\n请求耗时: ${totalElapsedTime.toFixed(2)}s\n`));
    } catch (error) {
        clearInterval(interval);

        if (process.stdout.clearLine) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        } else {
            process.stdout.write('\r');
        }

        const totalElapsedTime = (Date.now() - startTime) / 1000;
        console.error(chalk.red('处理 AI 请求时出错:'), error.message || error);
        console.log(chalk.gray(`\n请求耗时: ${totalElapsedTime.toFixed(2)}s\n`));
    }
}

async function askOnceStream(question, model) {
    const startTime = Date.now();
    let messages = [...yuangs.getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    let fullResponse = '';
    let firstChunk = true;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        await yuangs.callAI_Stream(messages, model, (chunk) => {
            if (spinner.isSpinning) {
                spinner.stop();
            }
            fullResponse += chunk;
            process.stdout.write(chunk);
        });

        yuangs.addToConversationHistory('user', question);
        yuangs.addToConversationHistory('assistant', fullResponse);

        // 打印优美的分割线和 Markdown 渲染结果
        console.log('');
        console.log(chalk.gray('─'.repeat(Math.min(80, process.stdout.columns || 80))));
        console.log(marked(fullResponse));

        const totalElapsedTime = (Date.now() - startTime) / 1000;
        console.log(chalk.gray(`\n\n请求耗时: ${totalElapsedTime.toFixed(2)}s\n`));
    } catch (error) {
        if (spinner.isSpinning) {
            spinner.fail(chalk.red('AI 响应出错'));
        }
        console.error(error.message);
    }
}

async function handleAICommand() {
    const commandArgs = args.slice(1);

    let model = null;
    let questionParts = commandArgs;
    let isExecMode = false;

    const stdinContent = await readStdin();

    if (stdinContent) {
        questionParts.unshift(stdinContent);
    }

    // Check for -e flag
    const execIndex = commandArgs.indexOf('-e');
    if (execIndex !== -1) {
        isExecMode = true;
        // removing -e from args
        const before = commandArgs.slice(0, execIndex);
        const after = commandArgs.slice(execIndex + 1);
        questionParts = [...before, ...after];
    }

    // Check for shorthand model flags first
    const proIndex = questionParts.indexOf('-p');
    const flashIndex = questionParts.indexOf('-f');
    const liteIndex = questionParts.indexOf('-l');

    if (proIndex !== -1) {
        model = 'gemini-pro-latest';
        questionParts = questionParts.filter((_, index) => index !== proIndex);
    } else if (flashIndex !== -1) {
        model = 'gemini-flash-latest';
        questionParts = questionParts.filter((_, index) => index !== flashIndex);
    } else if (liteIndex !== -1) {
        model = 'gemini-flash-lite-latest';
        questionParts = questionParts.filter((_, index) => index !== liteIndex);
    }

    // If shorthand flags are not used, check for --model or -m
    if (!model) {
        const longIndex = questionParts.indexOf('--model');
        const shortIndex = questionParts.indexOf('-m');
        const modelIndex = longIndex !== -1 ? longIndex : shortIndex;

        if (modelIndex !== -1 && questionParts.length > modelIndex + 1) {
            model = questionParts[modelIndex + 1];
            // Filter out --model/-m and its value
            questionParts = questionParts.filter((_, index) => index !== modelIndex && index !== modelIndex + 1);
        }
    }

    const question = questionParts.join(' ').trim();

    // Special handling for execution mode
    if (isExecMode) {
        if (!question) {
            console.log(chalk.red('错误: 使用 -e 参数时必需提供描述。'));
            return;
        }

        const startTime = Date.now();
        let i = 0;
        const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        const interval = setInterval(() => {
            process.stdout.write(chalk.cyan(`\r${spinner[i++ % spinner.length]} 正在生成命令...`));
        }, 100);

        const command = await yuangs.generateCommand(question, model);
        clearInterval(interval);

        if (process.stdout.clearLine) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        } else {
            process.stdout.write('\r');
        }

        if (command) {
            console.log(chalk.gray('生成命令:'));
            console.log(chalk.bold.green(`> ${command}`));

            // 1. Try to copy to clipboard
            let copied = false;
            try {
                const { spawn } = require('child_process');
                let copyCmd, copyArgs = [];
                if (process.platform === 'darwin') {
                    copyCmd = 'pbcopy';
                } else if (process.platform === 'win32') {
                    copyCmd = 'clip';
                }

                if (copyCmd) {
                    const proc = spawn(copyCmd, copyArgs);
                    proc.stdin.write(command);
                    proc.stdin.end();
                    copied = true;
                    console.log(chalk.gray('(已复制到剪贴板)'));
                }
            } catch (e) {
                // Ignore copy errors
            }

            // 2. Pre-fill and ask to execute
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            console.log(chalk.gray('👇 您可以直接回车执行，或修改后回车：'));

            // This puts the command into the input line, effectively "pre-filling" it
            rl.write(command);

            rl.on('line', (input) => {
                rl.close();
                const finalCommand = input.trim();

                if (!finalCommand) {
                    process.exit(0);
                }

                const { spawn } = require('child_process');
                console.log(chalk.gray('正在执行...'));
                const child = spawn(finalCommand, [], { shell: true, stdio: 'inherit' });

                child.on('close', (code) => {
                    if (code === 0) {
                        yuangs.saveSuccessfulCommand(question, finalCommand);
                        console.log(chalk.green('\n✓ 执行成功并已存入历史库'));
                    } else {
                        console.log(chalk.red(`\n命令执行失败 (退出码: ${code})`));
                    }
                    process.exit(code);
                });
            });

            // Return to avoid continuing to other logic, let callback handle exit
            return;

        } else {
            console.log(chalk.yellow('未能生成有效的命令。'));
            process.exit(1);
        }
        return;
    }

    // 如果用户直接输入 `yuangs ai`，进入交互式模式
    if (!question) {
        console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));
        console.log(chalk.gray('直接输入你的问题，每回车一次提一个问题。\n'));
        console.log(chalk.gray('支持的命令:'));
        console.log(chalk.gray('  /clear - 清空对话历史'));
        console.log(chalk.gray('  /history - 查看对话历史\n'));

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // 定义递归询问函数
        const askLoop = () => {
            rl.question(chalk.green('你：'), async (q) => {
                const trimmed = q.trim();

                // ✨ 新增：优雅退出
                if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                    console.log(chalk.cyan('👋 再见！'));
                    rl.close();
                    process.exit(0);
                }

                // Handle special commands
                if (trimmed === '/clear') {
                    yuangs.clearConversationHistory();
                    console.log(chalk.yellow('✓ 对话历史已清空\n'));
                    return askLoop();
                }

                if (trimmed === '/history') {
                    const history = yuangs.getConversationHistory();
                    if (history.length === 0) {
                        console.log(chalk.gray('暂无对话历史\n'));
                    } else {
                        console.log(chalk.bold('📋 对话历史:\n'));
                        history.forEach((msg, index) => {
                            const prefix = msg.role === 'user' ? chalk.green('你: ') : chalk.blue('AI: ');
                            console.log(prefix + msg.content);
                        });
                        console.log('');
                    }
                    return askLoop();
                }

                if (!trimmed) {
                    return askLoop();
                }

                await askOnceStream(trimmed, model);
                askLoop();
            });
        };

        // 启动循环
        askLoop();
        return; // 结束函数，不再执行下面的单次请求
    }

    // 有问题时，直接请求一次
    await askOnceStream(question, model);
}

// Check if the command matches one of the configured apps
const isAppCommand = Object.keys(yuangs.urls).includes(command);

switch (command) {
    case 'shici':
        printSuccess('古诗词应用', yuangs.urls.shici || 'N/A');
        yuangs.openShici();
        break;
    case 'dict':
        printSuccess('英语词典', yuangs.urls.dict || 'N/A');
        yuangs.openDict();
        break;
    case 'pong':
        printSuccess('Pong 游戏', yuangs.urls.pong || 'N/A');
        yuangs.openPong();
        break;
    case 'list':
        console.log(chalk.bold.cyan('\n📱 苑广山的应用列表\n'));
        console.log(chalk.gray('─────────────────────────────────────────────────'));
        Object.entries(yuangs.urls).forEach(([key, url]) => {
            console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(8))} ${chalk.blue(url)}`);
        });
        console.log(chalk.gray('─────────────────────────────────────────────────\n'));
        break;
    case 'ai':
        handleAICommand();
        break;
    case 'config':
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
            console.log(chalk.cyan('\n⚙️  配置帮助: yuangs config <key> <value>'));
            console.log(chalk.gray('当前配置:'), yuangs.getUserConfig());
            console.log(chalk.gray('\n可用配置:'));
            console.log(chalk.gray('  defaultModel  默认AI模型 (如: Assistant, gemini-pro-latest)'));
            console.log(chalk.gray('  aiProxyUrl    AI代理地址'));
            console.log(chalk.gray('  accountType   账户类型 (如: free, pro)\n'));
            break;
        }
        const config = yuangs.getUserConfig();
        config[key] = value;
        fs.writeFileSync(path.join(require('os').homedir(), '.yuangs.json'), JSON.stringify(config, null, 2));
        console.log(chalk.green(`✓ 已更新 ${key}`));
        break;
    case 'history':
        const history = yuangs.getCommandHistory();
        if (history.length === 0) {
            console.log(chalk.gray('暂无命令历史\n'));
        } else {
            console.log(chalk.bold.cyan('\n📋 命令历史\n'));
            console.log(chalk.gray('─────────────────────────────────────────────────'));
            history.forEach((item, index) => {
                console.log(chalk.white(`${index + 1}. ${item.command}`));
                console.log(chalk.gray(`   问题: ${item.question}`));
                console.log(chalk.gray(`   时间: ${item.time}\n`));
            });
            console.log(chalk.gray('─────────────────────────────────────────────────\n'));
        }
        break;
    case 'save':
        const macroName = args[1];
        if (!macroName) {
            console.log(chalk.red('\n错误: 请指定快捷指令名称'));
            console.log(chalk.gray('用法: yuangs save <名称>\n'));
            break;
        }

        const readline = require('readline');
        const saveRl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(chalk.cyan(`\n正在创建快捷指令 "${macroName}"...`));
        console.log(chalk.gray('请输入要保存的命令（多行命令用 && 或 ; 分隔，输入空行结束）:\n'));

        let commandLines = [];
        const askCommand = () => {
            saveRl.question(chalk.green('> '), (line) => {
                if (line.trim() === '') {
                    if (commandLines.length === 0) {
                        console.log(chalk.yellow('\n未输入命令，已取消'));
                        saveRl.close();
                        return;
                    }

                    saveRl.question(chalk.cyan('请输入描述（可选）: '), (desc) => {
                        const commands = commandLines.map(cmd => cmd.trim()).join(' && ');
                        yuangs.saveMacro(macroName, commands, desc.trim());
                        console.log(chalk.green(`\n✓ 快捷指令 "${macroName}" 已保存\n`));
                        saveRl.close();
                    });
                    return;
                }
                commandLines.push(line);
                askCommand();
            });
        };
        askCommand();
        break;
    case 'run':
        const runMacroName = args[1];
        if (!runMacroName) {
            console.log(chalk.red('\n错误: 请指定快捷指令名称'));
            console.log(chalk.gray('用法: yuangs run <名称>\n'));
            break;
        }

        const macros = yuangs.getMacros();
        if (!macros[runMacroName]) {
            console.log(chalk.red(`\n错误: 快捷指令 "${runMacroName}" 不存在`));
            console.log(chalk.gray('使用 "yuangs macros" 查看所有快捷指令\n'));
            break;
        }

        const macro = macros[runMacroName];
        console.log(chalk.cyan(`\n执行快捷指令: ${runMacroName}`));
        if (macro.description) {
            console.log(chalk.gray(`描述: ${macro.description}`));
        }
        console.log(chalk.gray(`命令: ${macro.commands}\n`));

        const { spawn } = require('child_process');
        const child = spawn(macro.commands, [], { shell: true, stdio: 'inherit' });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(chalk.red(`\n快捷指令执行失败 (退出码: ${code})`));
                process.exit(code);
            }
        });
        break;
    case 'macros':
        const allMacros = yuangs.getMacros();
        const macroNames = Object.keys(allMacros);

        if (macroNames.length === 0) {
            console.log(chalk.gray('暂无快捷指令\n'));
            console.log(chalk.gray('使用 "yuangs save <名称>" 创建快捷指令\n'));
            break;
        }

        console.log(chalk.bold.cyan('\n🚀 快捷指令列表\n'));
        console.log(chalk.gray('─────────────────────────────────────────────────'));
        macroNames.forEach(name => {
            const m = allMacros[name];
            console.log(chalk.white(`  ${name}`));
            if (m.description) {
                console.log(chalk.gray(`    描述: ${m.description}`));
            }
            console.log(chalk.gray(`    命令: ${m.commands}`));
            console.log('');
        });
        console.log(chalk.gray('─────────────────────────────────────────────────\n'));
        console.log(chalk.gray('使用:'));
        console.log(chalk.gray('  yuangs run <名称>  执行快捷指令'));
        console.log(chalk.gray('  yuangs save <名称>  创建新快捷指令\n'));
        break;
    case 'help':
    case '--help':
    case '-h':
        printHelp();
        break;
    default:
        if (isAppCommand) {
            printSuccess(command, yuangs.urls[command]);
            yuangs.openApp(command);
        } else if (command) {
            console.log(chalk.red(`\n错误: 未知命令 '${command}'\n`));
            printHelp();
        } else {
            printHelp();
        }
        break;
}