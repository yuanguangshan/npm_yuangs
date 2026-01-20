/**
 * [Action 4] Governance 作为一个黑箱函数
 */
export declare class Governance {
    static evaluate(proposal: any): Promise<{
        approved: boolean;
        reason?: string;
    }>;
}
