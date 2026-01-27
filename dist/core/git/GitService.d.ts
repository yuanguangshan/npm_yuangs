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
     * 获取文件的 diff
     */
    getFileDiff(filePath: string, staged?: boolean): Promise<string | null>;
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
}
