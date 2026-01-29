/**
 * Workflow Type Definitions
 * -------------------------
 * Defines strong-typed contracts for all workflows.
 * Eliminates sharedContext and any types, ensuring compile-time correctness.
 */

import { CapabilityLevel, MinCapability } from '../capability/CapabilityLevel';

/**
 * Base workflow configuration
 */
export interface WorkflowConfig {
  sessionId: string;
  model?: string;
  capability: CapabilityLevel;
}

/**
 * Result wrapper for all workflows
 */
export interface WorkflowResult<T> {
  success: boolean;
  data?: T;
  errors?: WorkflowError[];
  summary: string;
  tokensUsed?: number;
}

/**
 * Generic workflow interface
 */
export interface Workflow<I, O> {
  run(input: I, config: WorkflowConfig): Promise<WorkflowResult<O>>;
}

// ============================================================================
// PLAN WORKFLOW
// ============================================================================

/**
 * Plan workflow input
 */
export interface PlanInput {
  userPrompt: string;
  maxRounds?: number;
  architectModel?: string;
  reviewerModel?: string;
}

/**
 * Plan workflow output
 */
export interface PlanOutput {
  todoMarkdown: string;
  capability: MinCapability;
  estimatedTime: number;
  estimatedTokens: number;
  scope: 'small' | 'medium' | 'large';
}

// ============================================================================
// AUTO WORKFLOW
// ============================================================================

/**
 * Auto workflow input
 */
export interface AutoInput {
  plan: PlanOutput;
  maxTasks?: number;
  minScore?: number;
  reviewLevel?: 'quick' | 'standard' | 'deep';
  skipReview?: boolean;
  saveOnly?: boolean;
  autoCommit?: boolean;
  commitMessage?: string;
}

/**
 * Auto workflow output
 */
export interface AutoOutput {
  executedTasks: number;
  totalTasks: number;
  filesModified: string[];
  patch: string;
  dryRunApplied: boolean;
  commitHash?: string;
  backupIds: string[];
}

// ============================================================================
// REVIEW WORKFLOW
// ============================================================================

/**
 * Review workflow input
 */
export interface ReviewInput {
  plan?: PlanOutput;
  auto?: AutoOutput;
  reviewTarget: 'staged' | 'unstaged' | 'commit' | 'file';
  targetRef?: string; // commit hash or file path
  level: 'quick' | 'standard' | 'deep';
}

/**
 * Review workflow output
 */
export interface ReviewOutput {
  score: number;
  confidence: number;
  summary: string;
  filesReviewed: number;
  issues: ReviewIssue[];
  strengths: string[];
  recommendations: string[];
}

/**
 * Review issue
 */
export interface ReviewIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
  snippet?: string;
}

// ============================================================================
// WORKFLOW ERROR
// ============================================================================

/**
 * Error kinds for workflow-level error handling
 */
export type WorkflowErrorKind =
  | 'UserInput'          // User provided invalid input
  | 'Precondition'       // System preconditions not met
  | 'CapabilityDenied'    // Capability constraint violation
  | 'ExternalService'     // External service failure (LLM, git, etc.)
  | 'InternalBug';       // Unexpected system error

/**
 * Workflow-level error with context
 */
export class WorkflowError extends Error {
  readonly kind: WorkflowErrorKind;
  readonly recoverable: boolean;
  readonly phase?: string;
  readonly suggestions?: string[];

  constructor(
    kind: WorkflowErrorKind,
    message: string,
    options: {
      recoverable?: boolean;
      phase?: string;
      suggestions?: string[];
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.kind = kind;
    this.recoverable = options.recoverable ?? true;
    this.phase = options.phase;
    this.suggestions = options.suggestions;

    if (options.cause) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Create UserInput error (non-recoverable)
   */
  static userInput(message: string, suggestions?: string[]): WorkflowError {
    return new WorkflowError('UserInput', message, {
      recoverable: false,
      suggestions
    });
  }

  /**
   * Create Precondition error (non-recoverable)
   */
  static precondition(message: string, suggestions?: string[]): WorkflowError {
    return new WorkflowError('Precondition', message, {
      recoverable: false,
      suggestions
    });
  }

  /**
   * Create CapabilityDenied error (non-recoverable)
   */
  static capabilityDenied(message: string, suggestions?: string[]): WorkflowError {
    return new WorkflowError('CapabilityDenied', message, {
      recoverable: false,
      suggestions
    });
  }

  /**
   * Create ExternalService error (recoverable)
   */
  static externalService(message: string, cause?: Error, suggestions?: string[]): WorkflowError {
    return new WorkflowError('ExternalService', message, {
      recoverable: true,
      cause,
      suggestions
    });
  }

  /**
   * Create InternalBug error (non-recoverable)
   */
  static internalBug(message: string, cause?: Error): WorkflowError {
    return new WorkflowError('InternalBug', message, {
      recoverable: false,
      cause,
      suggestions: ['Please report this issue', 'Check logs for more details']
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create successful workflow result
 */
export function workflowSuccess<T>(data: T, summary: string, tokensUsed?: number): WorkflowResult<T> {
  return {
    success: true,
    data,
    summary,
    tokensUsed
  };
}

/**
 * Create failed workflow result
 */
export function workflowFailure<T>(
  summary: string,
  errors: WorkflowError[]
): WorkflowResult<T> {
  return {
    success: false,
    summary,
    errors
  };
}

/**
 * Unwrap workflow result or throw
 */
export function unwrap<T>(result: WorkflowResult<T>): T {
  if (!result.success || !result.data) {
    const error = result.errors?.[0] || new WorkflowError('InternalBug', 'Unknown workflow failure');
    throw error;
  }
  return result.data;
}
