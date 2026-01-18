"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTokenPolicy = void 0;
const TokenEstimator_1 = require("./TokenEstimator");
/**
 * DefaultTokenPolicy - 默认的 4 层 Token 治理策略
 *
 * 策略分层：
 * - 安全区 (≤70%): 直接放行
 * - 预警区 (70-80%): 放行但记录警告
 * - 警告区 (80-100%): 需要用户确认，提供多种解决方案
 * - 阻断区 (>100%): 强制阻断，必须修改内容或切换模型
 */
class DefaultTokenPolicy {
    /**
     * 评估 Token 使用并返回决策结果
     */
    async evaluate(input) {
        const { model, contextItems, mode } = input;
        // 1. 异步估算 Token 消耗（关键：此时文件尚未读入内存）
        const summary = await TokenEstimator_1.TokenEstimator.estimate(contextItems);
        const limit = model.contextWindow;
        const ratio = summary.estimatedTokens / limit;
        // 2. 检查阻塞错误（权限问题等）
        if (summary.blockingError) {
            return this.createBlockResult(summary.estimatedTokens, limit, ratio, summary.blockingError, model);
        }
        // 3. 执行 4 层策略分支
        if (ratio <= 0.7 && summary.warnings.length === 0) {
            return this.createOkResult(summary.estimatedTokens, limit, ratio);
        }
        if (ratio <= 0.8) {
            return this.createWarnResult(summary.estimatedTokens, limit, ratio, summary.warnings, false);
        }
        if (ratio <= 1.0) {
            return this.createWarnResult(summary.estimatedTokens, limit, ratio, summary.warnings, true);
        }
        // > 100% - 阻断
        return this.createBlockResult(summary.estimatedTokens, limit, ratio, undefined, model);
    }
    /**
     * OK 结果（安全区或预警区）
     */
    createOkResult(estimatedTokens, limit, ratio, message) {
        return {
            status: 'ok',
            estimatedTokens,
            limit,
            ratio,
            message
        };
    }
    /**
     * Warn 结果（警告区，提供多种解决方案）
     */
    createWarnResult(estimatedTokens, limit, ratio, warnings, isDanger) {
        const actions = [
            {
                type: 'confirm_continue',
                label: '继续执行',
                desc: '忽略风险按原样发送'
            }
        ];
        // 如果模型不支持长文本，提供切换选项
        if (isDanger) {
            actions.push({
                type: 'suggest_model_switch',
                label: '切换至长文本模型',
                desc: '使用支持更大上下文的模型',
                targetModel: 'gemini-2.0-flash-exp'
            });
        }
        // Pipe 模式专属：自动采样
        // 注意：这里只是声明能力，不实际采样
        actions.push({
            type: 'auto_sample_pipe',
            label: '自动采样',
            desc: '仅保留头部和尾部信息',
            strategy: 'head_tail'
        });
        actions.push({
            type: 'abort',
            label: '终止任务',
            desc: '退出当前操作'
        });
        const baseMessage = isDanger
            ? `⚠️ 上下文占用率 ${(ratio * 100).toFixed(1)}%，接近模型限制。`
            : `ℹ️  上下文占用率 ${(ratio * 100).toFixed(1)}%。`;
        const warningMessages = warnings.length > 0
            ? warnings.map(w => `  - ${w.message}`).join('\n')
            : '';
        return {
            status: 'warn',
            estimatedTokens,
            limit,
            ratio,
            message: `${baseMessage}${warningMessages ? '\n\n⚠️ 警告:\n' + warningMessages : ''}`,
            actions,
            warnings: warnings.map(w => w.message)
        };
    }
    /**
     * Block 结果（阻断区）
     */
    createBlockResult(estimatedTokens, limit, ratio, blockingError, model) {
        const errorMessage = blockingError
            ? `⛔ ${blockingError}`
            : `⛔ 上下文超限 (${(ratio * 100).toFixed(1)}% / 100%)`;
        const actions = [];
        // 如果是因为超限，提供模型切换选项
        if (!blockingError && model.longContextCapable === false) {
            actions.push({
                type: 'suggest_model_switch',
                label: '切换至长文本模型',
                desc: '使用支持更大上下文的模型',
                targetModel: 'gemini-2.0-flash-exp'
            });
        }
        actions.push({
            type: 'abort',
            label: '终止任务',
            desc: '退出当前操作'
        });
        return {
            status: 'block',
            estimatedTokens,
            limit,
            ratio,
            message: `${errorMessage}\n\n必须缩减内容或切换模型才能继续。`,
            actions,
            warnings: blockingError ? [blockingError] : undefined
        };
    }
}
exports.DefaultTokenPolicy = DefaultTokenPolicy;
//# sourceMappingURL=DefaultTokenPolicy.js.map