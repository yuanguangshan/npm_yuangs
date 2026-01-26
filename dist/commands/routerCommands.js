"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRouterCommands = registerRouterCommands;
const chalk_1 = __importDefault(require("chalk"));
const modelRouter_1 = require("../core/modelRouter");
const config_1 = require("../core/modelRouter/config");
/**
 * 注册路由器命令
 */
function registerRouterCommands(program) {
    const routerCmd = program
        .command('router')
        .description('管理多模型路由系统');
    // 列出所有已注册的适配器
    routerCmd
        .command('list')
        .description('列出所有已注册的模型适配器')
        .action(async () => {
        try {
            const router = (0, modelRouter_1.getRouter)();
            const adapters = router.getAdapters();
            if (adapters.length === 0) {
                console.log(chalk_1.default.yellow('没有已注册的模型适配器'));
                return;
            }
            console.log(chalk_1.default.bold.cyan('\n🤖 已注册的模型适配器\n'));
            for (const adapter of adapters) {
                const available = await adapter.isAvailable();
                const statusIcon = available ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                const statusText = available ? chalk_1.default.green('可用') : chalk_1.default.red('不可用');
                console.log(`${statusIcon} ${chalk_1.default.bold(adapter.name)} (${adapter.provider})`);
                console.log(`   版本: ${adapter.version}`);
                console.log(`   状态: ${statusText}`);
                console.log(`   支持的任务: ${adapter.capabilities.supportedTaskTypes.join(', ')}`);
                console.log(`   上下文窗口: ${adapter.capabilities.maxContextWindow}`);
                console.log(`   平均响应时间: ${adapter.capabilities.avgResponseTime}ms`);
                console.log(`   成本等级: ${adapter.capabilities.costLevel}/5`);
                if (adapter.capabilities.specialCapabilities) {
                    console.log(`   特殊能力: ${adapter.capabilities.specialCapabilities.join(', ')}`);
                }
                console.log();
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    // 查看统计信息
    routerCmd
        .command('stats [model]')
        .description('查看模型使用统计信息')
        .action((model) => {
        try {
            const router = (0, modelRouter_1.getRouter)();
            const stats = router.getStats(model);
            if (Array.isArray(stats)) {
                if (stats.length === 0) {
                    console.log(chalk_1.default.yellow('暂无统计数据'));
                    return;
                }
                console.log(chalk_1.default.bold.cyan('\n📊 模型使用统计\n'));
                for (const stat of stats) {
                    printModelStats(stat);
                }
            }
            else {
                console.log(chalk_1.default.bold.cyan(`\n📊 ${stats.modelName} 使用统计\n`));
                printModelStats(stats);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    // 测试适配器
    routerCmd
        .command('test <adapter>')
        .description('测试指定的模型适配器')
        .option('-p, --prompt <text>', '测试提示词', '你好，请介绍一下自己')
        .action(async (adapterName, options) => {
        try {
            const router = (0, modelRouter_1.getRouter)();
            const adapters = router.getAdapters();
            const adapter = adapters.find((a) => a.name === adapterName);
            if (!adapter) {
                console.error(chalk_1.default.red(`找不到适配器: ${adapterName}`));
                process.exit(1);
            }
            console.log(chalk_1.default.cyan(`正在测试 ${adapter.name}...\n`));
            const available = await adapter.healthCheck();
            if (!available) {
                console.error(chalk_1.default.red(`✗ ${adapter.name} 健康检查失败，模型不可用`));
                process.exit(1);
            }
            console.log(chalk_1.default.green(`✓ ${adapter.name} 健康检查通过\n`));
            const result = await router.executeTask(adapter, options.prompt, {
                type: modelRouter_1.TaskType.CONVERSATION,
                description: '测试请求',
            });
            if (result.success) {
                console.log(chalk_1.default.green(`\n✓ 测试成功\n`));
                console.log(chalk_1.default.bold('响应内容:'));
                console.log(result.content);
                console.log(chalk_1.default.gray(`\n执行时间: ${result.executionTime}ms`));
            }
            else {
                console.error(chalk_1.default.red(`\n✗ 测试失败: ${result.error}`));
                process.exit(1);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    // 配置管理
    const configCmd = routerCmd
        .command('config')
        .description('管理路由器配置');
    configCmd
        .command('show')
        .description('显示当前配置')
        .action(() => {
        try {
            const config = (0, config_1.loadConfig)();
            console.log(chalk_1.default.bold.cyan('\n⚙️  当前配置\n'));
            console.log(JSON.stringify(config, null, 2));
            console.log(chalk_1.default.gray(`\n配置文件位置: ${(0, config_1.getConfigPath)()}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    configCmd
        .command('set <key> <value>')
        .description('设置配置项')
        .action((key, value) => {
        try {
            const config = (0, config_1.loadConfig)();
            let parsedValue = value;
            // 尝试解析 JSON 值
            try {
                parsedValue = JSON.parse(value);
            }
            catch {
                // 保持原始字符串值
            }
            config[key] = parsedValue;
            (0, config_1.saveConfig)(config);
            console.log(chalk_1.default.green(`✓ 已设置 ${key} = ${JSON.stringify(parsedValue)}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    configCmd
        .command('reset')
        .description('重置配置为默认值')
        .action(() => {
        try {
            (0, config_1.resetConfig)();
            console.log(chalk_1.default.green('✓ 配置已重置为默认值'));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    // 适配器管理
    configCmd
        .command('enable <adapter>')
        .description('启用指定的适配器')
        .action((adapter) => {
        try {
            (0, config_1.addEnabledAdapter)(adapter);
            console.log(chalk_1.default.green(`✓ 已启用适配器: ${adapter}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    configCmd
        .command('disable <adapter>')
        .description('禁用指定的适配器')
        .action((adapter) => {
        try {
            (0, config_1.removeEnabledAdapter)(adapter);
            console.log(chalk_1.default.green(`✓ 已禁用适配器: ${adapter}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    // 任务类型映射
    configCmd
        .command('map <taskType> <modelName>')
        .description('设置任务类型到模型的映射')
        .action((taskType, modelName) => {
        try {
            (0, config_1.setTaskTypeMapping)(taskType, modelName);
            console.log(chalk_1.default.green(`✓ 已将任务类型 ${taskType} 映射到模型 ${modelName}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    configCmd
        .command('unmap <taskType>')
        .description('移除任务类型映射')
        .action((taskType) => {
        try {
            (0, config_1.removeTaskTypeMapping)(taskType);
            console.log(chalk_1.default.green(`✓ 已移除任务类型 ${taskType} 的映射`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
    // 执行任务
    routerCmd
        .command('exec <prompt>')
        .description('使用路由器执行任务')
        .option('-t, --type <type>', '任务类型', 'general')
        .option('-s, --strategy <strategy>', '路由策略', 'auto')
        .option('-m, --model <model>', '手动指定模型')
        .action(async (prompt, options) => {
        try {
            const taskType = options.type;
            const strategy = options.strategy;
            console.log(chalk_1.default.cyan('正在执行任务...\n'));
            const result = await (0, modelRouter_1.executeTask)(prompt, {
                type: taskType,
                description: prompt,
            }, {
                strategy: options.model ? modelRouter_1.RoutingStrategy.MANUAL : strategy,
                manualModelName: options.model,
            }, (chunk) => {
                process.stdout.write(chunk);
            });
            if (result.success) {
                console.log(chalk_1.default.green(`\n\n✓ 任务执行成功`));
                console.log(chalk_1.default.gray(`执行时间: ${result.executionTime}ms`));
            }
            else {
                console.error(chalk_1.default.red(`\n✗ 任务执行失败: ${result.error}`));
                process.exit(1);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            process.exit(1);
        }
    });
}
/**
 * 打印模型统计信息
 */
function printModelStats(stats) {
    const successRate = stats.totalRequests > 0
        ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
        : '0.0';
    console.log(chalk_1.default.bold(stats.modelName));
    console.log(`  总请求数: ${stats.totalRequests}`);
    console.log(`  成功: ${chalk_1.default.green(stats.successCount)} | 失败: ${chalk_1.default.red(stats.failureCount)}`);
    console.log(`  成功率: ${successRate}%`);
    console.log(`  平均响应时间: ${stats.avgResponseTime.toFixed(0)}ms`);
    console.log(`  总 tokens: ${stats.totalTokens}`);
    console.log(`  最后使用: ${stats.lastUsed.toLocaleString()}`);
    console.log();
}
//# sourceMappingURL=routerCommands.js.map