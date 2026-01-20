"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceService = void 0;
const readline_1 = __importDefault(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const path_1 = __importDefault(require("path"));
const core_1 = require("./governance/core");
const ledger_1 = require("./governance/ledger");
const bridge_1 = require("./governance/bridge");
class PolicyEngine {
    rules = [];
    policyPath = path_1.default.join(process.cwd(), 'policy.yaml');
    constructor() {
        this.loadPolicy();
        // 热加载：监听文件变化
        fs_1.default.watchFile(this.policyPath, () => {
            console.log(chalk_1.default.gray('\n[Policy] 检测到策略更新，正在重新加载...'));
            this.loadPolicy();
        });
    }
    loadPolicy() {
        try {
            const content = fs_1.default.readFileSync(this.policyPath, 'utf8');
            const doc = js_yaml_1.default.load(content);
            this.rules = doc.rules || [];
        }
        catch (e) {
            console.error(chalk_1.default.red('加载 policy.yaml 失败，使用空策略'));
        }
    }
}
class GovernanceService {
    static engine = new PolicyEngine();
    static ledger = new ledger_1.RiskLedger();
    static wasmBridge = new bridge_1.WasmGovernanceBridge();
    static wasmInited = false;
    /**
     * 将复杂的 YAML 规则简化为 AI 可理解的陈述句
     */
    static getPolicyManual() {
        return this.engine.rules
            .map(r => `- ${r.id}: ${r.reason || '受限操作'} (结果: ${r.effect})`)
            .join('\n');
    }
    static getRules() { return this.engine.rules; }
    static getLedgerSnapshot() { return this.ledger.getSnapshot(); }
    static async adjudicate(action) {
        // 0. 初始化 WASM (仅一次)
        if (!this.wasmInited) {
            try {
                await this.wasmBridge.init();
                this.wasmInited = true;
            }
            catch (e) {
                console.error(chalk_1.default.yellow(`[WASM] 启动物理隔离沙盒失败，正在回退到进程内评估: ${e.message}`));
            }
        }
        // 1. 获取账本快照并进行评估
        let effect;
        let reason;
        if (this.wasmInited) {
            // 调用 WASM 物理隔离核心进行评估
            const wasmResult = this.wasmBridge.evaluate(action, this.engine.rules, this.ledger.getSnapshot());
            effect = wasmResult.effect;
            reason = wasmResult.reason;
        }
        else {
            // 回退到原有的纯逻辑评估 (WASM-Ready)
            const result = (0, core_1.evaluateProposal)(action, this.engine.rules, this.ledger.getSnapshot());
            effect = result.effect;
            reason = result.reason;
        }
        if (effect === 'allow') {
            this.ledger.record(action.type); // 记录成功行为
            return { status: 'approved', by: 'policy', timestamp: Date.now() };
        }
        if (effect === 'deny') {
            console.log(chalk_1.default.red(`\n🚫 策略拦截: ${reason}`));
            return { status: 'rejected', by: 'policy', reason: reason || 'Policy Violation', timestamp: Date.now() };
        }
        // 2. 人类干预
        console.log(chalk_1.default.yellow(`\n⚠️ 待审操作: ${action.type}`));
        if (reason)
            console.log(chalk_1.default.gray(`策略提示: ${reason}`));
        console.log(chalk_1.default.gray(`AI 动机: ${action.reasoning}`));
        console.log(chalk_1.default.cyan(`参数: ${JSON.stringify(action.payload)}`));
        const ans = await this.ask('批准执行? (y/n): ');
        if (ans === 'y') {
            this.ledger.record(action.type); // 人工批准也记录进账本
            return { status: 'approved', by: 'human', timestamp: Date.now() };
        }
        return { status: 'rejected', by: 'human', reason: 'User denied', timestamp: Date.now() };
    }
    static evaluateRisk(action) {
        const cmd = JSON.stringify(action.payload).toLowerCase();
        if (/rm\s+-rf|sudo|chmod\s+777/.test(cmd))
            return 'high';
        if (['shell_cmd', 'write_file'].includes(action.type))
            return 'medium';
        return 'low';
    }
    static ask(q) {
        const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise(res => rl.question(chalk_1.default.bold.cyan(q), a => { rl.close(); res(a.toLowerCase()); }));
    }
}
exports.GovernanceService = GovernanceService;
//# sourceMappingURL=governance.js.map