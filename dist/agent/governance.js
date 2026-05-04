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
const riskScoring_1 = require("./governance/riskScoring");
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class GovernanceService {
    static rules = [];
    static ledger = new ledger_1.RiskLedger();
    static riskModel = riskScoring_1.defaultRiskScoringModel;
    static initialized = false;
    static currentUserId;
    static async init() {
        if (this.initialized)
            return;
        this.loadPolicy();
        await bridge_1.WasmGovernanceBridge.init();
        this.initialized = true;
    }
    /**
     * 设置当前用户 ID（用于信任度评估）
     */
    static setUserId(userId) {
        this.currentUserId = userId;
    }
    /**
     * 获取风险评分模型（用于信任度更新等操作）
     */
    static getRiskModel() {
        return this.riskModel;
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
        // 0. 风险评分量化 (新增)
        const riskAssessment = this.riskModel.assessRisk(action, this.currentUserId);
        // 如果建议是自动允许且风险低，快速通过
        if (riskAssessment.suggestedAction === 'auto-allow' && riskAssessment.level === 'low') {
            this.ledger.record(action.type);
            return {
                status: 'approved',
                by: 'policy',
                timestamp: Date.now(),
                riskScore: riskAssessment.score
            };
        }
        // 如果建议是直接拒绝且风险极高，直接拒绝
        if (riskAssessment.suggestedAction === 'deny' && riskAssessment.level === 'critical') {
            return {
                status: 'rejected',
                by: 'policy',
                reason: `风险评分过高 (${riskAssessment.score}/100): ${this.getPrimaryRiskReason(riskAssessment)}`,
                timestamp: Date.now(),
                riskScore: riskAssessment.score
            };
        }
        // 1. WASM 物理层核验
        const wasmResult = bridge_1.WasmGovernanceBridge.evaluate(action, this.rules, this.ledger.getSnapshot());
        if (wasmResult.effect === 'deny') {
            return { status: 'rejected', by: 'policy', reason: wasmResult.reason || 'WASM Denied', timestamp: Date.now(), riskScore: riskAssessment.score };
        }
        // 2. 逻辑层核验
        const logicResult = (0, core_1.evaluateProposal)(action, this.rules, this.ledger.getSnapshot());
        if (logicResult.effect === 'deny') {
            return { status: 'rejected', by: 'policy', reason: logicResult.reason || 'Policy Denied', timestamp: Date.now(), riskScore: riskAssessment.score };
        }
        if (logicResult.effect === 'allow') {
            this.ledger.record(action.type);
            return { status: 'approved', by: 'policy', timestamp: Date.now(), riskScore: riskAssessment.score };
        }
        // 3. 人工干预兜底
        console.log(chalk_1.default.yellow(`\n⚠️  Governance: Explicit approval required for ${action.type}`));
        if (action.type === 'shell_cmd') {
            console.log(chalk_1.default.bold.green('💻 Proposed Command: ') + chalk_1.default.yellow(action.payload.command));
        }
        else if (action.type === 'tool_call') {
            const toolPayload = action.payload;
            console.log(chalk_1.default.bold.green('🛠️  Tool: ') + chalk_1.default.cyan(`${toolPayload.tool_name}(${JSON.stringify(toolPayload.parameters)})`));
        }
        // 显示量化风险评分
        console.log(chalk_1.default.bold(`\n📊 Risk Assessment: ${riskAssessment.score}/100 (${riskAssessment.level.toUpperCase()})`));
        console.log(chalk_1.default.gray(`   Confidence: ${(riskAssessment.confidence * 100).toFixed(0)}% | User Trust: ${(riskAssessment.userTrust * 100).toFixed(0)}%`));
        // 显示主要风险因子
        const topFactors = riskAssessment.factors
            .filter(f => f.score > 0.1)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        if (topFactors.length > 0) {
            console.log(chalk_1.default.bold('\n   Key Risk Factors:'));
            for (const factor of topFactors) {
                const bar = '█'.repeat(Math.floor(factor.score * 20));
                console.log(`   ${chalk_1.default.dim('•')} ${factor.name.padEnd(20)} ${chalk_1.default.yellow(bar)} ${chalk_1.default.white((factor.score * 100).toFixed(0)) + '%'} - ${factor.reason}`);
            }
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
            // 成功执行后增加用户信任度
            if (this.currentUserId) {
                this.riskModel.updateUserTrust(this.currentUserId, 'success', 0.05);
            }
            return { status: 'approved', by: 'human', timestamp: Date.now(), riskScore: riskAssessment.score };
        }
        else {
            // 用户拒绝，降低信任度
            if (this.currentUserId) {
                this.riskModel.updateUserTrust(this.currentUserId, 'failure', 0.02);
            }
            return { status: 'rejected', by: 'human', reason: 'User declined execution', timestamp: Date.now(), riskScore: riskAssessment.score };
        }
    }
    /**
     * 获取主要风险原因（用于拒绝消息）
     */
    static getPrimaryRiskReason(assessment) {
        const topFactor = assessment.factors
            .filter(f => f.score > 0.2)
            .sort((a, b) => b.score - a.score)[0];
        return topFactor ? topFactor.reason : 'High overall risk';
    }
    /**
     * 获取用户信任度统计
     */
    static getUserTrustStats() {
        return this.riskModel.getTrustStats();
    }
    /**
     * 重置用户信任度
     */
    static resetUserTrust(userId) {
        this.riskModel.resetUserTrust(userId);
    }
}
exports.GovernanceService = GovernanceService;
//# sourceMappingURL=governance.js.map