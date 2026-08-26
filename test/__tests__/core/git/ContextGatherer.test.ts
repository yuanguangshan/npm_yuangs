import { ContextGatherer } from '../../../../src/core/git/ContextGatherer';
import { GitService } from '../../../../src/core/git/GitService';
import fs from 'fs';
import * as fsPromises from 'fs/promises';
import { exec } from 'child_process';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('child_process', () => ({
    exec: jest.fn(),
    spawn: jest.fn(),
}));
jest.mock('../../../../src/core/git/GitService');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockFsPromises = fsPromises as jest.Mocked<typeof fsPromises>;
const mockExec = exec as unknown as jest.Mock;

describe('ContextGatherer', () => {
    let gatherer: ContextGatherer;
    let mockGitService: jest.Mocked<GitService>;
    const mockRepoRoot = '/repo/root';

    beforeEach(() => {
        mockGitService = new GitService() as jest.Mocked<GitService>;
        mockGitService.getRepoRoot.mockResolvedValue(mockRepoRoot);
        gatherer = new ContextGatherer(mockGitService);
        jest.clearAllMocks();
    });

    test('should gather context correctly', async () => {
        // Mock getFileTree directly to avoid child_process mocking complexity
        jest.spyOn(gatherer as any, 'getFileTree').mockResolvedValue('src/index.ts\npackage.json\nREADME.md\n');

        // Mock fs for package.json (sync)
        (mockFs.existsSync as any).mockReturnValue(true);
        (mockFs.readFileSync as any).mockImplementation((path: any) => {
            if (path.toString().endsWith('package.json')) {
                return JSON.stringify({ name: 'test-project', dependencies: { 'axios': '^1.0.0' } });
            }
            return '';
        });

        // Mock fs/promises for relevant files
        (mockFsPromises.stat as any).mockResolvedValue({ isFile: () => true } as any);
        (mockFsPromises.readFile as any).mockImplementation((path: any) => {
            if (path.toString().endsWith('src/index.ts')) {
                return Promise.resolve('console.log("hello");');
            }
            return Promise.resolve('');
        });

        const context = await gatherer.gather('fix something in src/index.ts');

        expect(context.fileTree).toContain('src/index.ts');
        expect(context.packageJson.name).toBe('test-project');
        expect(context.relevantFiles).toHaveLength(1);
        expect(context.relevantFiles[0].path).toBe('src/index.ts');
        expect(context.relevantFiles[0].content).toBe('console.log("hello");');
        expect(context.meta.confidence).toBeGreaterThan(0.5);
    });

    test('should identify as doc task and filter relevant files', async () => {
        jest.spyOn(gatherer as any, 'getFileTree').mockResolvedValue('docs/guide.md\nsrc/index.ts\nREADME.md\n');

        (mockFs.existsSync as any).mockReturnValue(true);
        (mockFs.readFileSync as any).mockImplementation(() => '');

        (mockFsPromises.stat as any).mockResolvedValue({ isFile: () => true } as any);
        (mockFsPromises.readFile as any).mockImplementation((path: any) => {
            if (path.toString().endsWith('docs/guide.md')) {
                return Promise.resolve('# Guide');
            }
            if (path.toString().endsWith('README.md')) {
                return Promise.resolve('# README');
            }
            return Promise.resolve('');
        });

        const context = await gatherer.gather('update documentation in docs/guide.md');

        expect(context.relevantFiles.some(f => f.path === 'docs/guide.md')).toBe(true);
        expect(context.packageJson).toBeUndefined(); // doc task skips package.json in some logic
        expect(context.summary).toContain('[项目文件树 (主要结构)]');
    });
});
