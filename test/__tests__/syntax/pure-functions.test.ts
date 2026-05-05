import { tokenizeWithQuotes, resolveFilePathsAndQuestion, parseCatSpec } from '../../../src/utils/syntax/resolver';
import { getLanguageByPath } from '../../../src/utils/syntax/language-mapper';

describe('syntax/resolver.ts - pure functions', () => {
    describe('tokenizeWithQuotes', () => {
        it('should split by space and commas and trim tokens', () => {
            const result = tokenizeWithQuotes('  file1 , file2   file3  ');
            expect(result.tokens).toEqual(['file1', 'file2', 'file3']);
            expect(result.isQuoted).toEqual([false, false, false]);
        });

        it('should handle quoted paths with spaces and internal quotes', () => {
            const result = tokenizeWithQuotes('"my file.ts", \'other file.js\'');
            expect(result.tokens).toEqual(['my file.ts', 'other file.js']);
            expect(result.isQuoted).toEqual([true, true]);
        });

        it('should handle escaped characters', () => {
            const result = tokenizeWithQuotes('file\\ with\\ space.ts, "quoted\\"quote.ts"');
            expect(result.tokens).toEqual(['file with space.ts', 'quoted"quote.ts']);
            expect(result.isQuoted).toEqual([false, true]);
        });

        it('should handle unclosed quotes as path to end', () => {
            const result = tokenizeWithQuotes('"unclosed file.ts');
            expect(result.tokens).toEqual(['unclosed file.ts']);
            expect(result.isQuoted).toEqual([true]);
        });

        it('should handle empty input', () => {
            const result = tokenizeWithQuotes('');
            expect(result.tokens).toEqual([]);
            expect(result.isQuoted).toEqual([]);
        });

        it('should handle Chinese commas', () => {
            const result = tokenizeWithQuotes('文件一，文件二，文件三');
            expect(result.tokens).toEqual(['文件一', '文件二', '文件三']);
        });
    });

    describe('parseCatSpec', () => {
        it('should parse plain index', () => {
            const result = parseCatSpec('5');
            expect(result).toEqual({ index: 5, startLine: null, endLine: null });
        });

        it('should parse index with start line', () => {
            const result = parseCatSpec('3:10');
            expect(result).toEqual({ index: 3, startLine: 10, endLine: null });
        });

        it('should parse index with line range', () => {
            const result = parseCatSpec('1:10-20');
            expect(result).toEqual({ index: 1, startLine: 10, endLine: 20 });
        });

        it('should parse index with range to end (no end)', () => {
            const result = parseCatSpec('2:50');
            expect(result).toEqual({ index: 2, startLine: 50, endLine: null });
        });

        it('should reject invalid format', () => {
            const result = parseCatSpec('abc');
            expect(result.error).toBeDefined();
            expect(result.index).toBeNull();
        });

        it('should reject non-numeric index', () => {
            const result = parseCatSpec('abc:10-20');
            expect(result.error).toBeDefined();
        });
    });
});

describe('syntax/language-mapper.ts', () => {
    it('should recognize TypeScript files', () => {
        expect(getLanguageByPath('src/index.ts')).toBe('typescript');
        expect(getLanguageByPath('src/Component.tsx')).toBe('typescript');
    });

    it('should recognize JavaScript files', () => {
        expect(getLanguageByPath('app.js')).toBe('javascript');
        expect(getLanguageByPath('app.jsx')).toBe('javascript');
    });

    it('should recognize common languages', () => {
        expect(getLanguageByPath('main.py')).toBe('python');
        expect(getLanguageByPath('lib.rs')).toBe('rust');
        expect(getLanguageByPath('server.go')).toBe('go');
        expect(getLanguageByPath('app.java')).toBe('java');
        expect(getLanguageByPath('main.c')).toBe('c');
    });

    it('should recognize config and data files', () => {
        expect(getLanguageByPath('config.json')).toBe('json');
        expect(getLanguageByPath('compose.yaml')).toBe('yaml');
        expect(getLanguageByPath('Dockerfile')).toBe('dockerfile');
        expect(getLanguageByPath('Makefile')).toBe('makefile');
    });

    it('should return the base name for extensionless files', () => {
        expect(getLanguageByPath('README')).toBe('readme');
    });

    it('should return the extension itself for unknown types', () => {
        expect(getLanguageByPath('report.xlsx')).toBe('xlsx');
    });
});
