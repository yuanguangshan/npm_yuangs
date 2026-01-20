/**
 * yuangs Governance WASM Sandbox
 * 这里的代码在执行时与 Node.js 内存完全隔离
 */
/**
 * 核心裁决导出函数
 * @param proposal 提案字符串
 * @param rules 规则字符串（YAML 转换后的 JSON）
 * @param ledger 账本字符串
 */
export declare function evaluate(proposal: string, rules: string, ledger: string): string;
