import chalk from 'chalk';
import { createInterface } from 'readline';
import { TokenPolicyResult, UserDecision } from '../policy/token/types';

/**
 * PolicyPresenter - CLI 交互层
 *
 * 负责：
 * - 呈现 warn/block 状态
 * - 获取用户决策
 * - 防止重复警告（suppressKey）
 */
// @ts-ignore - Node.js readline type compatibility
export class PolicyPresenter {
    private static suppressCache = new Map<string, boolean>();

    /**
     * 展现 Token 警告并获取用户决策
     */
    static async presentWarning(
        result: TokenPolicyResult,
        suppressKey?: string
    ): Promise<UserDecision> {
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
    static async presentBlock(result: TokenPolicyResult): Promise<void> {
        this.renderBlock(result);

        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        await new Promise<void>(resolve => {
            rl.question(chalk.gray('\n按 Enter 退出...'), () => resolve());
        });

        rl.close();
    }

    /**
     * 渲染警告界面
     */
    private static renderWarning(result: TokenPolicyResult): void {
        console.log('\n');
        console.log(chalk.bold.yellow('⚠️  Token 预算预警'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`预估 Token: ${chalk.bold(result.estimatedTokens.toLocaleString())}`);
        console.log(`模型上限: ${chalk.bold(result.limit.toLocaleString())}`);
        console.log(`占用率: ${this.formatRatio(result.ratio)}`);

        if (result.warnings && result.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  警告:'));
            result.warnings.forEach(w => {
                console.log(chalk.gray(`  • ${w}`));
            });
        }

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.cyan('\n💡 建议操作:'));
        result.actions?.forEach((action, i) => {
            const icon = this.getActionIcon(action);
            const label = chalk.bold(action.label);
            const desc = chalk.gray(action.desc);

            if (action.type === 'auto_sample_pipe' && result.estimatedTokens > 0) {
                const savedTokens = Math.round(result.estimatedTokens * 0.4);
                console.log(`  ${icon} ${i + 1}. ${label} ${desc} ${chalk.green(`(预估节省 ~${savedTokens} tokens)`)}`);
            } else {
                console.log(`  ${icon} ${i + 1}. ${label} ${desc}`);
            }
        });
        console.log();
    }

    /**
     * 渲染阻断界面
     */
    private static renderBlock(result: TokenPolicyResult): void {
        console.log('\n');
        console.log(chalk.bold.red('⛔  Token 超限阻断'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`预估 Token: ${chalk.bold.red(result.estimatedTokens.toLocaleString())}`);
        console.log(`模型上限: ${chalk.bold(result.limit.toLocaleString())}`);
        console.log(`占用率: ${this.formatRatio(result.ratio)}`);

        if (result.warnings && result.warnings.length > 0) {
            console.log(chalk.red('\n❌ 阻断原因:'));
            result.warnings.forEach(w => {
                console.log(chalk.gray(`  • ${w}`));
            });
        }

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.yellow('\n💡 可选操作:'));
        result.actions?.forEach((action, i) => {
            const icon = this.getActionIcon(action);
            const label = chalk.bold(action.label);
            const desc = chalk.gray(action.desc);
            console.log(`  ${icon} ${i + 1}. ${label} ${desc}`);
        });
        console.log();
    }

    /**
     * 提示用户选择操作
     */
    private static async promptForAction(
        result: TokenPolicyResult
    ): Promise<UserDecision> {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const choices = result.actions || [];

        const answer = await new Promise<string>(resolve => {
            rl.question(
                chalk.cyan('请选择操作序号 (默认 1): '),
                (input) => resolve((input || '1').trim())
            );
        });

        rl.close();

        return this.parseChoice(answer, choices);
    }

    /**
     * 解析用户选择
     */
    private static parseChoice(
        answer: string,
        actions: any[]
    ): UserDecision {
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
    private static formatRatio(ratio: number): string {
        const percentage = (ratio * 100).toFixed(1);
        const color = ratio > 1.0
            ? chalk.red
            : ratio > 0.8
                ? chalk.yellow
                : chalk.green;

        return color(`${percentage}%`);
    }

    /**
     * 获取操作图标
     */
    private static getActionIcon(action: any): string {
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
    private static computeSuppressKey(result: TokenPolicyResult): string {
        return `${result.estimatedTokens}:${result.limit}`;
    }

    /**
     * 清除抑制缓存（用于测试或会话重启）
     */
    static clearSuppressCache(): void {
        this.suppressCache.clear();
    }
}
