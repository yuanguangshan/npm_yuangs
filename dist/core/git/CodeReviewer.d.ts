import { GitService } from './GitService';
import { ModelRouter } from '../modelRouter/ModelRouter';
/**
 * 代码审查级别
 */
export declare enum ReviewLevel {
    /** 快速审查 - 只看明显问题 */
    QUICK = "quick",
    /** 标准审查 - 常规检查 */
    STANDARD = "standard",
    /** 深度审查 - 全面分析 */
    DEEP = "deep"
}
/**
 * 审查问题严重程度
 */
export declare enum IssueSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * 审查问题
 */
export interface ReviewIssue {
    /** 严重程度 */
    severity: IssueSeverity;
    /** 文件路径 */
    file: string;
    /** 行号(可选) */
    line?: number;
    /** 问题描述 */
    message: string;
    /** 建议修复 */
    suggestion?: string;
    /** 代码片段 */
    snippet?: string;
}
/**
 * 审查结果
 */
export interface ReviewResult {
    /** 总体评分 (0-100) */
    score: number;
    /** 总体评价 */
    summary: string;
    /** 发现的问题 */
    issues: ReviewIssue[];
    /** 优点 */
    strengths: string[];
    /** 建议 */
    recommendations: string[];
    /** 审查的文件数 */
    filesReviewed: number;
}
/**
 * AI 代码审查器
 */
export declare class CodeReviewer {
    private gitService;
    private router?;
    static readonly VERSION = "v1.0";
    constructor(gitService: GitService, router?: ModelRouter | undefined);
    /**
     * 构建审查提示词
     */
    private buildReviewPrompt;
    /**
     * 解析 AI 返回的审查结果
     */
    private parseReviewResult;
    /**
     * 解析文本格式的审查结果
     */
    private parseTextReview;
    /**
     * 执行代码审查
     */
    review(level?: ReviewLevel, staged?: boolean): Promise<ReviewResult>;
    /**
     * 审查特定文件
     */
    reviewFile(filePath: string, level?: ReviewLevel): Promise<ReviewResult>;
}
