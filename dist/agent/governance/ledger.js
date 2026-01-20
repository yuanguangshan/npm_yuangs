"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskLedger = void 0;
class RiskLedger {
    entries = [];
    record(actionType) {
        this.entries.push({ ts: Date.now(), actionType });
        // 自动清理 1 小时前的记录，保持轻量
        const hourAgo = Date.now() - 3600000;
        this.entries = this.entries.filter(e => e.ts > hourAgo);
    }
    getSnapshot() {
        return [...this.entries];
    }
}
exports.RiskLedger = RiskLedger;
//# sourceMappingURL=ledger.js.map