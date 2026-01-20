import { GovernanceState } from "../GovernedAction";
/**
 * Throw governance violation if transition is not permitted
 */
export declare function assertTransition(from: GovernanceState, to: GovernanceState): void;
/**
 * Check if a transition is valid (without throwing)
 */
export declare function canTransition(from: GovernanceState, to: GovernanceState): boolean;
/**
 * Get all possible next states from current state
 */
export declare function getNextStates(from: GovernanceState): GovernanceState[];
/**
 * Validate that a state is valid
 */
export declare function isValidState(state: string): state is GovernanceState;
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
export declare class GovernanceStateMachine {
    private currentState;
    private history;
    constructor(initialState: GovernanceState);
    get current(): GovernanceState;
    get transitionHistory(): TransitionHistoryEntry[];
    transition(to: GovernanceState, reason?: string): void;
    isTerminal(): boolean;
    canProceedTo(state: GovernanceState): boolean;
}
