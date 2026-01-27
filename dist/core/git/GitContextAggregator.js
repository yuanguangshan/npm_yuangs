"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitContextAggregator = void 0;
/**
 * Git 上下文聚合器
 * 职责: 1. 高效收集状态 (并行 I/O) 2. 统一业务校验 (Policy)
 */
class GitContextAggregator {
    gitService;
    constructor(gitService) {
        this.gitService = gitService;
    }
    /**
     * 收集完整上下文
     */
    async collect() {
        const [diff, status, branches, commits, repoRoot] = await Promise.all([
            this.gitService.getDiff(),
            this.gitService.getStatusSummary(),
            this.gitService.getBranches(),
            this.gitService.getRecentCommits(5),
            this.gitService.getRepoRoot()
        ]);
        return {
            diff,
            status,
            branches,
            recentCommits: commits,
            repoRoot
        };
    }
    /**
     * Policy: 确保有已暂存的变更
     * 统一处理 "无暂存但有未暂存" 的 UX 提示语
     */
    ensureStaged(context) {
        if (!context.diff.staged) {
            if (context.diff.unstaged) {
                const count = context.diff.files.unstaged.length;
                throw new Error(`Found ${count} unstaged file(s) but no staged changes.\n` +
                    'Please stage your changes using "git add" or use "--all" option.');
            }
            throw new Error('No changes to commit (working tree clean).');
        }
    }
}
exports.GitContextAggregator = GitContextAggregator;
//# sourceMappingURL=GitContextAggregator.js.map