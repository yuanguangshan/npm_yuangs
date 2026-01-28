export declare enum SecurityIssueType {
    API_KEY = "api_key",
    EMAIL = "email",
    PHONE = "phone",
    TOKEN = "token",
    CREDENTIAL = "credential",
    SECRET = "secret",
    PASSWORD = "password"
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
export declare class SecurityScanner {
    private patterns;
    private whitelist;
    constructor(options?: SecurityScannerOptions);
    addToWhitelist(...items: string[]): void;
    isInWhitelist(match: string): boolean;
    scan(content: string, filePath: string): SecurityIssue[];
    scanMultiple(files: Map<string, string>): SecurityIssue[];
    redact(content: string): string;
    scanAndRedact(content: string, filePath: string): ScanResult;
    private getIssueDescription;
    private generateSummary;
}
export declare const defaultSecurityScanner: SecurityScanner;
