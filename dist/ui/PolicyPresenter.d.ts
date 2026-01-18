import { TokenPolicyResult, UserDecision } from '../policy/token/types';
/**
 * PolicyPresenter - CLI 交互层
 *
 * 负责：
 * - 呈现 warn/block 状态
 * - 获取用户决策
 * - 防止重复警告（suppressKey）
 */
export declare class PolicyPresenter {
    private static suppressCache;
    /**
     * 展现 Token 警告并获取用户决策
     */
    static presentWarning(result: TokenPolicyResult, suppressKey?: string): Promise<UserDecision>;
    /**
     * 展现 Token 阻断错误
     */
    static presentBlock(result: TokenPolicyResult): Promise<void>;
    /**
     * 渲染警告界面
     */
    private static renderWarning;
    /**
     * 渲染阻断界面
     */
    private static renderBlock;
    /**
     * 提示用户选择操作
     */
    private static promptForAction;
    /**
     * 解析用户选择
     */
    private static parseChoice;
    /**
     * 格式化占比
     */
    private static formatRatio;
    /**
     * 获取操作图标
     */
    private static getActionIcon;
    /**
     * 计算 suppress key
     */
    private static computeSuppressKey;
    /**
     * 清除抑制缓存（用于测试或会话重启）
     */
    static clearSuppressCache(): void;
}
