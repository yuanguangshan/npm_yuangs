import { ContextGatherer } from '../../../../src/core/git/ContextGatherer';
import { GitService } from '../../../../src/core/git/GitService';
import fs from 'fs';
import { exec } from 'child_process';

jest.mock('fs');
jest.mock('child_process', () => ({
    exec: jest.fn(),
    spawn: jest.fn(),
}));
jest.mock('../../../../src/core/git/GitService');

const mockFs = fs as jest.Mocked<typeof fs>;
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
        // Mock getFileTree (git ls-files)
        mockExec.mockImplementation((cmd, opts, callback) => {
            if (cmd === 'git ls-files') {
                callback(null, { stdout: 'src/index.ts\npackage.json\nREADME.md\n' });
            }
        });

        // Mock fs for package.json and other files
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockImplementation((path: any) => {
            if (path.toString().endsWith('package.json')) {
                return JSON.stringify({ name: 'test-project', dependencies: { 'axios': '^1.0.0' } });
            }
            if (path.toString().endsWith('src/index.ts')) {
                return 'console.log("hello");';
            }
            return '';
        });
        mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

        const context = await gatherer.gather('fix something in src/index.ts');

        expect(context.fileTree).toContain('src/index.ts');
        expect(context.packageJson.name).toBe('test-project');
        expect(context.relevantFiles).toHaveLength(1);
        expect(context.relevantFiles[0].path).toBe('src/index.ts');
        expect(context.relevantFiles[0].content).toBe('console.log("hello");');
        expect(context.meta.confidence).toBeGreaterThan(0.5);
    });

    test('should identify as doc task and filter relevant files', async () => {
        mockExec.mockImplementation((cmd, opts, callback) => {
            if (cmd === 'git ls-files') {
                callback(null, { stdout: 'docs/guide.md\nsrc/index.ts\nREADME.md\n' });
            }
        });

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockImplementation((path: any) => {
            if (path.toString().endsWith('docs/guide.md')) {
                return '# Guide';
            }
            if (path.toString().endsWith('README.md')) {
                return '# README';
            }
            return '';
        });
        mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

        const context = await gatherer.gather('update documentation in docs/guide.md');

        expect(context.relevantFiles.some(f => f.path === 'docs/guide.md')).toBe(true);
        expect(context.packageJson).toBeUndefined(); // doc task skips package.json in some logic
        expect(context.summary).toContain('[项目文件树 (主要结构)]');
    });
});
