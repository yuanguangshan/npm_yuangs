"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskLedger = void 0;
class RiskLedger {
    entries = [];
    record(actionType) {
        this.entries.push({
            ts: Date.now(),
            actionType
        });
        this.cleanup();
    }
    getSnapshot() {
        return [...this.entries];
    }
    cleanup() {
        const oneHourAgo = Date.now() - 3600000;
        this.entries = this.entries.filter(e => e.ts > oneHourAgo);
    }
    clear() {
        this.entries = [];
    }
    resetForTesting() {
        this.clear();
    }
}
exports.RiskLedger = RiskLedger;
//# sourceMappingURL=ledger.js.map