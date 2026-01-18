import { TokenPolicy, TokenPolicyInput, TokenPolicyResult } from './types';
/**
 * DefaultTokenPolicy - 默认的 4 层 Token 治理策略
 *
 * 策略分层：
 * - 安全区 (≤70%): 直接放行
 * - 预警区 (70-80%): 放行但记录警告
 * - 警告区 (80-100%): 需要用户确认，提供多种解决方案
 * - 阻断区 (>100%): 强制阻断，必须修改内容或切换模型
 */
export declare class DefaultTokenPolicy implements TokenPolicy {
    /**
     * 评估 Token 使用并返回决策结果
     */
    evaluate(input: TokenPolicyInput): Promise<TokenPolicyResult>;
    /**
     * OK 结果（安全区或预警区）
     */
    private createOkResult;
    /**
     * Warn 结果（警告区，提供多种解决方案）
     */
    private createWarnResult;
    /**
     * Block 结果（阻断区）
     */
    private createBlockResult;
}
