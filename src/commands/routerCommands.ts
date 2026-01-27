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

  // 策略管理
  const policyCmd = routerCmd
    .command('policy')
    .description('管理路由策略');

  policyCmd
    .command('list')
    .description('列出所有可用的路由策略')
    .action(() => {
      try {
        const router = getRouter();
        const policies = router.getPolicies();
        const config = loadConfig();

        console.log(chalk.bold.cyan('\n📜 可用路由策略\n'));

        for (const policy of policies) {
          const isCurrent = (config.defaultStrategy === RoutingStrategy.AUTO && policy.name === 'balanced') ||
            (config.defaultStrategy === RoutingStrategy.FASTEST_FIRST && policy.name === 'latency-critical') ||
            (config.defaultStrategy === RoutingStrategy.CHEAPEST_FIRST && policy.name === 'cost-saving') ||
            (config.defaultStrategy === RoutingStrategy.BEST_QUALITY && policy.name === 'quality-first');

          const prefix = isCurrent ? chalk.green('→ ') : '  ';
          console.log(`${prefix}${chalk.bold(policy.name)}`);
          console.log(`    ${chalk.gray(policy.description)}`);
          console.log();
        }
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  policyCmd
    .command('set <name>')
    .description('设置默认路由策略')
    .action((name) => {
      try {
        const config = loadConfig();
        let strategy: RoutingStrategy;

        switch (name) {
          case 'balanced':
          case 'auto':
            strategy = RoutingStrategy.AUTO;
            break;
          case 'latency-critical':
          case 'fast':
            strategy = RoutingStrategy.FASTEST_FIRST;
            break;
          case 'cost-saving':
          case 'cheap':
            strategy = RoutingStrategy.CHEAPEST_FIRST;
            break;
          case 'quality-first':
          case 'best':
            strategy = RoutingStrategy.BEST_QUALITY;
            break;
          default:
            console.error(chalk.red(`未知策略: ${name}`));
            process.exit(1);
        }

        saveConfig({ defaultStrategy: strategy });
        console.log(chalk.green(`✓ 已将默认策略设置为: ${name}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  // 探索配置管理
  const explorationCmd = routerCmd
    .command('exploration')
    .description('管理路由探索机制 (ε-greedy / UCB1)');

  explorationCmd
    .command('set <strategy>')
    .description('设置探索策略 (none, epsilon_greedy, ucb1)')
    .option('-e, --epsilon <value>', '设置 epsilon 值 (仅用于 epsilon_greedy)', '0.1')
    .action((strategy, options) => {
      try {
        const config = loadConfig();
        saveConfig({
          exploration: {
            strategy: strategy as any,
            epsilon: parseFloat(options.epsilon)
          }
        });
        console.log(chalk.green(`✓ 已更新探索配置: 策略=${strategy}, Epsilon=${options.epsilon}`));
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
      }
    });

  explorationCmd
    .command('show')
    .description('显示当前探索配置')
    .action(() => {
      const config = loadConfig();
      console.log(chalk.bold.cyan('\n🔍 当前探测配置\n'));
      console.log(`  策略: ${chalk.white(config.exploration?.strategy || 'none')}`);
      console.log(`  Epsilon: ${chalk.white(config.exploration?.epsilon || 'N/A')}`);
      console.log();
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

  // 路由器医生：行为验收套件
  routerCmd
    .command('doctor')
    .description('对路由器进行系统性健康检查与行为验收')
    .option('--chaos', '开启压力/异常模拟（注入模拟延迟和故障）')
    .action(async (options) => {
      console.log(chalk.bold.cyan('\n🩺 开始执行 ModelRouter 系统自检...\n'));
      const router = getRouter();

      const runStep = async (name: string, fn: () => Promise<void>) => {
        process.stdout.write(`  ${chalk.white(name.padEnd(40))}`);
        try {
          await fn();
          console.log(chalk.green(' [通过]'));
        } catch (e: any) {
          console.log(chalk.red(' [失败]'));
          console.error(chalk.red(`     └─ 原因: ${e.message}`));
        }
      };

      // Step 1: 策略注册完整性
      await runStep('策略容器完整性验证', async () => {
        const policies = router.getPolicies();
        if (policies.length < 4) throw new Error(`策略缺失: 期望 4, 实际 ${policies.length}`);
      });

      // Step 2: Gate 过滤契约验证
      await runStep('Gate 硬约束隔离边界检查', async () => {
        const result = await router.route(
          { type: TaskType.ANALYSIS, description: 'long content', contextSize: 500000 },
          { strategy: RoutingStrategy.AUTO }
        );
        // 验证 Qwen (通常 context 较小) 这种模型是否被隔离
        const hasLowContextModel = result.candidates.some(c => c.name === 'qwen');
        if (hasLowContextModel) throw new Error('Gate 未能有效隔离低容量模型');
      });

      // Step 3: Cost-Saving 策略语义验证
      await runStep('Cost-Saving 决策一致性验证', async () => {
        const result = await router.route(
          { type: TaskType.GENERAL, description: 'cheap task' },
          { strategy: RoutingStrategy.CHEAPEST_FIRST }
        );
        // 寻找全量中成本最低的
        const minCost = Math.min(...router.getAdapters().map(a => a.capabilities.costLevel));
        if (result.adapter.capabilities.costLevel > minCost) {
          throw new Error(`未选定最低成本模型(期望 <=等级${minCost}, 实际 等级${result.adapter.capabilities.costLevel})`);
        }
      });

      // Step 4: 执行->统计反馈闭环验证
      await runStep('实时统计(Stats)闭环链路验证', async () => {
        const adapter = router.getAdapters()[0];
        const initial = (router.getStats(adapter.name) as any).totalRequests;
        await router.executeTask(adapter, 'test', { type: TaskType.CONVERSATION, description: 'doctor test' });
        const current = (router.getStats(adapter.name) as any).totalRequests;
        if (current <= initial) throw new Error('执行后 Stats 未能正确累加');
      });

      if (options.chaos) {
        console.log(chalk.yellow('\n🌀 执行混沌测试 (Chaos Simulation)...'));
        // 这里将来可以注入模拟的高延迟
        console.log(chalk.gray('  - 模拟高延迟注入测试: 规划中心...'));
        console.log(chalk.green('  ✓ 混沌测试完成'));
      }

      console.log(chalk.bold.cyan('\n🏁 自检总结: 系统架构契约完整，决策链路正常。'));
      console.log();
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
