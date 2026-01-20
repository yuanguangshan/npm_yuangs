"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceStateMachine = void 0;
exports.assertTransition = assertTransition;
exports.canTransition = canTransition;
exports.getNextStates = getNextStates;
exports.isValidState = isValidState;
/**
 * Only these state transitions are legally permitted
 * Any other transition is a governance violation
 */
const ALLOWED_TRANSITIONS = {
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
function assertTransition(from, to) {
    const allowed = ALLOWED_TRANSITIONS[from].includes(to);
    if (!allowed) {
        throw new Error(`Governance violation: illegal state transition ${from} → ${to}`);
    }
}
/**
 * Check if a transition is valid (without throwing)
 */
function canTransition(from, to) {
    return ALLOWED_TRANSITIONS[from].includes(to);
}
/**
 * Get all possible next states from current state
 */
function getNextStates(from) {
    return [...ALLOWED_TRANSITIONS[from]];
}
/**
 * Validate that a state is valid
 */
function isValidState(state) {
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
 * State machine for tracking governance state transitions
 * Enforces constitutional invariants
 */
class GovernanceStateMachine {
    currentState;
    history = [];
    constructor(initialState) {
        if (!isValidState(initialState)) {
            throw new Error(`Invalid initial state: ${initialState}`);
        }
        this.currentState = initialState;
    }
    get current() {
        return this.currentState;
    }
    get transitionHistory() {
        return [...this.history];
    }
    transition(to, reason) {
        assertTransition(this.currentState, to);
        this.history.push({
            from: this.currentState,
            to,
            timestamp: Date.now(),
            reason,
        });
        this.currentState = to;
    }
    isTerminal() {
        return this.currentState === "VERIFIED" || this.currentState === "REJECTED";
    }
    canProceedTo(state) {
        return canTransition(this.currentState, state);
    }
}
exports.GovernanceStateMachine = GovernanceStateMachine;
//# sourceMappingURL=stateMachine.js.map