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
    console.log(`  ${chalk.green('shici')}             打开古诗词 PWA`);
    console.log(`  ${chalk.green('dict')}              打开英语词典`);
    console.log(`  ${chalk.green('pong')}              打开 Pong 游戏`);
    console.log(`  ${chalk.green('list')}              列出所有应用链接`);
    console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问（不写问题进入交互模式）`);
    console.log(`    ${chalk.gray('--model, -m <模型名称>')}  指定 AI 模型 (可选)`);
    console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
    console.log(chalk.bold('AI 交互模式命令:'));
    console.log(`    ${chalk.gray('/clear')}           清空对话历史`);
    console.log(`    ${chalk.gray('/history')}         查看对话历史\n`);
    console.log(chalk.gray('AI 示例: yuangs ai "你好" --model gemini-pro-latest'));
    console.log(chalk.gray('普通示例: yuangs shici\n'));
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

    let model = null; // Default model will be handled in index.js
    let questionParts = commandArgs;

    // Check for shorthand model flags first
    const proIndex = commandArgs.indexOf('-p');
    const flashIndex = commandArgs.indexOf('-f');
    const liteIndex = commandArgs.indexOf('-l');

    if (proIndex !== -1) {
        model = 'gemini-pro-latest';
        questionParts = commandArgs.filter((_, index) => index !== proIndex);
    } else if (flashIndex !== -1) {
        model = 'gemini-flash-latest';
        questionParts = commandArgs.filter((_, index) => index !== flashIndex);
    } else if (liteIndex !== -1) {
        model = 'gemini-flash-lite-latest';
        questionParts = commandArgs.filter((_, index) => index !== liteIndex);
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

switch (command) {
    case 'shici':
        printSuccess('古诗词应用', yuangs.urls.shici);
        yuangs.openShici();
        break;
    case 'dict':
        printSuccess('英语词典', yuangs.urls.dict);
        yuangs.openDict();
        break;
    case 'pong':
        printSuccess('Pong 游戏', yuangs.urls.pong);
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
    default:
        printHelp();
        break;
}