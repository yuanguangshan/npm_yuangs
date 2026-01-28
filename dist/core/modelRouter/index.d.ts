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
export { GoogleAdapter } from './adapters/GoogleAdapter';
export { QwenAdapter } from './adapters/QwenAdapter';
export { CodebuddyAdapter } from './adapters/CodebuddyAdapter';
export { YuangsAdapter } from './adapters/YuangsAdapter';
import { AIRequestMessage } from '../../core/validation';
import { ModelRouter } from './ModelRouter';
import { TaskConfig, RoutingConfig, ModelExecutionResult } from './types';
/**
 * 创建并初始化一个模型路由器
 */
export declare function createRouter(): ModelRouter;
/**
 * 获取全局路由器实例（单例）
 */
export declare function getRouter(): ModelRouter;
/**
 * 重置全局路由器
 */
export declare function resetRouter(): void;
/**
 * 快捷函数：执行任务
 */
export declare function executeTask(prompt: string | AIRequestMessage[], taskConfig: TaskConfig, routingConfig?: Partial<RoutingConfig>, onChunk?: (chunk: string) => void): Promise<ModelExecutionResult>;
/**
 * 快捷函数：获取所有适配器的统计信息
 */
export declare function getStats(): import("./types").ModelStats | import("./types").ModelStats[];
