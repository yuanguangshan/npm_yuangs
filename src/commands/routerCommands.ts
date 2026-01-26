import chalk from 'chalk';
import { Command } from 'commander';
import {
  getRouter,
  executeTask,
  getStats,
  TaskType,
  RoutingStrategy,
  ModelStats,
} from '../core/modelRouter';
import {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigPath,
  addEnabledAdapter,
  removeEnabledAdapter,
  setTaskTypeMapping,
  removeTaskTypeMapping,
} from '../core/modelRouter/config';

/**
 * 注册路由器命令
 */
export function registerRouterCommands(program: Command): void {
  const routerCmd = program
    .command('router')
    .description('管理多模型路由系统');

  // 列出所有已注册的适配器
  routerCmd
    .command('list')
    .description('列出所有已注册的模型适配器')
    .action(async () => {
      try {
        const router = getRouter();
        const adapters = router.getAdapters();

        if (adapters.length === 0) {
          console.log(chalk.yellow('没有已注册的模型适配器'));
          return;
        }

        console.log(chalk.bold.cyan('\n🤖 已注册的模型适配器\n'));

        for (const adapter of adapters) {
          const available = await adapter.isAvailable();
          const statusIcon = available ? chalk.green('✓') : chalk.red('✗');
          const statusText = available ? chalk.green('可用') : chalk.red('不可用');

          console.log(`${statusIcon} ${chalk.bold(adapter.name)} (${adapter.provider})`);
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
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  // 查看统计信息
  routerCmd
    .command('stats [model]')
    .description('查看模型使用统计信息')
    .action((model) => {
      try {
        const router = getRouter();
        const stats = router.getStats(model) as ModelStats | ModelStats[];

        if (Array.isArray(stats)) {
          if (stats.length === 0) {
            console.log(chalk.yellow('暂无统计数据'));
            return;
          }

          console.log(chalk.bold.cyan('\n📊 模型使用统计\n'));

          for (const stat of stats) {
            printModelStats(stat);
          }
        } else {
          console.log(chalk.bold.cyan(`\n📊 ${stats.modelName} 使用统计\n`));
          printModelStats(stats);
        }
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
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
        const router = getRouter();
        const adapters = router.getAdapters();
        const adapter = adapters.find((a) => a.name === adapterName);

        if (!adapter) {
          console.error(chalk.red(`找不到适配器: ${adapterName}`));
          process.exit(1);
        }

        console.log(chalk.cyan(`正在测试 ${adapter.name}...\n`));

        const available = await adapter.healthCheck();
        if (!available) {
          console.error(chalk.red(`✗ ${adapter.name} 健康检查失败，模型不可用`));
          process.exit(1);
        }

        console.log(chalk.green(`✓ ${adapter.name} 健康检查通过\n`));

        const result = await router.executeTask(
          adapter,
          options.prompt,
          {
            type: TaskType.CONVERSATION,
            description: '测试请求',
          }
        );

        if (result.success) {
          console.log(chalk.green(`\n✓ 测试成功\n`));
          console.log(chalk.bold('响应内容:'));
          console.log(result.content);
          console.log(chalk.gray(`\n执行时间: ${result.executionTime}ms`));
        } else {
          console.error(chalk.red(`\n✗ 测试失败: ${result.error}`));
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
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
        const config = loadConfig();
        console.log(chalk.bold.cyan('\n⚙️  当前配置\n'));
        console.log(JSON.stringify(config, null, 2));
        console.log(chalk.gray(`\n配置文件位置: ${getConfigPath()}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  configCmd
    .command('set <key> <value>')
    .description('设置配置项')
    .action((key, value) => {
      try {
        const config = loadConfig();
        let parsedValue: any = value;

        // 尝试解析 JSON 值
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // 保持原始字符串值
        }

        (config as any)[key] = parsedValue;
        saveConfig(config);
        console.log(chalk.green(`✓ 已设置 ${key} = ${JSON.stringify(parsedValue)}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  configCmd
    .command('reset')
    .description('重置配置为默认值')
    .action(() => {
      try {
        resetConfig();
        console.log(chalk.green('✓ 配置已重置为默认值'));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  // 适配器管理
  configCmd
    .command('enable <adapter>')
    .description('启用指定的适配器')
    .action((adapter) => {
      try {
        addEnabledAdapter(adapter);
        console.log(chalk.green(`✓ 已启用适配器: ${adapter}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  configCmd
    .command('disable <adapter>')
    .description('禁用指定的适配器')
    .action((adapter) => {
      try {
        removeEnabledAdapter(adapter);
        console.log(chalk.green(`✓ 已禁用适配器: ${adapter}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  // 任务类型映射
  configCmd
    .command('map <taskType> <modelName>')
    .description('设置任务类型到模型的映射')
    .action((taskType, modelName) => {
      try {
        setTaskTypeMapping(taskType, modelName);
        console.log(chalk.green(`✓ 已将任务类型 ${taskType} 映射到模型 ${modelName}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  configCmd
    .command('unmap <taskType>')
    .description('移除任务类型映射')
    .action((taskType) => {
      try {
        removeTaskTypeMapping(taskType);
        console.log(chalk.green(`✓ 已移除任务类型 ${taskType} 的映射`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
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
        const taskType = options.type as TaskType;
        const strategy = options.strategy as RoutingStrategy;

        console.log(chalk.cyan('正在执行任务...\n'));

        const result = await executeTask(
          prompt,
          {
            type: taskType,
            description: prompt,
          },
          {
            strategy: options.model ? RoutingStrategy.MANUAL : strategy,
            manualModelName: options.model,
          },
          (chunk) => {
            process.stdout.write(chunk);
          }
        );

        if (result.success) {
          console.log(chalk.green(`\n\n✓ 任务执行成功`));
          console.log(chalk.gray(`执行时间: ${result.executionTime}ms`));
        } else {
          console.error(chalk.red(`\n✗ 任务执行失败: ${result.error}`));
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });
}

/**
 * 打印模型统计信息
 */
function printModelStats(stats: ModelStats): void {
  const successRate =
    stats.totalRequests > 0
      ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
      : '0.0';

  console.log(chalk.bold(stats.modelName));
  console.log(`  总请求数: ${stats.totalRequests}`);
  console.log(`  成功: ${chalk.green(stats.successCount)} | 失败: ${chalk.red(stats.failureCount)}`);
  console.log(`  成功率: ${successRate}%`);
  console.log(`  平均响应时间: ${stats.avgResponseTime.toFixed(0)}ms`);
  console.log(`  总 tokens: ${stats.totalTokens}`);
  console.log(`  最后使用: ${stats.lastUsed.toLocaleString()}`);
  console.log();
}
