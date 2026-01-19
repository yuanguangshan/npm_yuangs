import { MergedConfig } from './configMerge';
import { ModelCapabilities, CapabilityMatchExplanation } from './modelMatcher';
import { CapabilityRequirement } from './modelMatcher';
import { Skill } from '../agent/skills';

export interface ExecutionMeta {
  commandName: string;
  timestamp: string;
  toolVersion: string;
  projectPath: string;
  args?: any;
  rawInput?: string;
  replayable?: boolean;
  version?: string;
}

export interface CapabilityIntent {
  required: string[];
  preferred: string[];
  capabilityVersion: string;
}

export interface ModelDecision {
  candidateModels: CapabilityMatchExplanation[];
  selectedModel: ModelCapabilities | null;
  usedFallback: boolean;
  fallbackReason?: string;
  strategy?: string;
  reason?: string;
  skills?: Skill[];
}

export interface ExecutionOutcome {
  success: boolean;
  failureReason?: 'capability-mismatch' | 'provider-error' | 'user-abort' | 'timeout' | 'other';
  tokenCount?: number;
  latencyMs?: number;
}

export interface ExecutionRecord {
  id: string;
  meta: ExecutionMeta;
  intent: CapabilityIntent;
  configSnapshot: MergedConfig;
  decision: ModelDecision;
  outcome: ExecutionOutcome;
  command?: string;
}

export function createExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createExecutionRecord(
  commandName: string,
  requirement: CapabilityRequirement,
  config: MergedConfig,
  matchResult: any,
  outcome: Partial<ExecutionOutcome> = {},
  command?: string
): ExecutionRecord {
  const version = require('../../package.json').version;

  return {
    id: createExecutionId(),
    meta: {
      commandName,
      timestamp: new Date().toISOString(),
      toolVersion: version,
      projectPath: process.cwd(),
      version,
      replayable: true,
    },
    intent: {
      required: requirement.required.map(String),
      preferred: requirement.preferred.map(String),
      capabilityVersion: require('./capabilities').CAPABILITY_VERSION,
    },
    configSnapshot: config,
    decision: {
      candidateModels: matchResult.candidates || [],
      selectedModel: matchResult.selected,
      usedFallback: matchResult.fallbackOccurred,
    },
    outcome: {
      success: outcome.success ?? false,
      ...outcome,
    },
    command,
  };
}

export function serializeExecutionRecord(record: ExecutionRecord): string {
  return JSON.stringify(record, null, 2);
}

export function deserializeExecutionRecord(json: string): ExecutionRecord {
  return JSON.parse(json) as ExecutionRecord;
}
