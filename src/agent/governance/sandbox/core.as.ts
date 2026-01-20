/**
 * yuangs Governance WASM Sandbox
 * 这里的代码在执行时与 Node.js 内存完全隔离
 */

// 简单的辅助函数：检查字符串包含（WASM 内部实现）
function includes(source: string, target: string): boolean {
    return source.indexOf(target) != -1;
}

/**
 * 核心裁决导出函数
 * @param proposal 提案字符串
 * @param rules 规则字符串（YAML 转换后的 JSON）
 * @param ledger 账本字符串
 */
export function evaluate(proposal: string, rules: string, ledger: string): string {
    // 1. 暴力阻断：最底层的物理防线（即便外部逻辑被污染，这里也是死的）
    if (proposal.includes("rm -rf /") || proposal.includes("sudo rm")) {
        return '{"effect": "deny", "reason": "WASM_SANDBOX: 检测到毁灭性命令，强制阻断"}';
    }

    // 2. 检查速率（基于账本长度）
    // 假设我们不想让 AI 在短时间内连续提议超过 50 次
    if (ledger.length > 5000) { // 简单通过字符串长度模拟异常账本
        return '{"effect": "deny", "reason": "WASM_SANDBOX: 账本异常膨胀，可能遭受拒绝服务攻击"}';
    }

    // 3. 逻辑透传
    // 在实际生产中，我们会在这里解析 JSON rules。
    // 目前版本我们先确保物理链路打通。
    return '{"effect": "allow", "reason": "WASM_SANDBOX: 物理隔离层验证通过"}';
}
