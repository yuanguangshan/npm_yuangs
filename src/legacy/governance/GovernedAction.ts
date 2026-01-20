/**
 * Core Governance Types and Interfaces
 *
 * This module defines the foundational types for the Code Change Governance System.
 * All actions must implement GovernedAction and follow strict state transitions.
 */

/**
 * Valid governance states for any action
 * No action can skip states or bypass approval
 */
export type GovernanceState =
  | "DRAFT"
  | "PROPOSED"
  | "APPROVED"
  | "EXECUTED"
  | "OBSERVED"
  | "VERIFIED"
  | "REJECTED";

/**
 * Approval can only come from humans - no auto-approval
 */
export type ApprovalSource = "human";

/**
 * Provenance tracking for reproducibility and audit
 */
export interface ActionProvenance {
  /** The agent that created this action */
  agentId: string;

  /** Hash of the plan that generated this action */
  planHash: string;

  /** Parent action if this is a fix/repair attempt */
  parentAction?: string;

  /** When this action was created */
  createdAt: number;
}

/**
 * Execution context for running actions
 */
export interface ExecutionContext {
  executor: ActionExecutor;
  snapshot?: string;
}

/**
 * Result from executing an action
 */
export interface ExecutionResult {
  ok: boolean;
  error?: string;
  executedAt?: number;
  snapshotAfter?: string;
}

/**
 * Observation data after execution
 */
export interface Observation {
  gitDiff: string;
  changedFiles: string[];
  executionTime: number;
}

/**
 * Action executor interface (filesystem operations)
 * This is the ONLY place where filesystem changes can happen
 */
export interface ActionExecutor {
  applyDiff(diff: string): Promise<void>;

  readFile(path: string): Promise<string>;

  writeFile(path: string, content: string): Promise<void>;

  deleteFile(path: string): Promise<void>;
}

/**
 * Core interface that ALL governed actions must implement
 * This enforces the constitutional constraints
 */
export interface GovernedAction<Payload = unknown> {
  /** Unique identifier for this action */
  readonly id: string;

  /** Type/kind of action (code_change, run_command, etc.) */
  readonly kind: string;

  /** The actual payload that will be executed */
  readonly payload: Payload;

  /** Current state of this action */
  state: GovernanceState;

  /** Why this action is being proposed (must be human-readable) */
  readonly rationale: string;

  /** Who created this action and when */
  readonly provenance: ActionProvenance;

  /** When was the state last updated */
  updatedAt: number;

  /** Transition from DRAFT to PROPOSED */
  propose(): void;

  /** Transition from PROPOSED to APPROVED (only human can approve) */
  approve(by: ApprovalSource): void;

  /** Transition from any state to REJECTED */
  reject(reason: string): void;

  /** Execute the action (only possible if APPROVED) */
  execute(ctx: ExecutionContext): Promise<ExecutionResult>;

  /** Observe the results of execution (only possible if EXECUTED) */
  observe(): Promise<Observation>;

  /** Verify the observation (only possible if OBSERVED) */
  verify(obs: Observation): boolean;

  /** Get a summary of this action for display */
  summarize(): ActionSummary;
}

/**
 * Human-readable summary of an action
 */
export interface ActionSummary {
  id: string;
  kind: string;
  state: GovernanceState;
  rationale: string;
  filesAffected?: string[];
  changeSize?: number;
}
