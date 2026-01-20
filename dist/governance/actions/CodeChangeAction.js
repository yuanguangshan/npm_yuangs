"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeChangeAction = void 0;
const crypto_1 = __importDefault(require("crypto"));
class CodeChangeAction {
    id;
    payload;
    rationale;
    provenance;
    kind = "code_change";
    state = "DRAFT";
    updatedAt = Date.now();
    constructor(id, payload, rationale, provenance) {
        this.id = id;
        this.payload = payload;
        this.rationale = rationale;
        this.provenance = provenance;
        this.updatedAt = provenance.createdAt;
    }
    propose() {
        if (this.state !== "DRAFT") {
            throw new Error(`Governance violation: propose() called from ${this.state}, must be DRAFT`);
        }
        this.state = "PROPOSED";
        this.updatedAt = Date.now();
    }
    approve(by) {
        if (this.state !== "PROPOSED") {
            throw new Error(`Governance violation: approve() called from ${this.state}, must be PROPOSED`);
        }
        if (by !== "human") {
            throw new Error(`Governance violation: only human can approve, got ${by}`);
        }
        this.state = "APPROVED";
        this.updatedAt = Date.now();
    }
    reject(reason) {
        if (this.state === "REJECTED") {
            throw new Error(`Governance violation: reject() called from ${this.state}, already rejected`);
        }
        this.state = "REJECTED";
        this.updatedAt = Date.now();
    }
    async execute(ctx) {
        if (this.state !== "APPROVED") {
            throw new Error(`Governance violation: execute() called from ${this.state}, must be APPROVED`);
        }
        const startTime = Date.now();
        try {
            await ctx.executor.applyDiff(this.payload.diff);
            this.state = "EXECUTED";
            this.updatedAt = Date.now();
            return {
                ok: true,
                executedAt: Date.now(),
                snapshotAfter: ctx.snapshot,
            };
        }
        catch (error) {
            this.state = "REJECTED";
            this.updatedAt = Date.now();
            return {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async observe() {
        if (this.state !== "EXECUTED") {
            throw new Error(`Governance violation: observe() called from ${this.state}, must be EXECUTED`);
        }
        const { execSync } = require("child_process");
        const changedFiles = execSync("git diff --name-only", {
            encoding: "utf-8",
        })
            .trim()
            .split("\n")
            .filter((f) => f);
        const gitDiff = execSync("git diff", { encoding: "utf-8" });
        this.state = "OBSERVED";
        this.updatedAt = Date.now();
        return {
            gitDiff,
            changedFiles,
            executionTime: Date.now(),
        };
    }
    verify(obs) {
        if (this.state !== "OBSERVED") {
            throw new Error(`Governance violation: verify() called from ${this.state}, must be OBSERVED`);
        }
        const changedFiles = new Set(obs.changedFiles);
        const declaredFiles = new Set(this.payload.files);
        const extraFiles = obs.changedFiles.filter((f) => !declaredFiles.has(f));
        if (extraFiles.length > 0) {
            throw new Error(`Governance violation: execution modified undeclared files: ${extraFiles.join(", ")}`);
        }
        this.state = "VERIFIED";
        this.updatedAt = Date.now();
        return true;
    }
    summarize() {
        const changeSize = this.calculateChangeSize();
        return {
            id: this.id,
            kind: this.kind,
            state: this.state,
            rationale: this.rationale,
            filesAffected: this.payload.files,
            changeSize,
        };
    }
    calculateChangeSize() {
        let additions = 0;
        let deletions = 0;
        for (const line of this.payload.diff.split("\n")) {
            if (line.startsWith("+") && !line.startsWith("+++"))
                additions++;
            if (line.startsWith("-") && !line.startsWith("---"))
                deletions++;
        }
        return additions + deletions;
    }
    static create(payload, rationale, agentId, planHash, parentAction) {
        const id = crypto_1.default.randomUUID();
        const provenance = {
            agentId,
            planHash,
            parentAction,
            createdAt: Date.now(),
        };
        return new CodeChangeAction(id, payload, rationale, provenance);
    }
}
exports.CodeChangeAction = CodeChangeAction;
//# sourceMappingURL=CodeChangeAction.js.map