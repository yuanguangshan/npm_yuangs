/**
 * 敏感信息脱敏
 * 用于审计落盘前清洗，防止 TOKEN/密码 明文持久化
 */

const REDACTION_RULES: Array<{ name: string; pattern: RegExp; replacement: string }> = [
    { name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9_\-]{20,}/g, replacement: '[REDACTED_API_KEY]' },
    { name: 'Github Token', pattern: /gh[oprs]_[a-zA-Z0-9]{20,}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
    { name: 'Bearer Token', pattern: /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi, replacement: 'Bearer [REDACTED_TOKEN]' },
    { name: 'Password', pattern: /(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*['"]?[^\s'"]+['"]?/gi, replacement: '$1=[REDACTED]' },
    { name: 'Private Key Block', pattern: /-----BEGIN [\s\S]*?PRIVATE KEY-----[\s\S]*?-----END [\s\S]*?PRIVATE KEY-----/g, replacement: '[REDACTED_PRIVATE_KEY]' },
    { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
];

export function redactSecrets(text: string): string {
    if (process.env.YUANGS_REDACT === 'off') return text;
    let result = text;
    for (const rule of REDACTION_RULES) {
        // 重置 lastIndex，避免 /g 全局正则状态残留
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(result)) {
            rule.pattern.lastIndex = 0;
            result = result.replace(rule.pattern, rule.replacement as any);
        }
    }
    return result;
}

export function shouldRedact(): boolean {
    return process.env.YUANGS_REDACT !== 'off';
}
