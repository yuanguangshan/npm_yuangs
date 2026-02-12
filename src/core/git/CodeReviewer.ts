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
    private buildReviewPrompt(diff: string, level: ReviewLevel, capabilityLevel: CapabilityLevel): string {
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

## 代码变更
\`\`\`diff
${diff.substring(0, 15000)}${diff.length > 15000 ? '\n... (diff 过长,已截断)' : ''}
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

        const minCapability: MinCapability = {
            minCapability: CapabilityLevel.SEMANTIC,
            fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
        };

        let currentCapability = minCapability.minCapability;
        let confidence = 1.0;
        let degradationApplied = false;
        let degradationReason = '';
        const startTime = Date.now();

        const taskConfig: TaskConfig = {
            type: TaskType.CODE_REVIEW,
            description: 'Review code changes',
        };

        const routingConfig = {
            strategy: 'auto' as any,
        };

        const routingResult = await this.router.route(taskConfig, routingConfig);
        console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
        console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));

        const prompt = this.buildReviewPrompt(diffContent, level, currentCapability);

        const execution = await this.router.executeTask(
            routingResult.adapter,
            prompt,
            taskConfig
        );

        if (!execution.success || !execution.content) {
            throw new Error('Failed to perform code review');
        }

        const timeElapsed = Date.now() - startTime;

        const parsed = this.parseReviewResult(execution.content);
        confidence = parsed.confidence ?? 0.8;

        const decisionInput: DecisionInput = {
            timeElapsed,
            confidence,
        };

        const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);

        if (degradationDecision.shouldDegrade && currentCapability !== degradationDecision.targetLevel) {
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
            filesReviewed: files.length,
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

        let currentCapability = minCapability.minCapability;
        let confidence = 1.0;
        let degradationApplied = false;
        let degradationReason = '';
        const startTime = Date.now();

        const taskConfig: TaskConfig = {
            type: TaskType.CODE_REVIEW,
            description: `Review file: ${filePath}`,
        };

        const routingConfig = {
            strategy: 'auto' as any,
        };

        const routingResult = await this.router.route(taskConfig, routingConfig);
        console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
        console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));

        const prompt = this.buildReviewPrompt(diff, level, currentCapability);

        const execution = await this.router.executeTask(
            routingResult.adapter,
            prompt,
            taskConfig
        );

        if (!execution.success || !execution.content) {
            throw new Error('Failed to perform code review');
        }

        const timeElapsed = Date.now() - startTime;

        const parsed = this.parseReviewResult(execution.content);
        confidence = parsed.confidence ?? 0.8;

        const decisionInput: DecisionInput = {
            timeElapsed,
            confidence,
        };

        const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);

        if (degradationDecision.shouldDegrade && currentCapability !== degradationDecision.targetLevel) {
            degradationApplied = true;
            degradationReason = degradationDecision.reason;
            console.log(chalk.yellow(`⚠️  降级触发: ${degradationReason}`));
        }

        const result: ReviewResult = {
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

        let currentCapability = minCapability.minCapability;
        let confidence = 1.0;
        let degradationApplied = false;
        let degradationReason = '';
        const startTime = Date.now();

        const taskConfig: TaskConfig = {
            type: TaskType.CODE_REVIEW,
            description: `Review commit: ${commitHash}`,
        };

        const routingConfig = {
            strategy: 'auto' as any,
        };

        const routingResult = await this.router.route(taskConfig, routingConfig);
        console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
        console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));

        const prompt = this.buildReviewPrompt(diff, level, currentCapability);

        const execution = await this.router.executeTask(
            routingResult.adapter,
            prompt,
            taskConfig
        );

        if (!execution.success || !execution.content) {
            throw new Error('Failed to perform code review');
        }

        const timeElapsed = Date.now() - startTime;

        const parsed = this.parseReviewResult(execution.content);
        confidence = parsed.confidence ?? 0.8;

        const decisionInput: DecisionInput = {
            timeElapsed,
            confidence,
        };

        const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);

        if (degradationDecision.shouldDegrade && currentCapability !== degradationDecision.targetLevel) {
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
            filesReviewed: files.length,
            confidence,
            degradation: degradationApplied ? {
                applied: true,
                originalLevel: minCapability.minCapability,
                targetLevel: degradationDecision.targetLevel,
                reason: degradationReason,
            } : undefined,
        };
    }
}
