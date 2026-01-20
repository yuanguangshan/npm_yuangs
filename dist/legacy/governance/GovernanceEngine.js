"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceEngine = void 0;
/**
 * Governance engine - single point of control for all governed actions
 * Enforces "No Diff Without Review. No Execution Without Approval."
 */
class GovernanceEngine {
    actions = new Map();
    revokedActions = new Set();
    register(action) {
        if (this.revokedActions.has(action.id)) {
            throw new Error(`Governance violation: action ${action.id} was revoked`);
        }
        this.actions.set(action.id, action);
    }
    getAction(id) {
        return this.actions.get(id);
    }
    listActions() {
        return Array.from(this.actions.values());
    }
    requestApproval(id) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        action.propose();
        console.log(`[PROPOSED] ${action.kind}:${id}`);
        console.log(`Rationale: ${action.rationale}`);
    }
    approve(id, by) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        if (by !== "human") {
            throw new Error(`Governance violation: only human can approve`);
        }
        action.approve(by);
        console.log(`[APPROVED] ${action.kind}:${id} by ${by}`);
    }
    reject(id, reason) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        action.reject(reason);
        console.log(`[REJECTED] ${action.kind}:${id}`);
        console.log(`Reason: ${reason}`);
    }
    async execute(id, ctx) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        if (action.state !== "APPROVED") {
            throw new Error(`Governance violation: execute() called on ${action.kind}:${id} in state ${action.state}, must be APPROVED`);
        }
        const result = await action.execute(ctx);
        if (!result.ok) {
            throw new Error(`Execution failed: ${result.error || "unknown error"}`);
        }
        console.log(`[EXECUTED] ${action.kind}:${id}`);
    }
    async observe(id) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        const obs = await action.observe();
        console.log(`[OBSERVED] ${action.kind}:${id}`);
        console.log(`Files changed: ${obs.changedFiles.length}`);
    }
    verify(id, obs) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        const verified = action.verify(obs);
        if (verified) {
            console.log(`[VERIFIED] ${action.kind}:${id}`);
        }
        return verified;
    }
    revoke(id) {
        this.actions.delete(id);
        this.revokedActions.add(id);
    }
    has(id) {
        return this.actions.has(id) && !this.revokedActions.has(id);
    }
}
exports.GovernanceEngine = GovernanceEngine;
//# sourceMappingURL=GovernanceEngine.js.map