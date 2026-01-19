"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceFSM = void 0;
class GovernanceFSM {
    _state = 'IDLE';
    _history = [];
    _transitionLog = [];
    get current() {
        return this._state;
    }
    get history() {
        return [...this._history];
    }
    get transitionLog() {
        return [...this._transitionLog];
    }
    transitionTo(target, payload) {
        const valid = this.canTransition(this._state, target, payload);
        if (!valid) {
            throw new Error(`[FSM Violation] Illegal transition from ${this._state} to ${target}`);
        }
        console.log(`[FSM] ${this._state} -> ${target}`);
        if (payload && process.env.DEBUG_FSM) {
            console.log(`[FSM] Payload:`, JSON.stringify(payload, null, 2));
        }
        this._transitionLog.push({
            from: this._state,
            to: target,
            timestamp: Date.now(),
            payload: payload
        });
        this._history.push(this._state);
        this._state = target;
    }
    canTransition(from, to, payload) {
        switch (from) {
            case 'IDLE':
                return to === 'THINKING';
            case 'THINKING':
                return to === 'PROPOSING' || to === 'TERMINAL';
            case 'PROPOSING':
                return to === 'GOVERNING';
            case 'GOVERNING':
                const decision = payload;
                if (!decision)
                    return false;
                if (decision.status === 'approved' || decision.status === 'modified') {
                    return to === 'EXECUTING';
                }
                if (decision.status === 'rejected') {
                    return to === 'THINKING';
                }
                return false;
            case 'EXECUTING':
                return to === 'OBSERVING';
            case 'OBSERVING':
                return to === 'EVALUATING';
            case 'EVALUATING':
                const outcome = payload;
                if (!outcome)
                    return false;
                if (outcome.kind === 'continue') {
                    return to === 'THINKING';
                }
                if (outcome.kind === 'terminate') {
                    return to === 'TERMINAL';
                }
                if (outcome.kind === 'pause') {
                    return to === 'IDLE';
                }
                return false;
            case 'TERMINAL':
                return to === 'IDLE';
            default:
                return false;
        }
    }
    isTerminal() {
        return this._state === 'TERMINAL';
    }
    reset() {
        this._state = 'IDLE';
        this._history = [];
        this._transitionLog = [];
    }
    getStateInfo() {
        return {
            current: this._state,
            history: this._history,
            transitionCount: this._transitionLog.length
        };
    }
}
exports.GovernanceFSM = GovernanceFSM;
//# sourceMappingURL=fsm.js.map