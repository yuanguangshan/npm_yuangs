import { GitService } from './GitService';
import { ModelRouter } from '../modelRouter/ModelRouter';
/**
 * Commit Message 生成配置
 */
export interface CommitMessageConfig {
    /** 是否包含详细描述 */
    detailed?: boolean;
    /** 提交类型(feat/fix/docs等) */
    type?: string;
    /** 影响范围 */
    scope?: string;
    /** 最大长度 */
    maxLength?: number;
}
/**
 * 生成的 Commit Message
 */
export interface GeneratedCommitMessage {
    /** 主标题 */
    title: string;
    /** 详细描述 */
    body?: string;
    /** 完整消息 */
    full: string;
    /** 变更摘要 */
    summary: {
        filesChanged: number;
        insertions: number;
        deletions: number;
    };
}
/**
 * 智能 Commit Message 生成器
 */
export declare class CommitMessageGenerator {
    private gitService;
    private router?;
    constructor(gitService: GitService, router?: ModelRouter | undefined);
    /**
     * 分析 diff 获取统计信息
     */
    private analyzeDiff;
    /**
     * 构建 AI 提示词
     */
    private buildPrompt;
    /**
     * 使用 AI 生成 commit message
     */
    generateWithAI(diff: string, config?: CommitMessageConfig): Promise<string>;
    /**
     * 生成基于规则的 commit message (fallback)
     */
    private generateRuleBased;
    /**
     * 推断变更范围
     */
    private inferScope;
    /**
     * 生成 subject
     */
    private generateSubject;
    /**
     * 生成完整的 commit message
     */
    generate(config?: CommitMessageConfig): Promise<GeneratedCommitMessage>;
}
