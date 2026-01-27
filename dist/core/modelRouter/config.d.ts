import { RoutingStrategy, ExplorationStrategy } from './types';
/**
 * 模型路由配置文件
 */
export interface ModelRouterConfig {
    /** 默认路由策略 */
    defaultStrategy: RoutingStrategy;
    /** 最大响应时间（毫秒） */
    maxResponseTime?: number;
    /** 最大成本等级 */
    maxCostLevel?: number;
    /** 是否启用后备模型 */
    enableFallback: boolean;
    /** 启用的适配器列表 */
    enabledAdapters: string[];
    /** 任务类型到模型的映射（可选） */
    taskTypeMapping?: Record<string, string>;
    /** 适配器配置 */
    adapterConfigs?: Record<string, any>;
    /** 探索配置 */
    exploration?: {
        strategy: ExplorationStrategy | string;
        epsilon?: number;
    };
}
/**
 * 加载配置
 */
export declare function loadConfig(): ModelRouterConfig;
/**
 * 保存配置
 */
export declare function saveConfig(config: Partial<ModelRouterConfig>): void;
/**
 * 重置配置为默认值
 */
export declare function resetConfig(): void;
/**
 * 获取配置文件路径
 */
export declare function getConfigPath(): string;
/**
 * 更新单个配置项
 */
export declare function updateConfigItem(key: keyof ModelRouterConfig, value: any): void;
/**
 * 添加启用的适配器
 */
export declare function addEnabledAdapter(adapterName: string): void;
/**
 * 移除启用的适配器
 */
export declare function removeEnabledAdapter(adapterName: string): void;
/**
 * 设置任务类型映射
 */
export declare function setTaskTypeMapping(taskType: string, modelName: string): void;
/**
 * 移除任务类型映射
 */
export declare function removeTaskTypeMapping(taskType: string): void;
