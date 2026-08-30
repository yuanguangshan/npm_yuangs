import chalk from 'chalk';
import { GitService } from './GitService';
import { ModelRouter } from '../modelRouter/ModelRouter';
import { TaskConfig, TaskType } from '../modelRouter/types';
import { CapabilityLevel, MinCapability } from '../capability/CapabilityLevel';
import { DecisionInput, ThresholdDegradationPolicy } from '../capability/DegradationPolicy';
import { getDefaultReviewCache } from './ReviewCache';

/**
 * 代码审查级别
 */
export enum ReviewLevel {
    /** 快速审查 - 只看明显问题 */
    QUICK = 'quick',
    /** 标准审查 - 常规检查 */
    STANDARD = 'standard',
    /** 深度审查 - 全面分析 */
    DEEP = 'deep',
}

/**
 * 审查问题严重程度
 */
export enum IssueSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical',
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
    /** 置信度 (0-1) */
    confidence: number;
    /** 降级决策 */
    degradation?: {
        applied: boolean;
        originalLevel: CapabilityLevel;
        targetLevel: CapabilityLevel;
        reason: string;
    };
}

/**
 * AI 代码审查器
 */
export class CodeReviewer {
    public static readonly VERSION = 'v1.0';
    private degradationPolicy: ThresholdDegradationPolicy;
    private cache = getDefaultReviewCache();

    constructor(
        private gitService: GitService,
        private router?: ModelRouter
    ) {
        this.degradationPolicy = new ThresholdDegradationPolicy();
    }

    /**
     * 构建审查提示词
     */
    private buildReviewPrompt(
        diff: string,
        level: ReviewLevel,
        capabilityLevel: CapabilityLevel,
        chunkInfo?: { index: number; total: number }
    ): string {
        const levelInstructions = {
            [ReviewLevel.QUICK]: '快速扫描,只关注明显的 bug、安全问题和严重的代码异味',
            [ReviewLevel.STANDARD]: '进行标准的代码审查,包括代码质量、最佳实践、潜在问题',
            [ReviewLevel.DEEP]: '进行深度审查,包括架构设计、性能优化、安全性、可维护性等所有方面',
        };

        const capabilityInstructions = {
            [CapabilityLevel.SEMANTIC]: '进行语义级别的审查,深入理解代码意图和设计',
            [CapabilityLevel.STRUCTURAL]: '进行结构级别的审查,关注代码结构和依赖关系',
            [CapabilityLevel.LINE]: '进行行级别的审查,关注具体代码行的实现',
            [CapabilityLevel.TEXT]: '进行文本级别的审查,关注文本内容和格式',
            [CapabilityLevel.NONE]: '不进行深度审查,仅输出摘要',
        };

        return `你是一位资深的代码审查专家。请对以下代码变更进行${levelInstructions[level]}。
当前能力等级: ${capabilityInstructions[capabilityLevel]}
${chunkInfo ? `\n注意：本次仅提交第 ${chunkInfo.index + 1}/${chunkInfo.total} 个差异分块，请只评审本块内容，无需汇总全局。\n` : ''}
## 代码变更
\`\`\`diff
${diff}
\`\`\`

## 审查要点
1. **代码质量**: 可读性、可维护性、复杂度
2. **潜在问题**: Bug、边界条件、错误处理
3. **安全性**: 安全漏洞、敏感信息泄露
4. **性能**: 性能瓶颈、资源使用
5. **最佳实践**: 设计模式、编码规范
6. **测试**: 是否需要测试、测试覆盖

## 输出格式
请以 JSON 格式输出审查结果:

\`\`\`json
{
  "score": 85,
  "summary": "整体代码质量良好,有几处需要改进",
  "issues": [
    {
      "severity": "warning",
      "file": "src/example.ts",
      "line": 42,
      "message": "缺少错误处理",
      "suggestion": "建议添加 try-catch 块",
      "snippet": "相关代码片段"
    }
  ],
  "strengths": [
    "代码结构清晰",
    "命名规范"
  ],
  "recommendations": [
    "建议添加单元测试",
    "考虑提取公共逻辑"
  ],
  "confidence": 0.85
}
\`\`\`

请确保输出是有效的 JSON 格式，并包含 confidence 字段。`;
    }

    /**
     * 解析 AI 返回的审查结果
     */
    private parseReviewResult(content: string): Partial<ReviewResult> & { confidence?: number } {
        try {
            // 尝试提取 JSON
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                content.match(/{[\s\S]*}/);

            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(jsonStr);
            }

            return this.parseTextReview(content);
        } catch (error) {
            console.warn('Failed to parse review result:', error);
            return {
                score: 70,
                summary: content.substring(0, 200),
                issues: [],
                strengths: [],
                recommendations: [],
                confidence: 0.5,
            };
        }
    }

    /**
     * 解析文本格式的审查结果
     */
    private parseTextReview(content: string): Partial<ReviewResult> & { confidence?: number } {
        const issues: ReviewIssue[] = [];
        const strengths: string[] = [];
        const recommendations: string[] = [];

        const lines = content.split('\n');
        let currentSection = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('问题') || trimmed.includes('Issue')) {
                currentSection = 'issues';
            } else if (trimmed.includes('优点') || trimmed.includes('Strength')) {
                currentSection = 'strengths';
            } else if (trimmed.includes('建议') || trimmed.includes('Recommend')) {
                currentSection = 'recommendations';
            } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const item = trimmed.substring(1).trim();
                if (currentSection === 'strengths') {
                    strengths.push(item);
                } else if (currentSection === 'recommendations') {
                    recommendations.push(item);
                }
            }
        }

        return {
            score: 75,
            summary: content.substring(0, 200),
            issues,
            strengths,
            recommendations,
            confidence: 0.7,
        };
    }

    /**
     * 将 diff 按行切分为多个不超过 maxChunk 字符的分块。
     * 始终按整行切分，避免中途截断导致一行代码残缺（解决旧版 substring(0,15000) 硬截断丢内容的问题）。
     */
    private splitDiffIntoChunks(diff: string, maxChunk = 14000): string[] {
        if (diff.length <= maxChunk) return [diff];
        const chunks: string[] = [];
        let current = '';
        for (const line of diff.split('\n')) {
            const withNl = line + '\n';
            if (current.length + withNl.length > maxChunk && current.length > 0) {
                chunks.push(current);
                current = '';
            }
            current += withNl;
        }
        if (current.length > 0) chunks.push(current);
        return chunks;
    }

    /**
     * 聚合多块审查结果：评分取均值，置信度取最低，问题合并，优点/建议去重。
     */
    private aggregateReviewResults(results: ReviewResult[]): ReviewResult {
        if (results.length === 1) return results[0];
        let totalScore = 0;
        const issues: ReviewIssue[] = [];
        const strengths = new Set<string>();
        const recommendations = new Set<string>();
        let minConfidence = 1;
        let degradation: ReviewResult['degradation'];

        for (const r of results) {
            totalScore += r.score;
            minConfidence = Math.min(minConfidence, r.confidence);
            issues.push(...r.issues);
            r.strengths.forEach(s => strengths.add(s));
            r.recommendations.forEach(s => recommendations.add(s));
            if (r.degradation?.applied) degradation = r.degradation;
        }

        return {
            score: Math.round(totalScore / results.length),
            summary: `（分 ${results.length} 块审查）` + results.map((r, i) => `[块${i + 1}] ${r.summary}`).join(' '),
            issues,
            strengths: [...strengths],
            recommendations: [...recommendations],
            filesReviewed: results.reduce((acc, r) => acc + r.filesReviewed, 0),
            confidence: minConfidence,
            degradation,
        };
    }

    /**
     * 执行一次 AI 审查调用（单块），包含路由、降级决策与结果解析。
     * review / reviewFile / reviewCommit 共用，避免三处重复逻辑。
     */
    private async reviewOnce(
        diff: string,
        level: ReviewLevel,
        minCapability: MinCapability,
        chunkInfo?: { index: number; total: number }
    ): Promise<ReviewResult> {
        const taskConfig: TaskConfig = {
            type: TaskType.CODE_REVIEW,
            description: 'Review code changes',
        };

        const routingConfig = { strategy: 'auto' as any };
        const routingResult = await this.router!.route(taskConfig, routingConfig);
        console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
        console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));

        const prompt = this.buildReviewPrompt(diff, level, minCapability.minCapability, chunkInfo);

        const execution = await this.router!.executeTask(routingResult.adapter, prompt, taskConfig);
        if (!execution.success || !execution.content) {
            throw new Error('Failed to perform code review');
        }

        const parsed = this.parseReviewResult(execution.content);
        const confidence = parsed.confidence ?? 0.8;

        const decisionInput: DecisionInput = { timeElapsed: 0, confidence };
        const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);

        let degradationApplied = false;
        let degradationReason = '';
        if (degradationDecision.shouldDegrade && minCapability.minCapability !== degradationDecision.targetLevel) {
            degradationApplied = true;
            degradationReason = degradationDecision.reason;
            console.log(chalk.yellow(`⚠️  降级触发: ${degradationReason}`));
        }

        return {
            score: parsed.score || 70,
            summary: parsed.summary || '审查完成',
            issues: parsed.issues || [],
            strengths: parsed.strengths || [],
            recommendations: parsed.recommendations || [],
            filesReviewed: 1,
            confidence,
            degradation: degradationApplied ? {
                applied: true,
                originalLevel: minCapability.minCapability,
                targetLevel: degradationDecision.targetLevel,
                reason: degradationReason,
            } : undefined,
        };
    }

    /**
     * 执行代码审查
     */
    async review(
        level: ReviewLevel = ReviewLevel.STANDARD,
        staged: boolean = true
    ): Promise<ReviewResult> {
        const diff = await this.gitService.getDiff();
        const diffContent = staged ? diff.staged : diff.unstaged;

        if (!diffContent) {
            throw new Error('No changes to review');
        }

        const files = staged ? diff.files.staged : diff.files.unstaged;

        if (level === ReviewLevel.DEEP && files.length > 20) {
            throw new Error(
                'Deep review is not recommended for more than 20 files.\n' +
                'Please use "--level standard" or review specific files using "--file".'
            );
        }

        if (!this.router) {
            throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
        }

        // P1: 整体审查接入缓存（此前仅 reviewFile 会命中缓存，review() 每次都重新调用模型）
        const cacheKey = staged ? '__staged_diff__' : '__unstaged_diff__';
        const cached = await this.cache.get(cacheKey, diffContent, level, CodeReviewer.VERSION);
        if (cached) {
            console.log(chalk.gray('💾 从缓存加载审查结果 (整体审查)'));
            return cached;
        }

        const minCapability: MinCapability = {
            minCapability: CapabilityLevel.SEMANTIC,
            fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
        };

        // P1: 按行分块，避免硬截断导致大 diff 内容丢失；单块时行为与旧版一致。
        const chunks = this.splitDiffIntoChunks(diffContent);
        let result: ReviewResult;
        if (chunks.length === 1) {
            result = await this.reviewOnce(chunks[0], level, minCapability);
        } else {
            console.log(chalk.gray(`📦 差异较大，分 ${chunks.length} 块审查...`));
            const partials: ReviewResult[] = [];
            for (let i = 0; i < chunks.length; i++) {
                partials.push(await this.reviewOnce(chunks[i], level, minCapability, { index: i, total: chunks.length }));
            }
            result = this.aggregateReviewResults(partials);
        }

        // 真实审查文件数（分块聚合后回填，避免被低估为分块数）
        result.filesReviewed = files.length;

        await this.cache.set(cacheKey, diffContent, level, result, CodeReviewer.VERSION);
        return result;
    }

    /**
     * 审查特定文件
     */
    async reviewFile(
        filePath: string,
        level: ReviewLevel = ReviewLevel.STANDARD
    ): Promise<ReviewResult> {
        const diff = await this.gitService.getFileDiff(filePath, true);

        if (!diff) {
            throw new Error(`No changes in file: ${filePath}`);
        }

        // Check cache first (使用 hash 作为缓存 key，避免存储大 diff)
        // P1: 传递版本号，避免模型升级后误用旧缓存
        const cachedResult = await this.cache.get(filePath, diff, level, CodeReviewer.VERSION);
        if (cachedResult) {
            console.log(chalk.gray(`💾 从缓存加载审查结果: ${filePath}`));
            return cachedResult;
        }

        if (!this.router) {
            throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
        }

        const minCapability: MinCapability = {
            minCapability: CapabilityLevel.SEMANTIC,
            fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
        };

        // P1: 单文件差异过大时分块审查后聚合，避免 substring 硬截断丢内容
        const chunks = this.splitDiffIntoChunks(diff);
        let result: ReviewResult;
        if (chunks.length === 1) {
            result = await this.reviewOnce(chunks[0], level, minCapability);
        } else {
            console.log(chalk.gray(`📦 文件差异较大，分 ${chunks.length} 块审查: ${filePath}`));
            const partials: ReviewResult[] = [];
            for (let i = 0; i < chunks.length; i++) {
                partials.push(await this.reviewOnce(chunks[i], level, minCapability, { index: i, total: chunks.length }));
            }
            result = this.aggregateReviewResults(partials);
        }
        result.filesReviewed = 1;

        // Cache the result (P1: 传递版本号)
        await this.cache.set(filePath, diff, level, result, CodeReviewer.VERSION);

        return result;
    }

    /**
     * 审查指定 commit
     * @param commitHash commit hash 或引用（如 HEAD~1, abc123）
     * @param level 审查级别
     * @returns 审查结果
     */
    async reviewCommit(
        commitHash: string,
        level: ReviewLevel = ReviewLevel.STANDARD
    ): Promise<ReviewResult> {
        const { diff, files } = await this.gitService.getCommitDiff(commitHash);

        if (!diff) {
            throw new Error(`No changes found in commit: ${commitHash}`);
        }

        if (!this.router) {
            throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
        }

        const minCapability: MinCapability = {
            minCapability: CapabilityLevel.SEMANTIC,
            fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
        };

        // P1: commit 差异过大时分块审查后聚合，避免 substring 硬截断丢内容
        const chunks = this.splitDiffIntoChunks(diff);
        let result: ReviewResult;
        if (chunks.length === 1) {
            result = await this.reviewOnce(chunks[0], level, minCapability);
        } else {
            console.log(chalk.gray(`📦 Commit 差异较大，分 ${chunks.length} 块审查: ${commitHash}`));
            const partials: ReviewResult[] = [];
            for (let i = 0; i < chunks.length; i++) {
                partials.push(await this.reviewOnce(chunks[i], level, minCapability, { index: i, total: chunks.length }));
            }
            result = this.aggregateReviewResults(partials);
        }
        result.filesReviewed = files.length;

        return result;
    }
}
