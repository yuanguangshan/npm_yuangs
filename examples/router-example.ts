#!/usr/bin/env ts-node
/**
 * 多模型路由系统使用示例
 * 
 * 这个示例展示了如何使用模型路由系统来执行不同类型的任务
 */

import {
  executeTask,
  getRouter,
  getStats,
  TaskType,
  RoutingStrategy,
  Priority,
} from '../src/core/modelRouter';

async function main() {
  console.log('🚀 多模型路由系统示例\n');

  // ============================================
  // 示例 1: 自动路由 - 代码生成
  // ============================================
  console.log('示例 1: 自动路由 - 代码生成');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const result1 = await executeTask(
      '写一个 TypeScript 函数来计算斐波那契数列',
      {
        type: TaskType.CODE_GENERATION,
        description: '生成斐波那契函数',
        priority: Priority.MEDIUM,
      },
      {
        strategy: RoutingStrategy.AUTO,
      }
    );

    if (result1.success) {
      console.log('✓ 执行成功');
      console.log('模型:', result1.modelName);
      console.log('执行时间:', result1.executionTime, 'ms');
      console.log('结果:');
      console.log(result1.content);
    }
  } catch (error: any) {
    console.error('✗ 执行失败:', error.message);
  }

  console.log('\n');

  // ============================================
  // 示例 2: 指定策略 - 最快响应
  // ============================================
  console.log('示例 2: 最快响应策略 - 翻译');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const result2 = await executeTask(
      '将以下内容翻译成英文：你好，世界！',
      {
        type: TaskType.TRANSLATION,
        description: '中译英',
      },
      {
        strategy: RoutingStrategy.FASTEST_FIRST,
      }
    );

    if (result2.success) {
      console.log('✓ 执行成功');
      console.log('模型:', result2.modelName);
      console.log('执行时间:', result2.executionTime, 'ms');
      console.log('结果:', result2.content);
    }
  } catch (error: any) {
    console.error('✗ 执行失败:', error.message);
  }

  console.log('\n');

  // ============================================
  // 示例 3: 手动指定模型 - 代码审查
  // ============================================
  console.log('示例 3: 手动指定模型 - 代码审查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const codeToReview = `
function add(a, b) {
  return a + b;
}
  `;

  try {
    const result3 = await executeTask(
      `审查以下代码并提供改进建议:\n${codeToReview}`,
      {
        type: TaskType.CODE_REVIEW,
        description: '代码审查',
      },
      {
        strategy: RoutingStrategy.MANUAL,
        manualModelName: 'codebuddy',
      }
    );

    if (result3.success) {
      console.log('✓ 执行成功');
      console.log('模型:', result3.modelName);
      console.log('执行时间:', result3.executionTime, 'ms');
      console.log('审查结果:');
      console.log(result3.content);
    }
  } catch (error: any) {
    console.error('✗ 执行失败:', error.message);
    console.log('提示: 确保 codebuddy CLI 已安装并配置');
  }

  console.log('\n');

  // ============================================
  // 示例 4: 流式输出 - 对话
  // ============================================
  console.log('示例 4: 流式输出 - 对话');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('AI 回复: ');
    const result4 = await executeTask(
      '请用一段话介绍什么是递归',
      {
        type: TaskType.CONVERSATION,
        description: '对话',
      },
      {
        strategy: RoutingStrategy.AUTO,
      },
      (chunk) => {
        // 流式输出每个接收到的块
        process.stdout.write(chunk);
      }
    );

    if (result4.success) {
      console.log('\n\n✓ 执行成功');
      console.log('模型:', result4.modelName);
      console.log('执行时间:', result4.executionTime, 'ms');
    }
  } catch (error: any) {
    console.error('✗ 执行失败:', error.message);
  }

  console.log('\n');

  // ============================================
  // 示例 5: 查看统计信息
  // ============================================
  console.log('示例 5: 查看使用统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const stats = getStats();
  if (Array.isArray(stats) && stats.length > 0) {
    console.log('📊 模型使用统计:\n');
    stats.forEach((stat) => {
      const successRate =
        stat.totalRequests > 0
          ? ((stat.successCount / stat.totalRequests) * 100).toFixed(1)
          : '0.0';

      console.log(`${stat.modelName}:`);
      console.log(`  总请求: ${stat.totalRequests}`);
      console.log(`  成功率: ${successRate}%`);
      console.log(`  平均响应时间: ${stat.avgResponseTime.toFixed(0)}ms`);
      console.log(`  最后使用: ${stat.lastUsed.toLocaleString()}`);
      console.log();
    });
  } else {
    console.log('暂无统计数据');
  }

  // ============================================
  // 示例 6: 获取可用的适配器
  // ============================================
  console.log('示例 6: 检查可用的适配器');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const router = getRouter();
  const adapters = router.getAdapters();

  console.log(`已注册 ${adapters.length} 个适配器:\n`);

  for (const adapter of adapters) {
    const available = await adapter.isAvailable();
    const status = available ? '✓ 可用' : '✗ 不可用';
    console.log(`${status} ${adapter.name} (${adapter.provider})`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('示例执行完毕！');
}

// 运行示例
main().catch((error) => {
  console.error('示例执行出错:', error);
  process.exit(1);
});
