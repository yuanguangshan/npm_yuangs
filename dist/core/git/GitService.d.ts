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
export declare class GitService {
    private cwd;
    constructor(cwd?: string);
    /**
     * 执行 Git 命令
     */
    private exec;
    /**
     * 安全执行 Git 命令(失败返回 null)
     */
    private execSafe;
    /**
     * 检查是否在 Git 仓库中
     */
    isGitRepository(): Promise<boolean>;
    /**
     * 获取当前分支信息
     */
    getBranchInfo(): Promise<GitBranchInfo>;
    /**
     * 获取完整的 diff 信息
     */
    getDiff(): Promise<GitDiff>;
    /**
     * 获取 diff 的 numstat 统计信息（准确统计行数）
     * 格式：added deleted filename
     */
    getDiffNumstat(): Promise<GitNumstat>;
    /**
     * 获取文件的 diff
     */
    getFileDiff(filePath: string, staged?: boolean): Promise<string | null>;
    /**
     * 获取指定 commit 的 diff
     * @param commitHash commit hash 或引用（如 HEAD~1）
     * @returns diff 内容
     */
    getCommitDiff(commitHash: string): Promise<{
        diff: string | null;
        files: string[];
    }>;
    /**
     * 获取两个 commit 之间的 diff
     * @param from 起始 commit
     * @param to 结束 commit（默认为 HEAD）
     * @returns diff 内容
     */
    getCommitRangeDiff(from: string, to?: string): Promise<{
        diff: string | null;
        files: string[];
    }>;
    /**
     * 获取 commit 的详细信息
     * @param commitHash commit hash
     * @returns commit 信息
     */
    getCommitInfo(commitHash: string): Promise<GitCommitInfo | null>;
    /**
     * 获取最近的提交历史
     */
    getRecentCommits(count?: number): Promise<GitCommitInfo[]>;
    /**
     * 暂存文件
     */
    stageFiles(files: string[]): Promise<void>;
    /**
     * 暂存所有变更
     */
    stageAll(): Promise<void>;
    /**
   * 提交变更 (使用 stdin 避免 shell escaping 问题)
   */
    commit(message: string): Promise<string>;
    /**
     * 获取 Git 状态摘要
     */
    getStatusSummary(): Promise<{
        modified: number;
        added: number;
        deleted: number;
        untracked: number;
    }>;
    /**
     * 获取仓库根目录
     */
    getRepoRoot(): Promise<string>;
    /**
     * 获取当前提交的 hash
     */
    getCurrentCommitHash(): Promise<string>;
    isWorkingTreeClean(): Promise<boolean>;
    /**
     * 获取所有本地分支信息
     */
    getBranches(): Promise<{
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
    }>;
    /**
     * 安全执行带参数的 Git 命令 (不经过 shell)
     */
    private execArgs;
    /**
     * 切换分支 (Safe)
     */
    switchBranch(name: string): Promise<void>;
    /**
     * 创建新分支 (Safe)
     */
    createBranch(name: string, startPoint?: string): Promise<void>;
    /**
     * 验证分支名称是否符合 Git 规范
     */
    isValidBranchName(name: string): Promise<boolean>;
    /**
     * 保存当前工作目录快照（用于回滚）
     */
    saveSnapshot(snapshotName: string): Promise<string>;
    /**
     * 恢复到之前的快照
     */
    restoreSnapshot(): Promise<void>;
    /**
     * 放弃未提交的变更
     */
    discardChanges(): Promise<void>;
}
