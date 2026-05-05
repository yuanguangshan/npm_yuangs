import { getConfigService } from './ConfigService';
import {
  CapabilityRequirement,
  matchModelWithFallback,
  ModelCapabilities,
  CapabilityMatchResult,
} from './modelMatcher';
import {
  createExecutionRecord,
} from './executionRecord';
import {
  saveExecutionRecord,
} from './executionStore';
import { replayEngine, ReplayOptions, ReplayResult } from './replayEngine';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

  loadCustomModels(): ModelCapabilities[] {
    const userGlobalPath = path.join(os.homedir(), '.yuangs.json');
    const projectPath = getConfigService().get('projectConfigPath') as string | null;

    const customModelsArray = [];

    // Try loading from user config
    try {
      if (fs.existsSync(userGlobalPath)) {
        const userConfig = JSON.parse(fs.readFileSync(userGlobalPath, 'utf8'));
        if (userConfig?.models && Array.isArray(userConfig.models)) {
          customModelsArray.push(...userConfig.models as ModelCapabilities[]);
        }
      }
    } catch { /* ignore */ }

    // Try loading from project config
    if (projectPath) {
      try {
        const projectConfig = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
        if (projectConfig?.models && Array.isArray(projectConfig.models)) {
          customModelsArray.push(...projectConfig.models as ModelCapabilities[]);
        }
      } catch { /* ignore */ }
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
    command?: string,
    rawInput?: string,
    mode?: string
  ): string {
    const config = getConfigService().getAll();
    const record = createExecutionRecord(
      commandName,
      requirement,
      config,
      matchResult,
      { success: matchResult.selected !== null },
      command,
      rawInput,
      mode
    );

    const filePath = saveExecutionRecord(record);
    return record.id;
  }

  replayExecution(recordId: string, options: ReplayOptions): Promise<ReplayResult> {
    return replayEngine.replay(recordId, options);
  }

  explainConfig(): string {
    return getConfigService().dumpConfigSnapshot();
  }
}

export const capabilitySystem = new CapabilitySystem();
