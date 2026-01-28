import { tokenizeWithQuotes, resolveFilePathsAndQuestion } from '../../../src/utils/syntaxHandler';
import fs from 'fs';
import path from 'path';
import { loadContext } from '../../../src/commands/contextStorage';

jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        readFile: jest.fn(),
        stat: jest.fn(),
    },
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    constants: {
        F_OK: 0,
    }
}));

jest.mock('path', () => ({
    resolve: jest.fn((p) => p),
    join: jest.fn((...args) => args.join('/')),
}));

jest.mock('../../../src/commands/contextStorage', () => ({
    loadContext: jest.fn(),
    saveContext: jest.fn(),
}));

describe('syntaxHandler parsing logic', () => {
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
    });

    describe('resolveFilePathsAndQuestion', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            (loadContext as jest.Mock).mockResolvedValue([
                { id: '1', path: 'src/index.ts', type: 'file', tokens: 100, importance: 1, lastUsedAt: Date.now() },
                { id: '2', path: 'src/utils.ts', type: 'file', tokens: 200, importance: 0.8, lastUsedAt: Date.now() }
            ]);
        });

        it('should resolve indices correctly', async () => {
            (fs.promises.access as jest.Mock).mockRejectedValue(new Error('not exists'));
            const { filePaths, extraQuestion } = await resolveFilePathsAndQuestion('1,2');
            expect(filePaths).toEqual(['src/index.ts', 'src/utils.ts']);
            expect(extraQuestion).toBeUndefined();
        });

        it('should resolve ranges correctly', async () => {
            (fs.promises.access as jest.Mock).mockRejectedValue(new Error('not exists'));
            const { filePaths } = await resolveFilePathsAndQuestion('1-2');
            expect(filePaths).toEqual(['src/index.ts', 'src/utils.ts']);
        });

        it('should handle mixed paths, indices and questions', async () => {
            (fs.promises.access as jest.Mock).mockImplementation(async (p: string) => {
                if (p === 'existing.ts') return;
                throw new Error('not exists');
            });

            const { filePaths, extraQuestion } = await resolveFilePathsAndQuestion('1 existing.ts, 2 what is this?');
            expect(filePaths).toEqual(['src/index.ts', 'existing.ts', 'src/utils.ts']);
            expect(extraQuestion).toBe('what is this?');
        });

        it('should prioritize disk files over indices', async () => {
            // Case where a file named '1' exists on disk
            (fs.promises.access as jest.Mock).mockImplementation(async (p: string) => {
                if (p === '1') return;
                throw new Error('not exists');
            });

            const { filePaths } = await resolveFilePathsAndQuestion('1');
            expect(filePaths).toEqual(['1']); // Should be the file '1', not index 1 (src/index.ts)
        });

        it('should handle quoted paths even if they dont exist yet', async () => {
            (fs.promises.access as jest.Mock).mockRejectedValue(new Error('not exists'));
            const { filePaths, extraQuestion } = await resolveFilePathsAndQuestion('"new-file.ts" create this');
            expect(filePaths).toEqual(['new-file.ts']);
            expect(extraQuestion).toBe('create this');
        });
    });
});
