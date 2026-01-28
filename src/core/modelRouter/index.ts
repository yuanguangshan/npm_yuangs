/**
 * 模型路由系统
 * 
 * 这个模块提供了一个统一的接口来整合多个 AI CLI 工具，
 * 根据任务特性智能路由到最合适的模型执行。
 * 
 * 主要特性：
 * 1. 支持多种路由策略（自动、轮询、最快优先等）
 * 2. 可扩展的适配器系统
 * 3. 任务执行统计和监控
 * 4. 灵活的配置管理
 * 
 * @example
 * ```typescript
 * import { createRouter, TaskType, RoutingStrategy } from './modelRouter';
 * 
 * const router = createRouter();
 * 
 * const result = await router.executeTask({
 *   type: TaskType.CODE_GENERATION,
 *   description: '生成一个快速排序函数',
 * }, {
 *   strategy: RoutingStrategy.AUTO,
 * });
 * 
 * console.log(result.content);
 * ```
 */

export * from './types';
export * from './BaseAdapter';
export * from './ModelRouter';
export * from './config';
export * from './ContextManager';

// 导出适配器
export { GoogleAdapter } from './adapters/GoogleAdapter';
export { QwenAdapter } from './adapters/QwenAdapter';
export { CodebuddyAdapter } from './adapters/CodebuddyAdapter';
export { YuangsAdapter } from './adapters/YuangsAdapter';

import { AIRequestMessage } from '../../core/validation';
import chalk from 'chalk';
import { ModelRouter } from './ModelRouter';
import { GoogleAdapter } from './adapters/GoogleAdapter';
import { QwenAdapter } from './adapters/QwenAdapter';
import { CodebuddyAdapter } from './adapters/CodebuddyAdapter';
import { YuangsAdapter } from './adapters/YuangsAdapter';
import { loadConfig } from './config';
import {
  TaskConfig,
  RoutingConfig,
  RoutingStrategy,
  ModelExecutionResult,
} from './types';

let globalRouter: ModelRouter | null = null;

/**
 * 创建并初始化一个模型路由器
 */
export function createRouter(): ModelRouter {
  const router = new ModelRouter();
  const config = loadConfig();

  // 注册启用的适配器
  if (config.enabledAdapters.includes('google-gemini')) {
    router.registerAdapter(new GoogleAdapter());
  }

  if (config.enabledAdapters.includes('qwen')) {
    router.registerAdapter(new QwenAdapter());
  }

  if (config.enabledAdapters.includes('codebuddy')) {
    router.registerAdapter(new CodebuddyAdapter());
  }

  // 始终注册内置的 yuangs 适配器 (提供 Assistant 模型)
  router.registerAdapter(new YuangsAdapter());

  return router;
}

/**
 * 获取全局路由器实例（单例）
 */
export function getRouter(): ModelRouter {
  if (!globalRouter) {
    globalRouter = createRouter();
  }
  return globalRouter;
}

/**
 * 重置全局路由器
 */
export function resetRouter(): void {
  globalRouter = null;
}

/**
 * 快捷函数：执行任务
 */
export async function executeTask(
  prompt: string | AIRequestMessage[],
  taskConfig: TaskConfig,
  routingConfig?: Partial<RoutingConfig>,
  onChunk?: (chunk: string) => void
): Promise<ModelExecutionResult> {
  const router = getRouter();
  const config = loadConfig();

  // 合并配置
  const finalRoutingConfig: RoutingConfig = {
    strategy: config.defaultStrategy,
    maxResponseTime: config.maxResponseTime,
    maxCostLevel: config.maxCostLevel,
    enableFallback: config.enableFallback,
    ...routingConfig,
  };

  // 检查是否有任务类型映射 (仅当调用方未手动指定策略时应用)
  if (!routingConfig?.strategy && config.taskTypeMapping && config.taskTypeMapping[taskConfig.type]) {
    finalRoutingConfig.strategy = RoutingStrategy.MANUAL;
    finalRoutingConfig.manualModelName = config.taskTypeMapping[taskConfig.type];
  }

  // 路由到合适的模型
  const routingResult = await router.route(taskConfig, finalRoutingConfig);
  
  if (routingResult.isFallback) {
    console.log(chalk.yellow(`⚠️ [Router] 回退到备选模型: ${routingResult.adapter.name}`));
  } else {
    console.log(chalk.cyan(`🤖 [Router] 智能路由 -> `) + chalk.bold.green(routingResult.adapter.name));
  }
  console.log(chalk.gray(`📋 选择理由: ${routingResult.reason}\n`));

  // 执行任务
  return router.executeTask(routingResult.adapter, prompt, taskConfig, onChunk);
}

/**
 * 快捷函数：获取所有适配器的统计信息
 */
export function getStats() {
  const router = getRouter();
  return router.getStats();
}
