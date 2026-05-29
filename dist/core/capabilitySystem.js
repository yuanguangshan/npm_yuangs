"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilitySystem = exports.CapabilitySystem = void 0;
const ConfigService_1 = require("./ConfigService");
const modelMatcher_1 = require("./modelMatcher");
const executionRecord_1 = require("./executionRecord");
const executionStore_1 = require("./executionStore");
const replayEngine_1 = require("./replayEngine");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class CapabilitySystem {
    primaryModels = [];
    fallbackModels = [];
    constructor() {
        this.initializeDefaultModels();
    }
    initializeDefaultModels() {
        // 初始化为空数组，让配置文件成为主要来源
        this.primaryModels = [];
        this.fallbackModels = [];
    }
    matchCapability(requirement) {
        const allModels = this.getAllModels();
        const primaryModels = [...this.primaryModels, ...this.loadCustomModels()];
        return (0, modelMatcher_1.matchModelWithFallback)(primaryModels, this.fallbackModels, requirement);
    }
    loadCustomModels() {
        const userGlobalPath = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
        const projectPath = (0, ConfigService_1.getConfigService)().get('projectConfigPath');
        const customModelsArray = [];
        // Try loading from user config
        try {
            if (fs_1.default.existsSync(userGlobalPath)) {
                const userConfig = JSON.parse(fs_1.default.readFileSync(userGlobalPath, 'utf8'));
                if (userConfig?.models && Array.isArray(userConfig.models)) {
                    customModelsArray.push(...userConfig.models);
                }
            }
        }
        catch { /* ignore */ }
        // Try loading from project config
        if (projectPath) {
            try {
                const projectConfig = JSON.parse(fs_1.default.readFileSync(projectPath, 'utf8'));
                if (projectConfig?.models && Array.isArray(projectConfig.models)) {
                    customModelsArray.push(...projectConfig.models);
                }
            }
            catch { /* ignore */ }
        }
        return customModelsArray;
    }
    getAllModels() {
        const customModels = this.loadCustomModels();
        return [...this.primaryModels, ...this.fallbackModels, ...customModels];
    }
    createAndSaveExecutionRecord(commandName, requirement, matchResult, command, rawInput, mode) {
        const config = (0, ConfigService_1.getConfigService)().getAll();
        const record = (0, executionRecord_1.createExecutionRecord)(commandName, requirement, config, matchResult, { success: matchResult.selected !== null }, command, rawInput, mode);
        const filePath = (0, executionStore_1.saveExecutionRecord)(record);
        return record.id;
    }
    replayExecution(recordId, options) {
        return replayEngine_1.replayEngine.replay(recordId, options);
    }
    explainConfig() {
        return (0, ConfigService_1.getConfigService)().dumpConfigSnapshot();
    }
}
exports.CapabilitySystem = CapabilitySystem;
exports.capabilitySystem = new CapabilitySystem();
//# sourceMappingURL=capabilitySystem.js.map