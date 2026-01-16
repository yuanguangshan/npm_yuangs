const { assessRisk } = require('../dist/core/risk');

describe('Risk Assessment', () => {
        test('should detect rm command as high risk', () => {
            expect(assessRisk('rm -rf file.txt', 'low')).toBe('high');
            expect(assessRisk('rm file.txt', 'low')).toBe('high');
        });

        test('should detect sudo command as high risk', () => {
            expect(assessRisk('sudo apt install package', 'low')).toBe('high');
            expect(assessRisk('SUDO apt install', 'low')).toBe('high');
        });

        test('should detect mv command as high risk', () => {
            expect(assessRisk('mv file1 file2', 'low')).toBe('high');
        });

        test('should detect dd command as high risk', () => {
            expect(assessRisk('dd if=/dev/zero of=file', 'low')).toBe('high');
        });

        test('should detect chmod command as high risk', () => {
            expect(assessRisk('chmod 777 file.txt', 'low')).toBe('high');
        });

        test('should detect chown command as high risk', () => {
            expect(assessRisk('chown user:group file', 'low')).toBe('high');
        });

        test('should detect mkfs command as high risk', () => {
            expect(assessRisk('mkfs.ext4 /dev/sda1', 'low')).toBe('high');
        });

        test('should detect fork bomb pattern as high risk', () => {
            expect(assessRisk(':(){ :|:& };:', 'low')).toBe('high');
        });

        test('should detect redirecting to /dev as high risk', () => {
            expect(assessRisk('echo "data" > /dev/sda', 'low')).toBe('high');
        });

        test('should return ai risk if no high risk patterns found', () => {
            expect(assessRisk('ls -la', 'low')).toBe('low');
            expect(assessRisk('cat file.txt', 'medium')).toBe('medium');
            expect(assessRisk('grep "pattern" file', 'high')).toBe('high');
        });

        test('should override ai risk if high risk pattern detected', () => {
            expect(assessRisk('rm -rf file', 'low')).toBe('high');
            expect(assessRisk('sudo ls', 'medium')).toBe('high');
            expect(assessRisk('chmod 777 file', 'medium')).toBe('high');
        });

        test('should be case insensitive for dangerous commands', () => {
            expect(assessRisk('RM file.txt', 'low')).toBe('high');
            expect(assessRisk('SUDO cmd', 'low')).toBe('high');
            expect(assessRisk('CHMOD 777 file', 'low')).toBe('high');
        });
});