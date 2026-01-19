"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceService = void 0;
const readline_1 = __importDefault(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
class GovernanceService {
    static async adjudicate(action, config = { autoApproveLowRisk: true }) {
        const { autoApproveLowRisk } = config;
        if (autoApproveLowRisk && action.riskLevel === 'low') {
            console.log(chalk_1.default.gray(`[Auto-approved] ${action.type}: low risk action`));
            return {
                status: 'approved',
                by: 'policy',
                timestamp: Date.now()
            };
        }
        const spinner = (0, ora_1.default)(chalk_1.default.yellow('⏸️  Waiting for approval...')).start();
        const answer = await this.askHuman(action);
        spinner.stop();
        if (answer.approve) {
            return {
                status: 'approved',
                by: 'human',
                timestamp: Date.now()
            };
        }
        else if (answer.modify) {
            return {
                status: 'modified',
                by: 'human',
                originalActionId: action.id,
                modifiedAction: answer.modifiedAction,
                modificationReason: answer.reason || 'User modified',
                timestamp: Date.now()
            };
        }
        else {
            return {
                status: 'rejected',
                by: 'human',
                reason: answer.reason || 'User rejected',
                timestamp: Date.now()
            };
        }
    }
    static askHuman(action) {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            this.printActionDetails(action);
            const prompt = `
${chalk_1.default.bold.yellow('Proceed?')} (y/n/s) 
${chalk_1.default.gray('y = yes, n = no, s = skip/modify')}: `;
            rl.question(prompt, (answer) => {
                const lower = answer.trim().toLowerCase();
                if (lower === 'y' || lower === 'yes') {
                    rl.close();
                    resolve({ approve: true, modify: false });
                }
                else if (lower === 's' || lower === 'skip' || lower === 'modify') {
                    rl.close();
                    resolve({
                        approve: false,
                        modify: true,
                        reason: 'User wants to modify',
                        modifiedAction: { ...action }
                    });
                }
                else {
                    rl.question(chalk_1.default.red('Reason for rejection: '), (reason) => {
                        rl.close();
                        resolve({
                            approve: false,
                            modify: false,
                            reason: reason || 'User rejected'
                        });
                    });
                }
            });
        });
    }
    static printActionDetails(action) {
        const riskColor = {
            low: chalk_1.default.green,
            medium: chalk_1.default.yellow,
            high: chalk_1.default.red
        };
        console.log(`
${chalk_1.default.bold.cyan('═'.repeat(60))}
${chalk_1.default.bold.blue('📋 Action Proposed')}
${chalk_1.default.bold.cyan('═'.repeat(60))}
${chalk_1.default.white('Type:')} ${chalk_1.default.bold(action.type)}
${chalk_1.default.white('ID:')} ${action.id}
${chalk_1.default.white('Risk:')} ${riskColor[action.riskLevel](action.riskLevel.toUpperCase())}

${chalk_1.default.bold('Payload:')}
${chalk_1.default.gray(JSON.stringify(action.payload, null, 2))}

${chalk_1.default.bold('Reasoning:')}
${chalk_1.default.gray(action.reasoning)}
${chalk_1.default.bold.cyan('═'.repeat(60))}
`);
    }
    static evaluateRisk(action) {
        const { type, payload } = action;
        if (type === 'tool_call') {
            const toolName = payload.tool_name;
            const lowRiskTools = ['read_file', 'list_files', 'web_search'];
            if (lowRiskTools.includes(toolName)) {
                return 'low';
            }
            const mediumRiskTools = ['write_file', 'shell'];
            if (mediumRiskTools.includes(toolName)) {
                const cmd = payload.parameters?.command || payload.command || '';
                if (this.containsDangerousCommand(cmd)) {
                    return 'high';
                }
                return 'medium';
            }
            return 'medium';
        }
        if (type === 'shell_cmd') {
            const cmd = payload.command || '';
            if (this.containsDangerousCommand(cmd)) {
                return 'high';
            }
            return 'medium';
        }
        if (type === 'code_diff') {
            return 'medium';
        }
        return 'low';
    }
    static containsDangerousCommand(cmd) {
        const dangerousPatterns = [
            /rm\s+-rf\s+\//,
            /rm\s+-rf\s+~/,
            />\s*\/dev\/null/,
            /dd\s+if=/,
            /mkfs/,
            /format/,
            /sudo\s+rm/
        ];
        return dangerousPatterns.some(pattern => pattern.test(cmd));
    }
}
exports.GovernanceService = GovernanceService;
//# sourceMappingURL=governance.js.map