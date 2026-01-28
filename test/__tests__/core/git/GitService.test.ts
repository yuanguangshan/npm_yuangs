import { GitService } from '../../../../src/core/git/GitService';
import { exec } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
    exec: jest.fn(),
    spawn: jest.fn(),
}));

const mockExec = exec as unknown as jest.Mock;

describe('GitService', () => {
    let gitService: GitService;
    const mockCwd = '/fake/path';

    beforeEach(() => {
        gitService = new GitService(mockCwd);
        jest.clearAllMocks();
    });

    describe('isGitRepository', () => {
        test('should return true if git rev-parse succeeds', async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, { stdout: '.git\n' });
            });

            const result = await gitService.isGitRepository();
            expect(result).toBe(true);
            expect(mockExec).toHaveBeenCalledWith(
                'git rev-parse --git-dir',
                expect.objectContaining({ cwd: mockCwd }),
                expect.any(Function)
            );
        });

        test('should return false if git rev-parse fails', async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(new Error('not a git repository'), { stdout: '', stderr: '' });
            });

            const result = await gitService.isGitRepository();
            expect(result).toBe(false);
        });
    });

    describe('getStatusSummary', () => {
        test('should parse porcelain status correctly', async () => {
            const mockStatus = ' M file1.ts\nA  file2.ts\n D file3.ts\n?? file4.ts\n';
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, { stdout: mockStatus });
            });

            const summary = await gitService.getStatusSummary();
            expect(summary).toEqual({
                modified: 1,
                added: 1,
                deleted: 1,
                untracked: 1,
            });
        });

        test('should return zeros if status is empty', async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, { stdout: '' });
            });

            const summary = await gitService.getStatusSummary();
            expect(summary).toEqual({ modified: 0, added: 0, deleted: 0, untracked: 0 });
        });
    });

    describe('getBranchInfo', () => {
        test('should return current branch and upstream info', async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                if (cmd === 'git rev-parse --abbrev-ref HEAD') {
                    callback(null, { stdout: 'main\n' });
                } else if (cmd === 'git rev-parse --abbrev-ref main@{upstream}') {
                    callback(null, { stdout: 'origin/main\n' });
                } else if (cmd.includes('rev-list --count')) {
                    callback(null, { stdout: '2\n' });
                }
            });

            const info = await gitService.getBranchInfo();
            expect(info).toEqual({
                current: 'main',
                upstream: 'origin/main',
                ahead: 2,
                behind: 2,
            });
        });
    });

    describe('getDiff', () => {
        test('should return diff info', async () => {
            mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
                if (cmd === 'git diff --staged') callback(null, { stdout: 'staged diff' });
                else if (cmd === 'git diff') callback(null, { stdout: 'unstaged diff' });
                else if (cmd === 'git diff --staged --name-only') callback(null, { stdout: 's1.ts\ns2.ts' });
                else if (cmd === 'git diff --name-only') callback(null, { stdout: 'u1.ts' });
            });

            const diff = await gitService.getDiff();
            expect(diff.staged).toBe('staged diff');
            expect(diff.files.staged).toEqual(['s1.ts', 's2.ts']);
            expect(diff.files.unstaged).toEqual(['u1.ts']);
        });
    });

    describe('commit', () => {
        test('should resolve when spawn git commit succeeds', async () => {
            const { spawn } = require('child_process');
            const mockSpawn = spawn as unknown as jest.Mock;
            const mStdin = { write: jest.fn(), end: jest.fn() };
            const mStdout = { on: jest.fn() };
            const mStderr = { on: jest.fn() };
            const mOn = jest.fn();

            mockSpawn.mockReturnValue({
                stdin: mStdin,
                stdout: mStdout,
                stderr: mStderr,
                on: mOn,
            });

            const commitPromise = gitService.commit('feat: test');

            // Simulate stdout data
            const stdoutCallback = mStdout.on.mock.calls.find((c: any) => c[0] === 'data')[1];
            stdoutCallback(Buffer.from('commit output'));

            // Simulate process close
            const closeCallback = mOn.mock.calls.find((c: any) => c[0] === 'close')[1];
            closeCallback(0);

            const result = await commitPromise;
            expect(result).toBe('commit output');
            expect(mStdin.write).toHaveBeenCalledWith('feat: test');
        });
    });

    describe('getBranches', () => {
        test('should parse branch information correctly', async () => {
            mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
                if (cmd === 'git rev-parse --abbrev-ref HEAD') {
                    callback(null, { stdout: 'main' });
                } else if (cmd.includes('for-each-ref')) {
                    callback(null, { stdout: 'main|abc123|2026-01-28|msg|origin/main|ahead 1, behind 0\ndev|def456|2026-01-28|msg2||' });
                }
            });

            const result = await gitService.getBranches();
            expect(result.current).toBe('main');
            expect(result.all).toEqual(['main', 'dev']);
            expect(result.details[0].name).toBe('main');
            expect(result.details[0].ahead).toBe(1);
            expect(result.details[1].name).toBe('dev');
        });
    });

    describe('getDiffNumstat', () => {
        test('should parse numstat correctly', async () => {
            mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
                if (cmd === 'git diff --staged --numstat') callback(null, { stdout: '2\t1\ts1.ts\n' });
                else if (cmd === 'git diff --numstat') callback(null, { stdout: '3\t0\tu1.ts\n' });
            });

            const stat = await gitService.getDiffNumstat();
            expect(stat.added).toBe(5);
            expect(stat.deleted).toBe(1);
            expect(stat.files).toEqual(['s1.ts', 'u1.ts']);
        });
    });

    describe('getCommitInfo', () => {
        test('should parse commit info correctly', async () => {
            const mockOutput = 'abc\nauthor\n2026-01-28\nmsg';
            mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
                callback(null, { stdout: mockOutput });
            });

            const info = await gitService.getCommitInfo('abc');
            expect(info).toEqual({
                hash: 'abc',
                author: 'author',
                date: '2026-01-28',
                message: 'msg'
            });
        });
    });

    describe('getRecentCommits', () => {
        test('should parse recent commits', async () => {
            const mockOutput = 'h1\na1\nd1\nm1\n---COMMIT-END---\nh2\na2\nd2\nm2\n---COMMIT-END---';
            mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
                callback(null, { stdout: mockOutput });
            });

            const commits = await gitService.getRecentCommits(2);
            expect(commits).toHaveLength(2);
            expect(commits[0].hash).toBe('h1');
            expect(commits[1].hash).toBe('h2');
        });
    });
});
