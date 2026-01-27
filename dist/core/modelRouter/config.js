"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.resetConfig = resetConfig;
exports.getConfigPath = getConfigPath;
exports.updateConfigItem = updateConfigItem;
exports.addEnabledAdapter = addEnabledAdapter;
exports.removeEnabledAdapter = removeEnabledAdapter;
exports.setTaskTypeMapping = setTaskTypeMapping;
exports.removeTaskTypeMapping = removeTaskTypeMapping;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const types_1 = require("./types");
const DEFAULT_CONFIG = {
    defaultStrategy: types_1.RoutingStrategy.AUTO,
    maxResponseTime: 30000,
    maxCostLevel: 5,
    enableFallback: true,
    enabledAdapters: ['google-gemini', 'qwen', 'codebuddy'],
    taskTypeMapping: {},
    adapterConfigs: {},
    exploration: {
        strategy: 'none',
        epsilon: 0.1
    }
};
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs-router.json');
/**
 * 加载配置
 */
function loadConfig() {
    try {
        if (fs_1.default.existsSync(CONFIG_FILE)) {
            const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(content);
            return { ...DEFAULT_CONFIG, ...config };
        }
    }
    catch (error) {
        console.warn('加载路由配置失败，使用默认配置:', error);
    }
    return DEFAULT_CONFIG;
}
/**
 * 保存配置
 */
function saveConfig(config) {
    try {
        const currentConfig = loadConfig();
        const newConfig = { ...currentConfig, ...config };
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
    }
    catch (error) {
        throw new Error(`保存路由配置失败: ${error}`);
    }
}
/**
 * 重置配置为默认值
 */
function resetConfig() {
    try {
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    }
    catch (error) {
        throw new Error(`重置路由配置失败: ${error}`);
    }
}
/**
 * 获取配置文件路径
 */
function getConfigPath() {
    return CONFIG_FILE;
}
/**
 * 更新单个配置项
 */
function updateConfigItem(key, value) {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
}
/**
 * 添加启用的适配器
 */
function addEnabledAdapter(adapterName) {
    const config = loadConfig();
    if (!config.enabledAdapters.includes(adapterName)) {
        config.enabledAdapters.push(adapterName);
        saveConfig(config);
    }
}
/**
 * 移除启用的适配器
 */
function removeEnabledAdapter(adapterName) {
    const config = loadConfig();
    config.enabledAdapters = config.enabledAdapters.filter((name) => name !== adapterName);
    saveConfig(config);
}
/**
 * 设置任务类型映射
 */
function setTaskTypeMapping(taskType, modelName) {
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
function removeTaskTypeMapping(taskType) {
    const config = loadConfig();
    if (config.taskTypeMapping) {
        delete config.taskTypeMapping[taskType];
        saveConfig(config);
    }
}
//# sourceMappingURL=config.js.map