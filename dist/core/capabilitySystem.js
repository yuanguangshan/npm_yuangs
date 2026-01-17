"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilitySystem = exports.CapabilitySystem = void 0;
const modelMatcher_1 = require("./modelMatcher");
const configMerge_1 = require("./configMerge");
const executionRecord_1 = require("./executionRecord");
const executionStore_1 = require("./executionStore");
const replayEngine_1 = require("./replayEngine");
class CapabilitySystem {
    primaryModels = [];
    fallbackModels = [];
    constructor() {
        this.initializeDefaultModels();
    }
    initializeDefaultModels() {
        this.primaryModels = [
            {
                name: 'gemini-3-flash-preview',
                provider: 'google',
                atomicCapabilities: [
                    require('./capabilities').AtomicCapability.TEXT_GENERATION,
                    require('./capabilities').AtomicCapability.CODE_GENERATION,
                    require('./capabilities').AtomicCapability.REASONING,
                    require('./capabilities').AtomicCapability.LONG_CONTEXT,
                    require('./capabilities').AtomicCapability.STREAMING,
                ],
                contextWindow: 128000,
                costProfile: 'high',
            },
            {
                name: 'gemini-2.5-flash',
                provider: 'google',
                atomicCapabilities: [
                    require('./capabilities').AtomicCapability.TEXT_GENERATION,
                    require('./capabilities').AtomicCapability.CODE_GENERATION,
                    require('./capabilities').AtomicCapability.REASONING,
                    require('./capabilities').AtomicCapability.STREAMING,
                ],
                contextWindow: 32000,
                costProfile: 'medium',
            },
            {
                name: 'Assistant',
                provider: 'aiproxy',
                atomicCapabilities: [
                    require('./capabilities').AtomicCapability.TEXT_GENERATION,
                    require('./capabilities').AtomicCapability.CODE_GENERATION,
                    require('./capabilities').AtomicCapability.REASONING,
                ],
                contextWindow: 8000,
                costProfile: 'low',
            },
        ];
        this.fallbackModels = [
            {
                name: 'gemini-2.5-flash-lite',
                provider: 'google',
                atomicCapabilities: [
                    require('./capabilities').AtomicCapability.TEXT_GENERATION,
                    require('./capabilities').AtomicCapability.REASONING,
                ],
                contextWindow: 16000,
                costProfile: 'low',
            },
        ];
    }
    matchCapability(requirement) {
        const allModels = this.getAllModels();
        const primaryModels = [...this.primaryModels, ...this.loadCustomModels()];
        return (0, modelMatcher_1.matchModelWithFallback)(primaryModels, this.fallbackModels, requirement);
    }
    loadMergedConfig() {
        const builtin = {
            aiProxyUrl: 'https://aiproxy.want.biz/v1/chat/completions',
            defaultModel: 'Assistant',
            accountType: 'free',
        };
        const filePaths = (0, configMerge_1.getConfigFilePaths)();
        const projectConfig = filePaths.project ? (0, configMerge_1.loadConfigAt)(filePaths.project) : null;
        const userGlobal = (0, configMerge_1.loadConfigAt)(filePaths.userGlobal);
        return (0, configMerge_1.mergeConfigs)(builtin, userGlobal, projectConfig, null);
    }
    loadCustomModels() {
        const filePaths = (0, configMerge_1.getConfigFilePaths)();
        const projectConfig = filePaths.project ? (0, configMerge_1.loadConfigAt)(filePaths.project) : null;
        const userGlobal = (0, configMerge_1.loadConfigAt)(filePaths.userGlobal);
        const customModelsArray = [];
        if (userGlobal?.models && Array.isArray(userGlobal.models)) {
            customModelsArray.push(...userGlobal.models);
        }
        if (projectConfig?.models && Array.isArray(projectConfig.models)) {
            customModelsArray.push(...projectConfig.models);
        }
        return customModelsArray;
    }
    getAllModels() {
        const customModels = this.loadCustomModels();
        return [...this.primaryModels, ...this.fallbackModels, ...customModels];
    }
    createAndSaveExecutionRecord(commandName, requirement, matchResult, command) {
        const config = this.loadMergedConfig();
        const record = (0, executionRecord_1.createExecutionRecord)(commandName, requirement, config, matchResult, { success: matchResult.selected !== null }, command);
        const filePath = (0, executionStore_1.saveExecutionRecord)(record);
        return record.id;
    }
    replayExecution(recordId, options) {
        return replayEngine_1.replayEngine.replay(recordId, options);
    }
    explainConfig() {
        const config = this.loadMergedConfig();
        return (0, configMerge_1.dumpConfigSnapshot)(config);
    }
}
exports.CapabilitySystem = CapabilitySystem;
exports.capabilitySystem = new CapabilitySystem();
//# sourceMappingURL=capabilitySystem.js.map