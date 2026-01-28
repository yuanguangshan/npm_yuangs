import {
    SecurityScanner,
    SecurityIssueType,
} from '../../../core/security/SecurityScanner';

describe('SecurityScanner', () => {
    let scanner: SecurityScanner;

    beforeEach(() => {
        scanner = new SecurityScanner();
    });

    describe('add to whitelist', () => {
        it('should add items to whitelist', () => {
            const testItem = 'test@example.com';
            scanner.addToWhitelist(testItem);
            
            expect(scanner['whitelist'].has(testItem)).toBe(true);
        });

        it('should add multiple items to whitelist', () => {
            scanner.addToWhitelist('test1@example.com', 'test2@example.com', 'api-key-123');
            
            expect(scanner['whitelist'].has('test1@example.com')).toBe(true);
            expect(scanner['whitelist'].has('test2@example.com')).toBe(true);
            expect(scanner['whitelist'].has('api-key-123')).toBe(true);
        });
    });

    describe('isInWhitelist', () => {
        it('should check if item is in default whitelist', () => {
            expect(scanner.isInWhitelist('example@example.com')).toBe(true);
            expect(scanner.isInWhitelist('localhost')).toBe(true);
        });

        it('should check if item is in custom whitelist', () => {
            scanner.addToWhitelist('custom@test.com');
            expect(scanner.isInWhitelist('custom@test.com')).toBe(true);
        });

        it('should return false for items not in whitelist', () => {
            expect(scanner.isInWhitelist('real@example.com')).toBe(false);
            expect(scanner.isInWhitelist('real-api-key-1234567890')).toBe(false);
        });
    });

    describe('scan', () => {
        it('should detect API keys', () => {
            const content = 'const apiKey = "sk-12345678901234567890";';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(1);
            expect(issues[0].type).toBe(SecurityIssueType.API_KEY);
            expect(issues[0].file).toBe('test.ts');
        });

        it('should detect email addresses', () => {
            const content = 'const email = "user@example.com";';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(1);
            expect(issues[0].type).toBe(SecurityIssueType.EMAIL);
            expect(issues[0].match).toContain('user@example.com');
        });

        it('should detect phone numbers', () => {
            const content = 'const phone = "13812345678";';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(1);
            expect(issues[0].type).toBe(SecurityIssueType.PHONE);
        });

        it('should detect tokens', () => {
            const content = 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(1);
            expect(issues[0].type).toBe(SecurityIssueType.TOKEN);
        });

        it('should detect multiple issues in same content', () => {
            const content = `
                const apiKey = "sk-12345678901234567890";
                const email = "user@example.com";
                const token = "ghp_123456789012345678901234567890123456";
            `;
            const issues = scanner.scan(content, 'test.ts');

            expect(issues.length).toBeGreaterThanOrEqual(3);
        });

        it('should ignore whitelisted items', () => {
            const content = 'const email = "example@example.com";';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(0);
        });

        it('should track line numbers correctly', () => {
            const content = `
line 1
line 2
const email = "user@example.com";
line 4
            `.trim();

            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(1);
            expect(issues[0].line).toBe(3);
        });

        it('should handle empty content', () => {
            const issues = scanner.scan('', 'test.ts');
            expect(issues).toHaveLength(0);
        });

        it('should handle content without issues', () => {
            const content = 'const x = 10; const y = 20;';
            const issues = scanner.scan(content, 'test.ts');
            expect(issues).toHaveLength(0);
        });

        it('should detect credentials', () => {
            const content = 'credential: admin12345678';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues.length).toBeGreaterThan(0);
            expect(issues[0].type).toBe(SecurityIssueType.CREDENTIAL);
        });

        it('should detect secrets', () => {
            const content = 'secret: "my-secret-key-1234567890123456"';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues.length).toBeGreaterThan(0);
            expect(issues[0].type).toBe(SecurityIssueType.SECRET);
        });

        it('should detect passwords', () => {
            const content = 'password: "mypassword123"';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues.length).toBeGreaterThan(0);
            expect([SecurityIssueType.PASSWORD, SecurityIssueType.CREDENTIAL]).toContain(issues[0].type);
        });
    });

    describe('scanMultiple', () => {
        it('should scan multiple files', () => {
            const files = new Map<string, string>([
                ['file1.ts', 'const apiKey = "sk-12345678901234567890";'],
                ['file2.ts', 'const email = "user@example.com";'],
            ]);

            const issues = scanner.scanMultiple(files);

            expect(issues.length).toBeGreaterThanOrEqual(2);
            expect(issues.some(i => i.file === 'file1.ts')).toBe(true);
            expect(issues.some(i => i.file === 'file2.ts')).toBe(true);
        });

        it('should handle empty file map', () => {
            const files = new Map<string, string>();
            const issues = scanner.scanMultiple(files);
            expect(issues).toHaveLength(0);
        });

        it('should aggregate issues from all files', () => {
            const files = new Map<string, string>([
                ['file1.ts', 'const apiKey = "sk-12345678901234567890"; const email = "user@example.com";'],
                ['file2.ts', 'const token = "ghp_123456789012345678901234567890123456";'],
            ]);

            const issues = scanner.scanMultiple(files);

            expect(issues.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('redact', () => {
        it('should redact sensitive information', () => {
            const content = 'const apiKey = "sk-12345678901234567890";';
            const redacted = scanner.redact(content);

            expect(redacted).toContain('***');
            expect(redacted).not.toContain('sk-12345678901234567890');
        });

        it('should preserve whitelisted items', () => {
            const content = 'const email = "example@example.com";';
            const redacted = scanner.redact(content);

            expect(redacted).toContain('example@example.com');
        });

        it('should handle content without sensitive info', () => {
            const content = 'const x = 10;';
            const redacted = scanner.redact(content);
            expect(redacted).toBe(content);
        });

        it('should redact multiple types of sensitive info', () => {
            const content = 'apiKey = "sk-12345678901234567890"; email = "user@example.com";';
            const redacted = scanner.redact(content);

            expect(redacted).toContain('***');
            expect(redacted).not.toContain('sk-12345678901234567890');
            expect(redacted).not.toContain('user@example.com');
        });

        it('should limit redacted string length', () => {
            const content = 'apiKey = "sk-1234567890123456789012345678901234567890";';
            const redacted = scanner.redact(content);

            expect(redacted).toContain('***');
            const asterisks = redacted.match(/\*/g);
            expect(asterisks?.length).toBeLessThanOrEqual(10);
        });
    });

    describe('scanAndRedact', () => {
        it('should scan and return redacted content', () => {
            const content = 'const apiKey = "sk-12345678901234567890";';
            const result = scanner.scanAndRedact(content, 'test.ts');

            expect(result.issues).toHaveLength(1);
            expect(result.redactedContent).toContain('***');
            expect(result.summary).toContain('security issue');
        });

        it('should return summary when no issues found', () => {
            const content = 'const x = 10;';
            const result = scanner.scanAndRedact(content, 'test.ts');

            expect(result.issues).toHaveLength(0);
            expect(result.summary).toContain('No security issues');
        });

        it('should count issues by type', () => {
            const content = `
                const apiKey = "sk-12345678901234567890";
                const token = "ghp_123456789012345678901234567890123456";
            `;
            const result = scanner.scanAndRedact(content, 'test.ts');

            expect(result.issues).toHaveLength(2);
            expect(result.summary).toContain('api_key');
            expect(result.summary).toContain('token');
        });

        it('should not modify content when no issues', () => {
            const content = 'const x = 10;';
            const result = scanner.scanAndRedact(content, 'test.ts');

            expect(result.redactedContent).toBe(content);
        });
    });

    describe('custom patterns', () => {
        it('should use custom patterns when provided', () => {
            const customPatterns = {
                [SecurityIssueType.API_KEY]: /custom-api-regex/g,
                [SecurityIssueType.EMAIL]: /custom-email-regex/g,
                [SecurityIssueType.PHONE]: /custom-phone-regex/g,
                [SecurityIssueType.TOKEN]: /custom-token-regex/g,
                [SecurityIssueType.CREDENTIAL]: /custom-credential-regex/g,
                [SecurityIssueType.SECRET]: /custom-secret-regex/g,
                [SecurityIssueType.PASSWORD]: /custom-password-regex/g,
            };

            const customScanner = new SecurityScanner({ patterns: customPatterns });
            const content = 'const email = "user@example.com";';
            const issues = customScanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(0);
        });

        it('should use custom whitelist when provided', () => {
            const customWhitelist = ['custom@test.com'];
            const customScanner = new SecurityScanner({ whitelist: customWhitelist });

            expect(customScanner.isInWhitelist('custom@test.com')).toBe(true);
            expect(customScanner.isInWhitelist('example@example.com')).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should handle multiline content with issues', () => {
            const content = `
                const config = {
                    apiKey: "sk-12345678901234567890",
                    email: "user@example.com",
                };
            `;
            const issues = scanner.scan(content, 'test.ts');

            expect(issues.length).toBeGreaterThanOrEqual(2);
        });

        it('should handle content with regex special characters', () => {
            const content = 'apiKey = "sk-1234567890abcdef1234567890";';
            const issues = scanner.scan(content, 'test.ts');

            expect(issues).toHaveLength(1);
        });

        it('should handle very long lines', () => {
            const longContent = 'const config = ' + 'a'.repeat(10000) + ' apiKey = "sk-1234567890abcdef1234567890";';
            const issues = scanner.scan(longContent, 'test.ts');

            expect(issues).toHaveLength(1);
        });
    });
});
