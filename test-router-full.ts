import { 
    executeTask, 
    getRouter, 
    TaskType, 
    RoutingStrategy 
} from './src/core/modelRouter';
import chalk from 'chalk';

async function runTest() {
    console.log(chalk.bold.cyan('\n🚀 开始 ModelRouter 综合响应测试...\n'));
    
    const router = getRouter();
    const adapters = router.getAdapters();
    
    console.log(chalk.white('已注册适配器: ') + adapters.map(a => a.name).join(', '));
    console.log('--------------------------------------------------');

    const tests = [
        {
            name: '基础对话 (Auto)',
            prompt: '你好，请用一句话介绍你自己',
            config: { type: TaskType.CONVERSATION, description: 'Basic chat test' },
            routing: { strategy: RoutingStrategy.AUTO }
        },
        {
            name: '代码审查 (Mapping 验证)',
            prompt: 'diff --git a/index.js b/index.js\n+console.log("hello world");',
            config: { type: TaskType.CODE_REVIEW, description: 'Code review test' },
            routing: undefined // 不要指定策略，让它命中全局 mapping
        },
        {
            name: 'Gemini 专项测试',
            prompt: 'Translate to English: 今天天气不错',
            config: { type: TaskType.TRANSLATION, description: 'Gemini specific test' },
            routing: { strategy: RoutingStrategy.MANUAL, manualModelName: 'google-gemini' }
        },
        {
            name: '通义千问专项测试',
            prompt: '写一个快速排序算法',
            config: { type: TaskType.CODE_GENERATION, description: 'Qwen specific test' },
            routing: { strategy: RoutingStrategy.MANUAL, manualModelName: 'qwen' }
        }
    ];

    const results = [];

    for (const test of tests) {
        console.log(chalk.yellow(`\n正在执行: ${test.name}...`));
        try {
            // 检查适配器是否可用
            if (test.routing?.strategy === RoutingStrategy.MANUAL) {
                const adapter = adapters.find(a => a.name === test.routing?.manualModelName);
                if (!adapter || !(await adapter.isAvailable())) {
                    console.log(chalk.gray(`⏭️  跳过测试: 适配器 ${test.routing?.manualModelName} 不可用`));
                    results.push({
                        test: test.name,
                        model: test.routing?.manualModelName || 'Unknown',
                        status: chalk.yellow('SKIPPED'),
                        latency: '-',
                        realTime: '-',
                        error: 'Adapter unavailable'
                    });
                    continue;
                }
            }

            const start = Date.now();
            const result = await executeTask(test.prompt, test.config as any, test.routing);
            const duration = Date.now() - start;

            results.push({
                test: test.name,
                model: result.modelName,
                status: result.success ? chalk.green('PASS') : chalk.red('FAIL'),
                latency: `${result.executionTime}ms`,
                realTime: `${duration}ms`,
                error: result.error || '-'
            });

            if (result.success) {
                console.log(chalk.green(`✓ 响应成功 (模型: ${result.modelName}, 耗时: ${result.executionTime}ms)`));
            } else {
                console.log(chalk.red(`✗ 响应失败: ${result.error}`));
            }
        } catch (e: any) {
            results.push({
                test: test.name,
                model: 'Unknown',
                status: chalk.bgRed('CRASH'),
                latency: '-',
                realTime: '-',
                error: e.message
            });
            console.log(chalk.red(`💥 程序崩溃: ${e.message}`));
        }
    }

    console.log(chalk.bold.cyan('\n📊 测试总结报告\n'));
    console.table(results.map(r => ({
        '测试项': r.test,
        '实际使用模型': r.model,
        '状态': r.status,
        '逻辑耗时': r.latency,
        '总耗时': r.realTime
    })));

    const successCount = results.filter(r => r.status.includes('PASS')).length;
    console.log(`\n🎉 测试完成: ${successCount}/${tests.length} 成功\n`);
}

runTest().catch(console.error);
