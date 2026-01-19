import {
  CapabilityRequirement,
  matchModelWithFallback,
  ModelCapabilities,
  CapabilityMatchResult,
} from './modelMatcher';
import {
  mergeConfigs,
  loadConfigAt,
  dumpConfigSnapshot,
  getConfigFilePaths,
  MergedConfig,
} from './configMerge';
import {
  createExecutionRecord,
  ExecutionRecord,
} from './executionRecord';
import {
  saveExecutionRecord,
  loadExecutionRecord,
  listExecutionRecords,
} from './executionStore';
import { replayEngine, ReplayOptions, ReplayResult } from './replayEngine';

export class CapabilitySystem {
  private primaryModels: ModelCapabilities[] = [];
  private fallbackModels: ModelCapabilities[] = [];

  constructor() {
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    // 初始化为空数组，让配置文件成为主要来源
    this.primaryModels = [];
    this.fallbackModels = [];
  }

  matchCapability(requirement: CapabilityRequirement): CapabilityMatchResult {
    const allModels = this.getAllModels();
    const primaryModels = [...this.primaryModels, ...this.loadCustomModels()];
    return matchModelWithFallback(
      primaryModels,
      this.fallbackModels,
      requirement
    );
  }

  loadMergedConfig(): MergedConfig {
    const builtin = {
      aiProxyUrl: 'https://aiproxy.want.biz/v1/chat/completions',
      defaultModel: 'Assistant',
      accountType: 'paid',
    };

    const filePaths = getConfigFilePaths();
    const projectConfig = filePaths.project ? loadConfigAt(filePaths.project) : null;
    const userGlobal = loadConfigAt(filePaths.userGlobal);

    return mergeConfigs(builtin, userGlobal, projectConfig, null);
  }

  loadCustomModels(): ModelCapabilities[] {
    const filePaths = getConfigFilePaths();
    const projectConfig = filePaths.project ? loadConfigAt(filePaths.project) : null;
    const userGlobal = loadConfigAt(filePaths.userGlobal);

    const customModelsArray = [];
    if (userGlobal?.models && Array.isArray(userGlobal.models)) {
      customModelsArray.push(...userGlobal.models as ModelCapabilities[]);
    }
    if (projectConfig?.models && Array.isArray(projectConfig.models)) {
      customModelsArray.push(...projectConfig.models as ModelCapabilities[]);
    }

    return customModelsArray;
  }

  getAllModels(): ModelCapabilities[] {
    const customModels = this.loadCustomModels();
    return [...this.primaryModels, ...this.fallbackModels, ...customModels];
  }

  createAndSaveExecutionRecord(
    commandName: string,
    requirement: CapabilityRequirement,
    matchResult: CapabilityMatchResult,
    command?: string
  ): string {
    const config = this.loadMergedConfig();
    const record = createExecutionRecord(
      commandName,
      requirement,
      config,
      matchResult,
      { success: matchResult.selected !== null },
      command
    );

    const filePath = saveExecutionRecord(record);
    return record.id;
  }

  replayExecution(recordId: string, options: ReplayOptions): Promise<ReplayResult> {
    return replayEngine.replay(recordId, options);
  }

  explainConfig(): string {
    const config = this.loadMergedConfig();
    return dumpConfigSnapshot(config);
  }
}

export const capabilitySystem = new CapabilitySystem();
