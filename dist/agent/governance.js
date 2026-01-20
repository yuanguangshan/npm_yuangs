"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceService = void 0;
const core_1 = require("./governance/core");
const ledger_1 = require("./governance/ledger");
const bridge_1 = require("./governance/bridge");
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class GovernanceService {
    static rules = [];
    static ledger = new ledger_1.RiskLedger();
    static initialized = false;
    static async init() {
        if (this.initialized)
            return;
        this.loadPolicy();
        await bridge_1.WasmGovernanceBridge.init();
        this.initialized = true;
    }
    static loadPolicy() {
        try {
            const policyPath = path_1.default.join(process.cwd(), 'policy.yaml');
            if (fs_1.default.existsSync(policyPath)) {
                const content = fs_1.default.readFileSync(policyPath, 'utf8');
                const config = js_yaml_1.default.load(content);
                this.rules = config.rules || [];
            }
        }
        catch (e) {
            this.rules = [];
        }
    }
    static getRules() {
        return this.rules;
    }
    static getLedgerSnapshot() {
        return this.ledger.getSnapshot();
    }
    static getPolicyManual() {
        return this.rules.map(r => `- ${r.id}: ${r.reason} (${r.effect})`).join('\n');
    }
    static async adjudicate(action) {
        await this.init();
        // 1. WASM 物理层核验
        const wasmResult = bridge_1.WasmGovernanceBridge.evaluate(action, this.rules, this.ledger.getSnapshot());
        if (wasmResult.effect === 'deny') {
            return { status: 'rejected', by: 'policy', reason: wasmResult.reason || 'WASM Denied', timestamp: Date.now() };
        }
        // 2. 逻辑层核验
        const logicResult = (0, core_1.evaluateProposal)(action, this.rules, this.ledger.getSnapshot());
        if (logicResult.effect === 'deny') {
            return { status: 'rejected', by: 'policy', reason: logicResult.reason || 'Policy Denied', timestamp: Date.now() };
        }
        if (logicResult.effect === 'allow') {
            this.ledger.record(action.type);
            return { status: 'approved', by: 'policy', timestamp: Date.now() };
        }
        // 3. 人工干预兜底 (模拟)
        return { status: 'approved', by: 'human', timestamp: Date.now() };
    }
}
exports.GovernanceService = GovernanceService;
//# sourceMappingURL=governance.js.map