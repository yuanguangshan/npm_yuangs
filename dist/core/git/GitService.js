"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Git 服务类
 * 提供完整的 Git 操作能力
 */
class GitService {
    cwd;
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
    }
    /**
     * 执行 Git 命令
     */
    async exec(command) {
        try {
            const { stdout } = await execAsync(`git ${command}`, {
                cwd: this.cwd,
                maxBuffer: 10 * 1024 * 1024, // 10MB
            });
            return stdout.trim();
        }
        catch (error) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }
    /**
     * 安全执行 Git 命令(失败返回 null)
     */
    async execSafe(command) {
        try {
            return await this.exec(command);
        }
        catch {
            return null;
        }
    }
    /**
     * 检查是否在 Git 仓库中
     */
    async isGitRepository() {
        const result = await this.execSafe('rev-parse --git-dir');
        return result !== null;
    }
    /**
     * 获取当前分支信息
     */
    async getBranchInfo() {
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
    async getDiff() {
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
     * 获取文件的 diff
     */
    async getFileDiff(filePath, staged = false) {
        const stagedFlag = staged ? '--staged' : '';
        return await this.execSafe(`diff ${stagedFlag} -- ${filePath}`);
    }
    /**
     * 获取最近的提交历史
     */
    async getRecentCommits(count = 10) {
        const format = '%H%n%an%n%ai%n%s%n---COMMIT-END---';
        const log = await this.execSafe(`log -${count} --format="${format}"`);
        if (!log)
            return [];
        const commits = [];
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
    async stageFiles(files) {
        if (files.length === 0)
            return;
        await this.exec(`add ${files.map(f => `"${f}"`).join(' ')}`);
    }
    /**
     * 暂存所有变更
     */
    async stageAll() {
        await this.exec('add -A');
    }
    /**
   * 提交变更 (使用 stdin 避免 shell escaping 问题)
   */
    async commit(message) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const gitCommit = spawn('git', ['commit', '-F', '-'], {
                cwd: this.cwd,
            });
            let stdout = '';
            let stderr = '';
            gitCommit.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            gitCommit.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            gitCommit.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                }
                else {
                    reject(new Error(`Git commit failed: ${stderr || stdout}`));
                }
            });
            gitCommit.on('error', (error) => {
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
    async getStatusSummary() {
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
            if (statusCode.includes('M'))
                modified++;
            if (statusCode.includes('A'))
                added++;
            if (statusCode.includes('D'))
                deleted++;
            if (statusCode.includes('?'))
                untracked++;
        }
        return { modified, added, deleted, untracked };
    }
    /**
     * 获取仓库根目录
     */
    async getRepoRoot() {
        const root = await this.exec('rev-parse --show-toplevel');
        return root;
    }
    /**
     * 获取当前提交的 hash
     */
    async getCurrentCommitHash() {
        return await this.exec('rev-parse HEAD');
    }
    async isWorkingTreeClean() {
        const status = await this.execSafe('status --porcelain');
        return !status || status.length === 0;
    }
    /**
     * 获取所有本地分支信息
     */
    async getBranches() {
        const current = await this.exec('rev-parse --abbrev-ref HEAD');
        // 使用 format 获取更详细的信息: name, objectname, committerdate:iso8601, subject, upstream, ahead-behind
        const format = '%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(subject)|%(upstream:short)|%(upstream:track)';
        const output = await this.exec(`for-each-ref --sort=-committerdate --format="${format}" refs/heads`);
        const lines = output.split('\n').filter(Boolean);
        const all = [];
        const details = lines.map(line => {
            const [name, hash, date, subject, upstream, track] = line.split('|');
            all.push(name);
            // 解析 ahead/behind
            let ahead = 0;
            let behind = 0;
            if (track) {
                const aheadMatch = track.match(/ahead (\d+)/);
                const behindMatch = track.match(/behind (\d+)/);
                if (aheadMatch)
                    ahead = parseInt(aheadMatch[1], 10);
                if (behindMatch)
                    behind = parseInt(behindMatch[1], 10);
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
    async execArgs(args) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const child = spawn('git', args, { cwd: this.cwd });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());
            child.on('close', (code) => {
                if (code === 0)
                    resolve(stdout.trim());
                else
                    reject(new Error(`Git command failed: git ${args.join(' ')}\n${stderr || stdout}`));
            });
            child.on('error', (err) => reject(new Error(`Git command failed: ${err.message}`)));
        });
    }
    /**
     * 切换分支 (Safe)
     */
    async switchBranch(name) {
        await this.execArgs(['checkout', name]);
    }
    /**
     * 创建新分支 (Safe)
     */
    async createBranch(name, startPoint) {
        const args = startPoint ? ['checkout', '-b', name, startPoint] : ['checkout', '-b', name];
        await this.execArgs(args);
    }
}
exports.GitService = GitService;
//# sourceMappingURL=GitService.js.map