"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyPresenter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = require("readline");
/**
 * PolicyPresenter - CLI 交互层
 *
 * 负责：
 * - 呈现 warn/block 状态
 * - 获取用户决策
 * - 防止重复警告（suppressKey）
 */
// @ts-ignore - Node.js readline type compatibility
class PolicyPresenter {
    static suppressCache = new Map();
    /**
     * 展现 Token 警告并获取用户决策
     */
    static async presentWarning(result, suppressKey) {
        const key = suppressKey || this.computeSuppressKey(result);
        if (suppressKey && this.suppressCache.get(key)) {
            return { type: 'continue' };
        }
        this.renderWarning(result);
        const choice = await this.promptForAction(result);
        if (choice.type === 'continue' && suppressKey) {
            this.suppressCache.set(key, true);
        }
        return choice;
    }
    /**
     * 展现 Token 阻断错误
     */
    static async presentBlock(result) {
        this.renderBlock(result);
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout
        });
        await new Promise(resolve => {
            rl.question(chalk_1.default.gray('\n按 Enter 退出...'), () => resolve());
        });
        rl.close();
    }
    /**
     * 渲染警告界面
     */
    static renderWarning(result) {
        console.log('\n');
        console.log(chalk_1.default.bold.yellow('⚠️  Token 预算预警'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(`预估 Token: ${chalk_1.default.bold(result.estimatedTokens.toLocaleString())}`);
        console.log(`模型上限: ${chalk_1.default.bold(result.limit.toLocaleString())}`);
        console.log(`占用率: ${this.formatRatio(result.ratio)}`);
        if (result.warnings && result.warnings.length > 0) {
            console.log(chalk_1.default.yellow('\n⚠️  警告:'));
            result.warnings.forEach(w => {
                console.log(chalk_1.default.gray(`  • ${w}`));
            });
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('\n💡 建议操作:'));
        result.actions?.forEach((action, i) => {
            const icon = this.getActionIcon(action);
            const label = chalk_1.default.bold(action.label);
            const desc = chalk_1.default.gray(action.desc);
            if (action.type === 'auto_sample_pipe' && result.estimatedTokens > 0) {
                const savedTokens = Math.round(result.estimatedTokens * 0.4);
                console.log(`  ${icon} ${i + 1}. ${label} ${desc} ${chalk_1.default.green(`(预估节省 ~${savedTokens} tokens)`)}`);
            }
            else {
                console.log(`  ${icon} ${i + 1}. ${label} ${desc}`);
            }
        });
        console.log();
    }
    /**
     * 渲染阻断界面
     */
    static renderBlock(result) {
        console.log('\n');
        console.log(chalk_1.default.bold.red('⛔  Token 超限阻断'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(`预估 Token: ${chalk_1.default.bold.red(result.estimatedTokens.toLocaleString())}`);
        console.log(`模型上限: ${chalk_1.default.bold(result.limit.toLocaleString())}`);
        console.log(`占用率: ${this.formatRatio(result.ratio)}`);
        if (result.warnings && result.warnings.length > 0) {
            console.log(chalk_1.default.red('\n❌ 阻断原因:'));
            result.warnings.forEach(w => {
                console.log(chalk_1.default.gray(`  • ${w}`));
            });
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.yellow('\n💡 可选操作:'));
        result.actions?.forEach((action, i) => {
            const icon = this.getActionIcon(action);
            const label = chalk_1.default.bold(action.label);
            const desc = chalk_1.default.gray(action.desc);
            console.log(`  ${icon} ${i + 1}. ${label} ${desc}`);
        });
        console.log();
    }
    /**
     * 提示用户选择操作
     */
    static async promptForAction(result) {
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout
        });
        const choices = result.actions || [];
        const answer = await new Promise(resolve => {
            rl.question(chalk_1.default.cyan('请选择操作序号 (默认 1): '), (input) => resolve((input || '1').trim()));
        });
        rl.close();
        return this.parseChoice(answer, choices);
    }
    /**
     * 解析用户选择
     */
    static parseChoice(answer, actions) {
        const choice = parseInt(answer);
        if (isNaN(choice) || choice < 1 || choice > actions.length) {
            return { type: 'continue' };
        }
        const action = actions[choice - 1];
        switch (action.type) {
            case 'confirm_continue':
                return { type: 'continue' };
            case 'auto_sample_pipe':
                return {
                    type: 'sample',
                    strategy: action.strategy
                };
            case 'suggest_model_switch':
                return {
                    type: 'switch_model',
                    targetModel: action.targetModel
                };
            case 'abort':
                return { type: 'abort' };
            default:
                return { type: 'continue' };
        }
    }
    /**
     * 格式化占比
     */
    static formatRatio(ratio) {
        const percentage = (ratio * 100).toFixed(1);
        const color = ratio > 1.0
            ? chalk_1.default.red
            : ratio > 0.8
                ? chalk_1.default.yellow
                : chalk_1.default.green;
        return color(`${percentage}%`);
    }
    /**
     * 获取操作图标
     */
    static getActionIcon(action) {
        switch (action.type) {
            case 'confirm_continue':
                return '✓';
            case 'auto_sample_pipe':
                return '✂';
            case 'suggest_model_switch':
                return '🔄';
            case 'abort':
                return '✗';
            default:
                return '•';
        }
    }
    /**
     * 计算 suppress key
     */
    static computeSuppressKey(result) {
        return `${result.estimatedTokens}:${result.limit}`;
    }
    /**
     * 清除抑制缓存（用于测试或会话重启）
     */
    static clearSuppressCache() {
        this.suppressCache.clear();
    }
}
exports.PolicyPresenter = PolicyPresenter;
//# sourceMappingURL=PolicyPresenter.js.map