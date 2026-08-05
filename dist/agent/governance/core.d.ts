import { ProposedAction } from '../state';
export interface PolicyRule {
    id: string;
    when: {
        type?: string;
        pattern?: string;
        max_per_minute?: number;
    };
    effect: 'allow' | 'deny' | 'require_approval';
    reason?: string;
}
export interface RiskEntry {
    ts: number;
    actionType: string;
}
export interface ProtectedPathConfig {
    /** 受保护路径模式列表（正则） */
    patterns: string[];
    /** 保护级别 */
    level: 'read-only' | 'require-approval' | 'deny';
    /** 说明 */
    reason?: string;
}
/**
 * 默认受保护路径配置
 *
 * 防止 AI agent 意外修改关键文件：
 *  - package.json / package-lock.json → 依赖管理需人工确认
 *  - .env / .env.* → 环境变量含敏感信息
 *  - *.pem / *.key → 证书和私钥
 *  - .git/ → Git 内部文件
 *  - node_modules/ → 依赖目录
 *  - tsconfig.json → TypeScript 配置需人工确认
 */
export declare const DEFAULT_PROTECTED_PATHS: ProtectedPathConfig[];
/**
 * 检查路径是否受保护
 */
export declare function checkProtectedPath(filePath: string, configs?: ProtectedPathConfig[]): {
    protected: boolean;
    level?: string;
    reason?: string;
};
export declare function evaluateProposal(action: ProposedAction, rules: PolicyRule[], ledger: RiskEntry[]): {
    effect: string;
    reason?: string;
};
