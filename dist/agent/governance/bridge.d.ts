export interface GovernanceProposal {
    id?: string;
    type?: string;
    payload?: unknown;
    [k: string]: unknown;
}
export interface GovernanceRule {
    id: string;
    effect: string;
    reason?: string;
    [k: string]: unknown;
}
export type GovernanceLedger = unknown[];
export interface GovernanceResult {
    effect: string;
    reason: string;
    [k: string]: unknown;
}
export declare class WasmGovernanceBridge {
    private static instance;
    static init(): Promise<boolean>;
    /** 测试用：重置单例，便于 afterEach 清理 */
    static resetForTesting(): void;
    static evaluate(proposal: unknown, rules: unknown, ledger: unknown): GovernanceResult;
}
