"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kernel = void 0;
const Governance_1 = require("./Governance");
const Capabilities_1 = require("./Capabilities");
const chalk_1 = __importDefault(require("chalk"));
/**
 * [Action 1] 唯一的上帝视角 Loop
 * 整合了原来的 Loop, Agent, Executor, Context
 */
class Kernel {
    state = { turns: 0, lastResult: null };
    /**
     * 核心循环：想 -> 评 -> 行
     */
    async step(intent) {
        this.state.turns++;
        // 1. 理性建议 (AI Thinking)
        const proposal = await this.think(intent);
        // 2. 硬核治理 (Action 4: Governance 黑箱)
        const decision = await Governance_1.Governance.evaluate(proposal);
        if (!decision.approved) {
            console.log(chalk_1.default.red(`[REJECTED] ${decision.reason}`));
            return;
        }
        // 3. 能力执行 (Action 2: 严格 Capability 限制)
        try {
            const result = await Capabilities_1.Capabilities.execute(proposal);
            this.state.lastResult = result;
            console.log(chalk_1.default.green(`[SUCCESS] Turn ${this.state.turns} completed.`));
        }
        catch (e) {
            // Action 5: 治理靠记录，不靠防御性代码
            this.logAudit(proposal, e.message);
        }
    }
    async think(intent) {
        // 逻辑简化：根据意图路由到具体 Capability
        if (intent.includes('npm'))
            return { type: 'PROJECT', payload: { cmd: intent }, rationale: 'NPM management' };
        if (intent.includes('git') || intent.includes('ls'))
            return { type: 'SHELL', payload: { cmd: intent }, rationale: 'System operation' };
        return { type: 'KNOWLEDGE', payload: { query: intent }, rationale: 'Information retrieval' };
    }
    logAudit(proposal, error) {
        console.error(chalk_1.default.gray(`[AUDIT] Action ${proposal.type} failed: ${error}`));
    }
}
exports.Kernel = Kernel;
//# sourceMappingURL=Kernel.js.map