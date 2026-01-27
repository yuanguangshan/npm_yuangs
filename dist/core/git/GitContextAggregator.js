"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitContextAggregator = void 0;
/**
 * Git 上下文聚合器
 * 职责: 1. 高效收集状态 (并行 I/O) 2. 统一业务语义规则 (Policy)
 *
 * 注意：
 * - 本类只处理 Git 层事实与通用规则 (如是否有暂存、是否在主分支)
 * - 严禁引入任何 AI、产品决策或特定工作流策略
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
     */
    ensureStaged(context) {
        if (!context.diff.staged) {
            if (context.diff.unstaged) {
                const files = context.diff.files.unstaged;
                const count = files.length;
                const fileList = files.slice(0, 3).join(', ') + (count > 3 ? '...' : '');
                throw new Error(`Found ${count} unstaged file(s) [${fileList}], but nothing is staged.\n\n` +
                    'Next steps:\n' +
                    '  git add .             (Stage all changes)\n' +
                    '  yuangs git commit -a  (Auto-stage and commit)\n');
            }
            throw new Error('No changes to commit (working tree clean).');
        }
    }
}
exports.GitContextAggregator = GitContextAggregator;
//# sourceMappingURL=GitContextAggregator.js.map