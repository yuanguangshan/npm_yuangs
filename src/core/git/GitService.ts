import { exec } from 'child_process';
import { promisify } from 'util';
import { GitError } from '../errors';
import { SemanticDiffEngine } from './semantic/SemanticDiffEngine';
import { SemanticDiffResult } from './semantic/types';
import { GIT_CONFLICT_CODES } from './constants';

const execAsync = promisify(exec);

/**
 * Git 变更信息
 */
export interface GitDiff {
    staged: string | null;
    unstaged: string | null;
    files: {
        staged: string[];
        unstaged: string[];
    };
}

/**
 * Git Numstat 统计信息
 */
export interface GitNumstat {
    added: number;
    deleted: number;
    files: string[];
}

/**
 * Git 分支信息
 */
export interface GitBranchInfo {
    current: string;
    upstream?: string;
    ahead: number;
    behind: number;
}

/**
 * Git 提交信息
 */
export interface GitCommitInfo {
    hash: string;
    author: string;
    date: string;
    message: string;
}

/**
 * Git 服务类
 * 提供完整的 Git 操作能力
 */
export class GitService {
    private cwd: string;

    constructor(cwd: string = process.cwd()) {
        this.cwd = cwd;
    }

    /**
     * 执行 Git 命令
     */
    private async exec(command: string): Promise<string> {
        try {
            const { stdout } = await execAsync(`git ${command}`, {
                cwd: this.cwd,
                maxBuffer: 10 * 1024 * 1024, // 10MB
            });
            return stdout.trim();
        } catch (error: any) {
            throw new GitError(`Git command failed: git ${command}\n${error.message}`, [
                'Ensure you are in a valid Git repository.',
                'Check if there are any pending merge conflicts.',
                'Verify your Git permissions for this directory.'
            ]);
        }
    }

    /**
     * 安全执行 Git 命令(失败返回 null)
     */
    private async execSafe(command: string): Promise<string | null> {
        try {
            return await this.exec(command);
        } catch {
            return null;
        }
    }

    /**
     * 检查是否在 Git 仓库中
     */
    async isGitRepository(): Promise<boolean> {
        const result = await this.execSafe('rev-parse --git-dir');
        return result !== null;
    }

    /**
     * 获取当前分支信息
     */
    async getBranchInfo(): Promise<GitBranchInfo> {
        const current = await this.exec('rev-parse --abbrev-ref HEAD');
        const upstream = await this.execSafe(`rev-parse --abbrev-ref ${current}@{upstream}`);

        let ahead = 0;
        let behind = 0;

        if (upstream) {
            const aheadResult = await this.execSafe(`rev-list --count ${upstream}..HEAD`);
            const behindResult = await this.execSafe(`rev-list --count HEAD..${upstream}`);
            ahead = aheadResult ? parseInt(aheadResult, 10) : 0;
            behind = behindResult ? parseInt(behindResult, 10) : 0;
        }

        return {
            current,
            upstream: upstream || undefined,
            ahead,
            behind,
        };
    }

    /**
     * 获取完整的 diff 信息
     */
    async getDiff(): Promise<GitDiff> {
        const staged = await this.execSafe('diff --staged');
        const unstaged = await this.execSafe('diff');

        const stagedFiles = await this.execSafe('diff --staged --name-only');
        const unstagedFiles = await this.execSafe('diff --name-only');

        return {
            staged,
            unstaged,
            files: {
                staged: stagedFiles ? stagedFiles.split('\n').filter(Boolean) : [],
                unstaged: unstagedFiles ? unstagedFiles.split('\n').filter(Boolean) : [],
            },
        };
    }

    /**
     * 获取 diff 的 numstat 统计信息（准确统计行数）
     * 格式：added deleted filename
     */
    async getDiffNumstat(): Promise<GitNumstat> {
        const stagedNumstat = await this.execSafe('diff --staged --numstat');
        const unstagedNumstat = await this.execSafe('diff --numstat');

        let totalAdded = 0;
        let totalDeleted = 0;
        const allFiles: string[] = [];

        // 解析 staged 的 numstat
        if (stagedNumstat) {
            for (const line of stagedNumstat.split('\n')) {
                if (!line.trim()) continue;
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    const added = parseInt(parts[0], 10) || 0;
                    const deleted = parseInt(parts[1], 10) || 0;
                    totalAdded += added;
                    totalDeleted += deleted;
                    // 最后部分是文件名（可能包含空格）
                    const fileName = parts.slice(2).join(' ');
                    allFiles.push(fileName);
                }
            }
        }

        // 解析 unstaged 的 numstat
        if (unstagedNumstat) {
            for (const line of unstagedNumstat.split('\n')) {
                if (!line.trim()) continue;
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    const added = parseInt(parts[0], 10) || 0;
                    const deleted = parseInt(parts[1], 10) || 0;
                    totalAdded += added;
                    totalDeleted += deleted;
                    // 最后部分是文件名（可能包含空格）
                    const fileName = parts.slice(2).join(' ');
                    allFiles.push(fileName);
                }
            }
        }

        return {
            added: totalAdded,
            deleted: totalDeleted,
            files: allFiles,
        };
    }

    /**
     * 获取文件的 diff
     */
    async getFileDiff(filePath: string, staged: boolean = false): Promise<string | null> {
        const stagedFlag = staged ? '--staged' : '';
        return await this.execSafe(`diff ${stagedFlag} -- ${filePath}`);
    }

    /**
     * 获取指定 commit 的 diff
     * @param commitHash commit hash 或引用（如 HEAD~1）
     * @returns diff 内容
     */
    async getCommitDiff(commitHash: string): Promise<{ diff: string | null; files: string[] }> {
        const diff = await this.execSafe(`show ${commitHash} --format=`); // 使用空格式避免输出 commit 信息
        const files = await this.execSafe(`diff-tree --name-only -r ${commitHash}`);

        return {
            diff,
            files: files ? files.split('\n').filter(Boolean) : [],
        };
    }

    /**
     * 获取两个 commit 之间的 diff
     * @param from 起始 commit
     * @param to 结束 commit（默认为 HEAD）
     * @returns diff 内容
     */
    async getCommitRangeDiff(from: string, to: string = 'HEAD'): Promise<{ diff: string | null; files: string[] }> {
        const diff = await this.execSafe(`diff ${from}...${to}`);
        const files = await this.execSafe(`diff --name-only ${from}...${to}`);

        return {
            diff,
            files: files ? files.split('\n').filter(Boolean) : [],
        };
    }

    /**
     * 获取语义级 Diff 分析结果
     * @param staged 是否只分析已暂存的变更
     */
    async getSemanticDiff(staged: boolean = true): Promise<SemanticDiffResult | null> {
        const diffContent = await this.execSafe(staged ? 'diff --staged' : 'diff');

        if (!diffContent) return null;

        return SemanticDiffEngine.analyze(diffContent);
    }

    /**
     * 获取 commit 的详细信息
     * @param commitHash commit hash
     * @returns commit 信息
     */
    async getCommitInfo(commitHash: string): Promise<GitCommitInfo | null> {
        const format = '%H%n%an%n%ai%n%s';
        const output = await this.execSafe(`log -1 --format="${format}" ${commitHash}`);

        if (!output) return null;

        const lines = output.trim().split('\n');
        if (lines.length >= 4) {
            return {
                hash: lines[0],
                author: lines[1],
                date: lines[2],
                message: lines[3],
            };
        }

        return null;
    }

    /**
     * 获取最近的提交历史
     */
    async getRecentCommits(count: number = 10): Promise<GitCommitInfo[]> {
        const format = '%H%n%an%n%ai%n%s%n---COMMIT-END---';
        const log = await this.execSafe(`log -${count} --format="${format}"`);

        if (!log) return [];

        const commits: GitCommitInfo[] = [];
        const commitBlocks = log.split('---COMMIT-END---').filter(Boolean);

        for (const block of commitBlocks) {
            const lines = block.trim().split('\n');
            if (lines.length >= 4) {
                commits.push({
                    hash: lines[0],
                    author: lines[1],
                    date: lines[2],
                    message: lines[3],
                });
            }
        }

        return commits;
    }

    /**
     * 暂存文件
     */
    async stageFiles(files: string[]): Promise<void> {
        if (files.length === 0) return;
        await this.exec(`add ${files.map(f => `"${f}"`).join(' ')}`);
    }

    /**
     * 暂存所有变更
     */
    async stageAll(): Promise<void> {
        await this.exec('add -A');
    }

    /**
   * 提交变更 (使用 stdin 避免 shell escaping 问题)
   */
    async commit(message: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const gitCommit = spawn('git', ['commit', '-F', '-'], {
                cwd: this.cwd,
            });

            let stdout = '';
            let stderr = '';

            gitCommit.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            gitCommit.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            gitCommit.on('close', (code: number) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Git commit failed: ${stderr || stdout}`));
                }
            });

            gitCommit.on('error', (error: Error) => {
                reject(new Error(`Git commit failed: ${error.message}`));
            });

            // 写入 commit message 到 stdin
            gitCommit.stdin.write(message);
            gitCommit.stdin.end();
        });
    }

    /**
     * 获取 Git 状态摘要
     */
    async getStatusSummary(): Promise<{
        modified: number;
        added: number;
        deleted: number;
        untracked: number;
    }> {
        const status = await this.execSafe('status --porcelain');
        if (!status) {
            return { modified: 0, added: 0, deleted: 0, untracked: 0 };
        }

        const lines = status.split('\n');
        let modified = 0;
        let added = 0;
        let deleted = 0;
        let untracked = 0;

        for (const line of lines) {
            const statusCode = line.substring(0, 2);
            if (statusCode.includes('M')) modified++;
            if (statusCode.includes('A')) added++;
            if (statusCode.includes('D')) deleted++;
            if (statusCode.includes('?')) untracked++;
        }

        return { modified, added, deleted, untracked };
    }

    /**
     * 获取存在冲突的文件列表
     */
    async getConflictedFiles(): Promise<string[]> {
        const status = await this.execSafe('status --porcelain');
        if (!status) return [];

        const conflictedFiles: string[] = [];
        const lines = status.split('\n');

        for (const line of lines) {
            if (line.length < 3) continue;
            const statusCode = line.substring(0, 2);
            if (GIT_CONFLICT_CODES.includes(statusCode)) {
                conflictedFiles.push(line.substring(3).trim());
            }
        }

        return conflictedFiles;
    }

    /**
     * 获取仓库根目录
     */
    async getRepoRoot(): Promise<string> {
        const root = await this.exec('rev-parse --show-toplevel');
        return root;
    }

    /**
     * 获取当前提交的 hash
     */
    async getCurrentCommitHash(): Promise<string> {
        return await this.exec('rev-parse HEAD');
    }

    async isWorkingTreeClean(): Promise<boolean> {
        const status = await this.execSafe('status --porcelain');
        return !status || status.length === 0;
    }

    /**
     * 获取所有本地分支信息
     */
    async getBranches(): Promise<{
        current: string;
        all: string[];
        details: Array<{
            name: string;
            isCurrent: boolean;
            hash: string;
            date?: string;
            subject?: string;
            upstream?: string;
            ahead?: number;
            behind?: number;
        }>;
    }> {
        const current = await this.exec('rev-parse --abbrev-ref HEAD');

        // 使用 format 获取更详细的信息: name, objectname, committerdate:iso8601, subject, upstream, ahead-behind
        const format = '%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(subject)|%(upstream:short)|%(upstream:track)';
        const output = await this.exec(`for-each-ref --sort=-committerdate --format="${format}" refs/heads`);

        const lines = output.split('\n').filter(Boolean);
        const all: string[] = [];
        const details = lines.map(line => {
            const [name, hash, date, subject, upstream, track] = line.split('|');
            all.push(name);

            // 解析 ahead/behind
            let ahead = 0;
            let behind = 0;
            if (track) {
                const aheadMatch = track.match(/ahead (\d+)/);
                const behindMatch = track.match(/behind (\d+)/);
                if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
                if (behindMatch) behind = parseInt(behindMatch[1], 10);
            }

            return {
                name,
                isCurrent: name === current,
                hash,
                date,
                subject,
                upstream: upstream || undefined,
                ahead,
                behind
            };
        });

        return { current, all, details };
    }

    /**
     * 安全执行带参数的 Git 命令 (不经过 shell)
     */
    private async execArgs(args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const child = spawn('git', args, { cwd: this.cwd });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data: Buffer) => stdout += data.toString());
            child.stderr.on('data', (data: Buffer) => stderr += data.toString());

            child.on('close', (code: number) => {
                if (code === 0) resolve(stdout.trim());
                else reject(new Error(`Git command failed: git ${args.join(' ')}\n${stderr || stdout}`));
            });

            child.on('error', (err: Error) => reject(new Error(`Git command failed: ${err.message}`)));
        });
    }

    /**
     * 切换分支 (Safe)
     */
    async switchBranch(name: string): Promise<void> {
        await this.execArgs(['checkout', name]);
    }

    /**
     * 创建新分支 (Safe)
     */
    async createBranch(name: string, startPoint?: string): Promise<void> {
        const args = startPoint ? ['checkout', '-b', name, startPoint] : ['checkout', '-b', name];
        await this.execArgs(args);
    }

    /**
     * 验证分支名称是否符合 Git 规范
     */
    async isValidBranchName(name: string): Promise<boolean> {
        try {
            // 使用 git check-ref-format --branch 验证分支名
            await this.exec(`check-ref-format --branch "${name}"`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 保存当前工作目录快照（用于回滚）
     */
    async saveSnapshot(snapshotName: string): Promise<string> {
        const stashResult = await this.execSafe(`save --include-untracked -m "${snapshotName}"`);
        if (stashResult) {
            return 'stashed';
        }

        const status = await this.getStatusSummary();
        if (status.modified === 0 && status.added === 0 && status.deleted === 0 && status.untracked === 0) {
            return 'clean';
        }

        throw new Error('Unable to save snapshot');
    }

    /**
     * 恢复到之前的快照
     */
    async restoreSnapshot(): Promise<void> {
        await this.execArgs(['reset', '--hard', 'HEAD']);
        await this.execArgs(['clean', '-fd']);

        const stashes = await this.execSafe('stash list');
        if (stashes) {
            const stashRef = stashes.split('\n')[0]?.split(':')[0];
            if (stashRef) {
                await this.execArgs(['stash', 'drop', stashRef]);
            }
        }
    }

    /**
     * 放弃未提交的变更
     */
    async discardChanges(): Promise<void> {
        await this.execArgs(['reset', '--hard', 'HEAD']);
        await this.execArgs(['clean', '-fd']);
    }
}
