"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Governance = void 0;
/**
 * [Action 4] Governance 作为一个黑箱函数
 */
class Governance {
    static async evaluate(proposal) {
        const dangerousCommands = ['rm -rf /', ':(){ :|:& };:', 'mv / /dev/null'];
        // 硬检查逻辑
        if (proposal.type === 'SHELL') {
            const cmd = proposal.payload.cmd.toLowerCase();
            if (dangerousCommands.some(c => cmd.includes(c))) {
                return { approved: false, reason: 'CRITICAL RISK: Dangerous command detected.' };
            }
        }
        if (proposal.type === 'PROJECT' && proposal.payload.cmd.includes('publish')) {
            // 示例：禁止在没有明确授权时发布
            return { approved: false, reason: 'POLICY: Human approval required for npm publish.' };
        }
        return { approved: true };
    }
}
exports.Governance = Governance;
//# sourceMappingURL=Governance.js.map