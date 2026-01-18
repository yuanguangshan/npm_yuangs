import { SyntaxHandler } from '../../dist/policy/syntaxHandler';
import { TokenEstimator } from '../../dist/policy/token/TokenEstimator';

jest.mock('fs/promises');
jest.mock('../../dist/policy/token/TokenEstimator');

/**
 * T7: Directory 估算准确性测试
 * 验证：目录扫描的准确性
 */
describe('SyntaxHandler - T7: Directory Estimation Accuracy', () => {
    test('目录估算应该匹配实际文件大小', async () => {
        jest.spyOn(require('fs/promises'), 'stat')
            .mockImplementation(async (path: string) => ({
                size: 500,
                isFile: () => true
            }));

        jest.spyOn(require('fs/promises'), 'readdir')
            .mockImplementation(async (path: string) => [
                { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
                { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
                { name: 'file3.txt', isDirectory: () => false, isFile: () => true }
            ]);

        const TokenEstimator = require('../../dist/policy/token/TokenEstimator').TokenEstimator;
        TokenEstimator.estimate.mockResolvedValue({
            totalBytes: 0,
            estimatedTokens: 0,
            warnings: [],
            blockingError: undefined
        });

        const tokens = SyntaxHandler.parse(['#test/dir']);
        const item = tokens[0];

        expect(item.type).toBe('dir');
        expect(item.id).toContain('test/dir');

        const result = await TokenEstimator.estimate([item]);

        expect(result.estimatedTokens).toBe(375);
    });
});
