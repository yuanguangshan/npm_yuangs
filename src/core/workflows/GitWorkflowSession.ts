/**
 * GitWorkflowSession
 * -----------------
 * Central orchestrator for AI-driven Git workflow lifecycle.
 * Manages typed workflow outputs and enforces state transitions.
 */

import {
  PlanInput,
  PlanOutput,
  AutoInput,
  AutoOutput,
  ReviewInput,
  ReviewOutput,
  WorkflowConfig,
  WorkflowResult,
  WorkflowError,
  unwrap
} from './types';
import { CapabilityLevel } from '../capability/CapabilityLevel';

export type WorkflowPhase =
  | 'initialized'
  | 'planning'
  | 'planned'
  | 'executing'
  | 'executed'
  | 'reviewing'
  | 'reviewed'
  | 'completed'
  | 'failed';

export interface SessionState {
  sessionId: string;
  startTime: string;
  lastUpdateTime: string;
  phase: WorkflowPhase;
  planOutput?: PlanOutput;
  autoOutput?: AutoOutput;
  reviewOutput?: ReviewOutput;
  config: WorkflowConfig;
  errors: WorkflowError[];
  logs: SessionLog[];
}

export interface SessionLog {
  timestamp: string;
  phase: WorkflowPhase;
  event: string;
  details?: string;
}

export class GitWorkflowSession {
  private state: SessionState;

  constructor(config: WorkflowConfig) {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    this.state = {
      sessionId,
      startTime: now,
      lastUpdateTime: now,
      phase: 'initialized',
      config,
      errors: [],
      logs: []
    };

    this.log('initialized', 'Session created');
  }

  private updatePhase(newPhase: WorkflowPhase) {
    this.state.phase = newPhase;
    this.state.lastUpdateTime = new Date().toISOString();
    this.log(newPhase, `Phase transition: ${this.state.phase} -> ${newPhase}`);
  }

  private log(phase: WorkflowPhase, event: string, details?: string) {
    this.state.logs.push({
      timestamp: new Date().toISOString(),
      phase,
      event,
      details
    });
  }

  private addError(error: WorkflowError) {
    this.state.errors.push(error);
    this.log(this.state.phase, 'Error added', `${error.kind}: ${error.message}`);
  }

  getSessionId(): string {
    return this.state.sessionId;
  }

  getState(): Readonly<SessionState> {
    return { ...this.state };
  }

  getConfig(): WorkflowConfig {
    return this.state.config;
  }

  getPhase(): WorkflowPhase {
    return this.state.phase;
  }

  canProceed(requiredCapability?: CapabilityLevel): boolean {
    if (requiredCapability && this.state.config.capability < requiredCapability) {
      return false;
    }

    return !['completed', 'failed'].includes(this.state.phase);
  }

  async runPlan(fn: (input: PlanInput) => Promise<WorkflowResult<PlanOutput>>, input: PlanInput): Promise<WorkflowResult<PlanOutput>> {
    if (!this.canProceed()) {
      return {
        success: false,
        summary: 'Cannot proceed: session in terminal state',
        errors: this.state.errors
      };
    }

    this.updatePhase('planning');

    try {
      const result = await fn(input);

      if (result.success && result.data) {
        this.state.planOutput = result.data;
        this.updatePhase('planned');
      } else {
        this.updatePhase('failed');
        if (result.errors) {
          result.errors.forEach(e => this.addError(e));
        }
      }

      return result;
    } catch (error) {
      this.updatePhase('failed');
      this.addError(error as WorkflowError);
      throw error;
    }
  }

  async runAuto(
    fn: (input: AutoInput) => Promise<WorkflowResult<AutoOutput>>
  ): Promise<WorkflowResult<AutoOutput>> {
    if (this.state.phase !== 'planned') {
      return {
        success: false,
        summary: 'Auto requires completed planning phase',
        errors: [
          WorkflowError.precondition('Cannot run auto: plan phase not completed')
        ]
      };
    }

    if (!this.state.planOutput) {
      return {
        success: false,
        summary: 'Plan output not available',
        errors: [
          WorkflowError.internalBug('Plan output missing')
        ]
      };
    }

    if (!this.canProceed()) {
      return {
        success: false,
        summary: 'Cannot proceed: session in terminal state',
        errors: this.state.errors
      };
    }

    this.updatePhase('executing');

    try {
      const input: AutoInput = {
        plan: this.state.planOutput,
      };

      const result = await fn(input);

      if (result.success && result.data) {
        this.state.autoOutput = result.data;
        this.updatePhase('executed');
      } else {
        this.updatePhase('failed');
        if (result.errors) {
          result.errors.forEach(e => this.addError(e));
        }
      }

      return result;
    } catch (error) {
      this.updatePhase('failed');
      this.addError(error as WorkflowError);
      throw error;
    }
  }

  async runReview(
    fn: (input: ReviewInput) => Promise<WorkflowResult<ReviewOutput>>
  ): Promise<WorkflowResult<ReviewOutput>> {
    if (this.state.phase !== 'executed') {
      return {
        success: false,
        summary: 'Review requires completed execution phase',
        errors: [
          WorkflowError.precondition('Cannot run review: auto phase not completed')
        ]
      };
    }

    if (!this.canProceed()) {
      return {
        success: false,
        summary: 'Cannot proceed: session in terminal state',
        errors: this.state.errors
      };
    }

    this.updatePhase('reviewing');

    try {
      const input: ReviewInput = {
        plan: this.state.planOutput,
        auto: this.state.autoOutput,
        reviewTarget: 'staged',
        level: 'standard'
      };

      const result = await fn(input);

      if (result.success && result.data) {
        this.state.reviewOutput = result.data;
        this.updatePhase('reviewed');
      } else {
        this.updatePhase('failed');
        if (result.errors) {
          result.errors.forEach(e => this.addError(e));
        }
      }

      return result;
    } catch (error) {
      this.updatePhase('failed');
      this.addError(error as WorkflowError);
      throw error;
    }
  }

  complete(): void {
    this.updatePhase('completed');
  }

  /**
   * 安全地从外部加载已完成的计划输出
   * 用于恢复之前生成的会话状态
   * 
   * @param planOutput 计划输出数据
   */
  loadPlanFromExternal(planOutput: PlanOutput): void {
    if (this.state.phase === 'initialized' || this.state.phase === 'planning') {
      this.state.planOutput = planOutput;
      this.updatePhase('planned');
      this.log('planned', 'Plan loaded from external source');
    } else {
      throw new Error(`Cannot load plan in current phase: ${this.state.phase}`);
    }
  }

  getLogs(): Readonly<SessionLog[]> {
    return [...this.state.logs];
  }

  getErrors(): Readonly<WorkflowError[]> {
    return [...this.state.errors];
  }

  getSummary(): string {
    const elapsed = Date.now() - new Date(this.state.startTime).getTime();
    const elapsedMinutes = Math.floor(elapsed / 60000);

    let summary = `Session: ${this.state.sessionId}\n`;
    summary += `Phase: ${this.state.phase}\n`;
    summary += `Elapsed: ${elapsedMinutes} minutes\n`;
    summary += `Errors: ${this.state.errors.length}\n`;
    summary += `Logs: ${this.state.logs.length}\n`;

    if (this.state.planOutput) {
      summary += `\nPlan:\n`;
      summary += `  Scope: ${this.state.planOutput.scope}\n`;
      summary += `  Capability: ${this.state.planOutput.capability.minCapability}\n`;
    }

    if (this.state.autoOutput) {
      summary += `\nAuto:\n`;
      summary += `  Tasks: ${this.state.autoOutput.executedTasks}/${this.state.autoOutput.totalTasks}\n`;
      summary += `  Files: ${this.state.autoOutput.filesModified.length}\n`;
    }

    if (this.state.reviewOutput) {
      summary += `\nReview:\n`;
      summary += `  Score: ${this.state.reviewOutput.score}/100\n`;
      summary += `  Issues: ${this.state.reviewOutput.issues.length}\n`;
    }

    return summary;
  }
}
