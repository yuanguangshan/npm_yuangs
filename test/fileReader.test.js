const fs = require('fs');
const path = require('path');
const os = require('os');
const {
    parseFilePathsFromLsOutput,
    readFilesContent,
    buildPromptWithFileContent
} = require('../dist/core/fileReader');

jest.mock('fs');
jest.mock('path');

describe('Module: FileReader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        path.resolve.mockImplementation((p) => p);
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ isFile: () => true });
    });

    describe('parseFilePathsFromLsOutput', () => {
        test('should parse simple ls output', () => {
            const output = 'file1.txt\nfile2.ts\nfile3.js';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts', 'file3.js']);
        });

        test('should parse ls -l output', () => {
            const output = '-rw-r--r-- 1 user group 123 Jan 1 file1.txt\n-rw-r--r-- 1 user group 456 Jan 2 file2.ts';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts']);
        });

        test('should skip . and .. directories', () => {
            const output = '.\n..\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should skip permission strings', () => {
            const output = '-rw-r--r--\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should handle empty output', () => {
            const output = '';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual([]);
        });
    });

    describe('readFilesContent', () => {
        test('should read multiple files', () => {
            const mockContent = { 'file1.txt': 'content1', 'file2.ts': 'content2' };
            fs.readFileSync.mockImplementation((filePath) => mockContent[filePath] || '');

            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(2);
            expect(contentMap.get('file1.txt')).toBe('content1');
            expect(contentMap.get('file2.ts')).toBe('content2');
        });

        test('should skip directories', () => {
            fs.statSync.mockReturnValue({ isFile: () => false });

            const filePaths = ['file.txt', 'directory'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        test('should skip non-existent files', () => {
            fs.existsSync.mockImplementation((p) => p === 'exists.txt');

            const filePaths = ['exists.txt', 'notexists.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(1);
            expect(contentMap.has('exists.txt')).toBe(true);
            expect(contentMap.has('notexists.txt')).toBe(false);
        });

        test('should handle read errors gracefully', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const filePaths = ['error.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
        });

        test('should return empty map for empty input', () => {
            const contentMap = readFilesContent([]);
            expect(contentMap.size).toBe(0);
        });
    });

    describe('buildPromptWithFileContent', () => {
        test('should build prompt with all content', () => {
            const originalOutput = 'file1.txt\nfile2.ts';
            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = new Map([
                ['file1.txt', 'content1'],
                ['file2.ts', 'content2']
            ]);
            const question = 'Analyze these files';

            const prompt = buildPromptWithFileContent(originalOutput, filePaths, contentMap, question);

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('file1.txt\nfile2.ts');
            expect(prompt).toContain('## 文件内容');
            expect(prompt).toContain('### file1.txt');
            expect(prompt).toContain('content1');
            expect(prompt).toContain('### file2.ts');
            expect(prompt).toContain('content2');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).toContain('Analyze these files');
        });

        test('should truncate content longer than 5000 chars', () => {
            const longContent = 'x'.repeat(6000);
            const contentMap = new Map([['long.txt', longContent]]);
            const prompt = buildPromptWithFileContent('long.txt', ['long.txt'], contentMap);

            expect(prompt).toContain('... (内容过长已截断)');
            expect(prompt.length).toBeLessThan(longContent.length + 1000);
        });

        test('should use default question when not provided', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map([['file.txt', 'content']]));

            expect(prompt).toContain('请分析以上文件列表和文件内容');
        });

        test('should work with empty content map', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map(), 'Analyze');

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });

        test('should work with empty file paths', () => {
            const prompt = buildPromptWithFileContent('', [], new Map(), 'Analyze');

            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });
    });
});
