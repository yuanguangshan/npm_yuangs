import { GitService, GitDiff, GitCommitInfo } from './GitService';
/**
 * 统一的 Git 上下文快照
 */
export interface GitContext {
    diff: GitDiff;
    status: {
        modified: number;
        added: number;
        deleted: number;
        untracked: number;
    };
    branches: {
        current: string;
        all: string[];
        details: any[];
    };
    recentCommits: GitCommitInfo[];
    repoRoot: string;
}
/**
 * Git 上下文聚合器
 * 职责: 1. 高效收集状态 (并行 I/O) 2. 统一业务校验 (Policy)
 */
export declare class GitContextAggregator {
    private gitService;
    constructor(gitService: GitService);
    /**
     * 收集完整上下文
     */
    collect(): Promise<GitContext>;
    /**
     * Policy: 确保有已暂存的变更
     * 统一处理 "无暂存但有未暂存" 的 UX 提示语
     */
    ensureStaged(context: GitContext): void;
}
