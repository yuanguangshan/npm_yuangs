import { GitService } from './GitService';
import { ModelRouter } from '../modelRouter/ModelRouter';
/**
 * 分支建议上下文
 */
export interface BranchSuggestContext {
    currentBranch: string;
    workingTree: {
        modified: number;
        added: number;
        deleted: number;
        untracked: number;
        isClean: boolean;
    };
    stagedFiles: string[];
    unstagedFiles: string[];
    recentCommits: Array<{
        message: string;
        date: string;
    }>;
    branchList: string[];
}
/**
 * 分支建议结果
 */
export interface BranchSuggestion {
    action: 'stay' | 'switch' | 'create';
    reason: string;
    targetBranch?: string;
    newBranch?: {
        name: string;
        from: string;
        type: 'feature' | 'fix' | 'chore' | 'docs' | 'refactor' | 'test';
    };
    confidence: number;
}
/**
 * AI 分支顾问
 * - 该模块目前仅提供建议 (Advisory)，不执行任何 Git 写操作。
 */
export declare class BranchAdvisor {
    private gitService;
    private router;
    static readonly VERSION = "v1.0";
    constructor(gitService: GitService, router: ModelRouter);
    /**
     * 获取分支建议
     */
    suggest(): Promise<BranchSuggestion>;
    private collectContext;
    private buildPrompt;
    private isValidSuggestion;
    private parseResponse;
}
