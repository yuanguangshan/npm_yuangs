#!/usr/bin/env node

const yuangs = require('./index.js');
const chalk = require('chalk');
const { version } = require('./package.json'); // 引入版本号

const args = process.argv.slice(2);
const command = args[0];

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
    const startTime = Date.now(); // Record start time
    let i = 0;
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const interval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Calculate elapsed time in seconds
        process.stdout.write(chalk.cyan(`\r${spinner[i++ % spinner.length]} 正在请求 AI，请稍候... (${elapsedTime}s}`));
    }, 100);

    try {
        // For single requests (non-interactive mode), we may want to include history
        // For now, use history for all requests, but we could make this configurable
        const answer = await yuangs.getAIAnswer(question, model, true);
        clearInterval(interval);

        // Clear the spinner line if possible
        if (process.stdout.clearLine) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        } else {
            process.stdout.write('\r'); // Fallback to just carriage return
        }

        const totalElapsedTime = (Date.now() - startTime) / 1000; // Calculate total elapsed time
        if (answer && answer.explanation) {
            console.log(chalk.bold.green('🤖 AI 回答:\n'));
            console.log(answer.explanation);
        } else {
            console.log(chalk.yellow('AI 未返回有效内容。'));
        }
        console.log(chalk.gray(`\n请求耗时: ${totalElapsedTime.toFixed(2)}s\n`)); // Display total elapsed time
    } catch (error) {
        clearInterval(interval);

        // Clear the spinner line if possible
        if (process.stdout.clearLine) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        } else {
            process.stdout.write('\r'); // Fallback to just carriage return
        }

        const totalElapsedTime = (Date.now() - startTime) / 1000; // Calculate total elapsed time on error
        console.error(chalk.red('处理 AI 请求时出错:'), error.message || error);
        console.log(chalk.gray(`\n请求耗时: ${totalElapsedTime.toFixed(2)}s\n`)); // Display total elapsed time on error
    }
}

async function handleAICommand() {
    const commandArgs = args.slice(1);

    let model = null;
    let questionParts = commandArgs;
    let isExecMode = false;

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
        } else {
            console.log(chalk.yellow('未能生成有效的命令。'));
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
                    return askLoop(); // 空输入则重新询问
                }

                // 等待回答完成后，再开启下一轮询问
                await askOnce(trimmed, model);
                askLoop();
            });
        };

        // 启动循环
        askLoop();
        return; // 结束函数，不再执行下面的单次请求
    }

    // 有问题时，直接请求一次
    await askOnce(question, model);
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
    case 'help':
    case '--help':
    case '-h':
        printHelp();
        break;
    default:
        // If it's an app command but not one of the named ones, handle it with the dynamic function
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