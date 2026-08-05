"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROTECTED_PATHS = void 0;
exports.checkProtectedPath = checkProtectedPath;
exports.evaluateProposal = evaluateProposal;
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
exports.DEFAULT_PROTECTED_PATHS = [
    { patterns: ['package\\.json$', 'package-lock\\.json$'], level: 'require-approval', reason: '依赖管理文件' },
    { patterns: ['\\.env$', '\\.env\\..*$'], level: 'deny', reason: '环境变量文件含敏感信息' },
    { patterns: ['\\.pem$', '\\.key$', '\\.pfx$', '\\.crt$'], level: 'deny', reason: '证书/私钥文件' },
    { patterns: ['^\\.git/', '/\\.git/'], level: 'deny', reason: 'Git 内部文件' },
    { patterns: ['^node_modules/', '/node_modules/'], level: 'deny', reason: '依赖目录不应直接修改' },
    { patterns: ['tsconfig\\.json$'], level: 'require-approval', reason: 'TypeScript 配置文件' },
    { patterns: ['\\.ssh/'], level: 'deny', reason: 'SSH 密钥目录' },
];
/**
 * 检查路径是否受保护
 */
function checkProtectedPath(filePath, configs = exports.DEFAULT_PROTECTED_PATHS) {
    for (const config of configs) {
        for (const pattern of config.patterns) {
            if (new RegExp(pattern).test(filePath)) {
                return { protected: true, level: config.level, reason: config.reason };
            }
        }
    }
    return { protected: false };
}
function evaluateProposal(action, rules, ledger) {
    const now = Date.now();
    // 内置低风险工具自动批准规则
    if (action.type === 'tool_call') {
        const toolName = action.payload.tool_name;
        const lowRiskTools = ['read_file', 'list_files', 'web_search', 'search_in_files'];
        if (lowRiskTools.includes(toolName)) {
            return { effect: 'allow', reason: `Built-in allow for low-risk tool: ${toolName}` };
        }
        // 写入类工具始终需要审批（即使有用户自定义规则也优先）
        const writeTools = ['write_file', 'append_file', 'delete_file', 'edit_file'];
        if (writeTools.includes(toolName)) {
            // 检查受保护路径
            const params = action.payload.parameters;
            const targetPath = (params?.path || params?.file || '');
            if (targetPath) {
                const protection = checkProtectedPath(targetPath);
                if (protection.protected) {
                    if (protection.level === 'deny') {
                        return { effect: 'deny', reason: `受保护路径: ${protection.reason}` };
                    }
                    return { effect: 'require_approval', reason: `受保护路径需审批: ${protection.reason}` };
                }
            }
            return { effect: 'require_approval', reason: `写入操作需确认: ${toolName}` };
        }
    }
    // 检查用户自定义规则
    for (const rule of rules) {
        const typeMatch = !rule.when.type || rule.when.type === action.type;
        const payloadStr = JSON.stringify(action.payload);
        const patternMatch = !rule.when.pattern || new RegExp(rule.when.pattern, 'i').test(payloadStr);
        if (typeMatch && patternMatch) {
            if (rule.when.max_per_minute) {
                const count = ledger.filter(e => e.ts > now - 60000 && e.actionType === action.type).length;
                if (count >= rule.when.max_per_minute)
                    return { effect: 'deny', reason: `Rate limit: ${rule.id}` };
            }
            return { effect: rule.effect, reason: rule.reason };
        }
    }
    return { effect: 'require_approval', reason: 'Default human review required' };
}
//# sourceMappingURL=core.js.map