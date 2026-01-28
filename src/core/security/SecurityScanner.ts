export enum SecurityIssueType {
    API_KEY = 'api_key',
    EMAIL = 'email',
    PHONE = 'phone',
    TOKEN = 'token',
    CREDENTIAL = 'credential',
    SECRET = 'secret',
    PASSWORD = 'password',
}

export interface SecurityIssue {
    type: SecurityIssueType;
    match: string;
    file: string;
    line: number;
    description: string;
}

export interface ScanResult {
    issues: SecurityIssue[];
    summary: string;
    redactedContent: string;
}

export interface SecurityScannerOptions {
    patterns?: Record<SecurityIssueType, RegExp>;
    whitelist?: string[];
}

const DEFAULT_PATTERNS: Record<SecurityIssueType, RegExp> = {
    [SecurityIssueType.API_KEY]: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
    [SecurityIssueType.EMAIL]: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    [SecurityIssueType.PHONE]: /(?:\+?86)?1[3-9]\d{9}/g,
    [SecurityIssueType.TOKEN]: /(?:token|access[_-]?token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
    [SecurityIssueType.CREDENTIAL]: /(?:credential|password)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{8,})['"]?/gi,
    [SecurityIssueType.SECRET]: /(?:secret)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
    [SecurityIssueType.PASSWORD]: /(?:password)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{8,})['"]?/gi,
};

const DEFAULT_WHITELIST = [
    'example@example.com',
    'test@test.com',
    'user@user.com',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
];

export class SecurityScanner {
    private patterns: Record<SecurityIssueType, RegExp>;
    private whitelist: Set<string>;

    constructor(options: SecurityScannerOptions = {}) {
        this.patterns = options.patterns ?? DEFAULT_PATTERNS;
        this.whitelist = new Set(options.whitelist ?? DEFAULT_WHITELIST);
    }

    addToWhitelist(...items: string[]): void {
        items.forEach(item => this.whitelist.add(item));
    }

    isInWhitelist(match: string): boolean {
        return this.whitelist.has(match);
    }

    scan(content: string, filePath: string): SecurityIssue[] {
        const issues: SecurityIssue[] = [];
        const lines = content.split('\n');

        for (const [type, pattern] of Object.entries(this.patterns)) {
            pattern.lastIndex = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                pattern.lastIndex = 0;
                
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const matchedText = match[1] || match[0];
                    
                    if (this.isInWhitelist(matchedText)) {
                        continue;
                    }

                    issues.push({
                        type: type as SecurityIssueType,
                        match: matchedText,
                        file: filePath,
                        line: i + 1,
                        description: this.getIssueDescription(type as SecurityIssueType),
                    });
                }
            }
        }

        return issues;
    }

    scanMultiple(files: Map<string, string>): SecurityIssue[] {
        const allIssues: SecurityIssue[] = [];

        for (const [filePath, content] of files.entries()) {
            const issues = this.scan(content, filePath);
            allIssues.push(...issues);
        }

        return allIssues;
    }

    redact(content: string): string {
        let redacted = content;

        for (const pattern of Object.values(this.patterns)) {
            pattern.lastIndex = 0;
            redacted = redacted.replace(pattern, (match) => {
                if (this.isInWhitelist(match)) {
                    return match;
                }
                return match.replace(/[a-zA-Z0-9]/g, '*').substring(0, Math.min(match.length, 10));
            });
        }

        return redacted;
    }

    scanAndRedact(content: string, filePath: string): ScanResult {
        const issues = this.scan(content, filePath);
        const redactedContent = issues.length > 0 ? this.redact(content) : content;
        const summary = this.generateSummary(issues, filePath);

        return {
            issues,
            summary,
            redactedContent,
        };
    }

    private getIssueDescription(type: SecurityIssueType): string {
        switch (type) {
            case SecurityIssueType.API_KEY:
                return 'Potential API key detected';
            case SecurityIssueType.EMAIL:
                return 'Email address detected';
            case SecurityIssueType.PHONE:
                return 'Phone number detected';
            case SecurityIssueType.TOKEN:
                return 'Potential access token detected';
            case SecurityIssueType.CREDENTIAL:
                return 'Potential credential detected';
            case SecurityIssueType.SECRET:
                return 'Potential secret detected';
            case SecurityIssueType.PASSWORD:
                return 'Potential password detected';
        }
    }

    private generateSummary(issues: SecurityIssue[], filePath: string): string {
        if (issues.length === 0) {
            return `No security issues found in ${filePath}`;
        }

        const typeCount: Record<SecurityIssueType, number> = {} as any;
        for (const issue of issues) {
            typeCount[issue.type] = (typeCount[issue.type] || 0) + 1;
        }

        const typeSummary = Object.entries(typeCount)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');

        return `Found ${issues.length} security issue(s) in ${filePath}: ${typeSummary}`;
    }
}

export const defaultSecurityScanner = new SecurityScanner();
