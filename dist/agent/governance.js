"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceService = void 0;
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("./governance/core");
const ledger_1 = require("./governance/ledger");
const bridge_1 = require("./governance/bridge");
const riskDisclosure_1 = require("./riskDisclosure");
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
        // 3. 人工干预兜底
        console.log(chalk_1.default.yellow(`\n⚠️  Governance: Explicit approval required for ${action.type}`));
        if (action.type === 'shell_cmd') {
            console.log(chalk_1.default.bold.green('💻 Proposed Command: ') + chalk_1.default.yellow(action.payload.command));
        }
        else if (action.type === 'tool_call') {
            console.log(chalk_1.default.bold.green('🛠️  Tool: ') + chalk_1.default.cyan(`${action.payload.tool_name}(${JSON.stringify(action.payload.parameters)})`));
        }
        // Generate and display risk disclosure
        const riskFactors = (0, riskDisclosure_1.extractRiskFactorsFromThought)(action.reasoning || '');
        riskFactors.commandType = action.type;
        if (action.type === 'shell_cmd') {
            riskFactors.command = action.payload.command;
        }
        riskFactors.isDestructive = action.payload.risk_level === 'high';
        const disclosure = (0, riskDisclosure_1.generateRiskDisclosure)(riskFactors);
        console.log((0, riskDisclosure_1.formatRiskDisclosureCLI)(disclosure));
        const { confirm } = await Promise.resolve().then(() => __importStar(require('../utils/confirm')));
        const ok = await confirm(`Do you want to proceed with this action?`);
        if (ok) {
            this.ledger.record(action.type);
            return { status: 'approved', by: 'human', timestamp: Date.now() };
        }
        else {
            return { status: 'rejected', by: 'human', reason: 'User declined execution', timestamp: Date.now() };
        }
    }
}
exports.GovernanceService = GovernanceService;
//# sourceMappingURL=governance.js.map