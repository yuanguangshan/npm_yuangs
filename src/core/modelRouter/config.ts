import fs from 'fs';
import path from 'path';
import os from 'os';
import { RoutingStrategy } from './types';

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
}

const DEFAULT_CONFIG: ModelRouterConfig = {
  defaultStrategy: RoutingStrategy.AUTO,
  maxResponseTime: 30000,
  maxCostLevel: 5,
  enableFallback: true,
  enabledAdapters: ['google-gemini', 'qwen', 'codebuddy'],
  taskTypeMapping: {},
  adapterConfigs: {},
};

const CONFIG_FILE = path.join(os.homedir(), '.yuangs-router.json');

/**
 * 加载配置
 */
export function loadConfig(): ModelRouterConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(content);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.warn('加载路由配置失败，使用默认配置:', error);
  }
  return DEFAULT_CONFIG;
}

/**
 * 保存配置
 */
export function saveConfig(config: Partial<ModelRouterConfig>): void {
  try {
    const currentConfig = loadConfig();
    const newConfig = { ...currentConfig, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`保存路由配置失败: ${error}`);
  }
}

/**
 * 重置配置为默认值
 */
export function resetConfig(): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`重置路由配置失败: ${error}`);
  }
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * 更新单个配置项
 */
export function updateConfigItem(key: keyof ModelRouterConfig, value: any): void {
  const config = loadConfig();
  (config as any)[key] = value;
  saveConfig(config);
}

/**
 * 添加启用的适配器
 */
export function addEnabledAdapter(adapterName: string): void {
  const config = loadConfig();
  if (!config.enabledAdapters.includes(adapterName)) {
    config.enabledAdapters.push(adapterName);
    saveConfig(config);
  }
}

/**
 * 移除启用的适配器
 */
export function removeEnabledAdapter(adapterName: string): void {
  const config = loadConfig();
  config.enabledAdapters = config.enabledAdapters.filter((name) => name !== adapterName);
  saveConfig(config);
}

/**
 * 设置任务类型映射
 */
export function setTaskTypeMapping(taskType: string, modelName: string): void {
  const config = loadConfig();
  if (!config.taskTypeMapping) {
    config.taskTypeMapping = {};
  }
  config.taskTypeMapping[taskType] = modelName;
  saveConfig(config);
}

/**
 * 移除任务类型映射
 */
export function removeTaskTypeMapping(taskType: string): void {
  const config = loadConfig();
  if (config.taskTypeMapping) {
    delete config.taskTypeMapping[taskType];
    saveConfig(config);
  }
}
