import { GovernanceState } from "../GovernedAction";

/**
 * Only these state transitions are legally permitted
 * Any other transition is a governance violation
 */
const ALLOWED_TRANSITIONS: Record<GovernanceState, GovernanceState[]> = {
  DRAFT: ["PROPOSED"],
  PROPOSED: ["APPROVED", "REJECTED"],
  APPROVED: ["EXECUTED"],
  EXECUTED: ["OBSERVED"],
  OBSERVED: ["VERIFIED"],
  VERIFIED: [],
  REJECTED: [],
};

/**
 * Throw governance violation if transition is not permitted
 */
export function assertTransition(
  from: GovernanceState,
  to: GovernanceState
): void {
  const allowed = ALLOWED_TRANSITIONS[from].includes(to);

  if (!allowed) {
    throw new Error(
      `Governance violation: illegal state transition ${from} → ${to}`
    );
  }
}

/**
 * Check if a transition is valid (without throwing)
 */
export function canTransition(
  from: GovernanceState,
  to: GovernanceState
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Get all possible next states from current state
 */
export function getNextStates(from: GovernanceState): GovernanceState[] {
  return [...ALLOWED_TRANSITIONS[from]];
}

/**
 * Validate that a state is valid
 */
export function isValidState(state: string): state is GovernanceState {
  return [
    "DRAFT",
    "PROPOSED",
    "APPROVED",
    "EXECUTED",
    "OBSERVED",
    "VERIFIED",
    "REJECTED",
  ].includes(state);
}

/**
 * State machine transition history entry
 */
export interface TransitionHistoryEntry {
  from: GovernanceState;
  to: GovernanceState;
  timestamp: number;
  reason?: string;
}

/**
 * State machine for tracking governance state transitions
 * Enforces constitutional invariants
 */
export class GovernanceStateMachine {
  private currentState: GovernanceState;
  private history: TransitionHistoryEntry[] = [];

  constructor(initialState: GovernanceState) {
    if (!isValidState(initialState)) {
      throw new Error(`Invalid initial state: ${initialState}`);
    }
    this.currentState = initialState;
  }

  get current(): GovernanceState {
    return this.currentState;
  }

  get transitionHistory(): TransitionHistoryEntry[] {
    return [...this.history];
  }

  transition(to: GovernanceState, reason?: string): void {
    assertTransition(this.currentState, to);

    this.history.push({
      from: this.currentState,
      to,
      timestamp: Date.now(),
      reason,
    });

    this.currentState = to;
  }

  isTerminal(): boolean {
    return this.currentState === "VERIFIED" || this.currentState === "REJECTED";
  }

  canProceedTo(state: GovernanceState): boolean {
    return canTransition(this.currentState, state);
  }
}
