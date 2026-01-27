"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeReviewer = exports.IssueSeverity = exports.ReviewLevel = void 0;
const chalk_1 = __importDefault(require("chalk"));
const types_1 = require("../modelRouter/types");
/**
 * 代码审查级别
 */
var ReviewLevel;
(function (ReviewLevel) {
    /** 快速审查 - 只看明显问题 */
    ReviewLevel["QUICK"] = "quick";
    /** 标准审查 - 常规检查 */
    ReviewLevel["STANDARD"] = "standard";
    /** 深度审查 - 全面分析 */
    ReviewLevel["DEEP"] = "deep";
})(ReviewLevel || (exports.ReviewLevel = ReviewLevel = {}));
/**
 * 审查问题严重程度
 */
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["INFO"] = "info";
    IssueSeverity["WARNING"] = "warning";
    IssueSeverity["ERROR"] = "error";
    IssueSeverity["CRITICAL"] = "critical";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
/**
 * AI 代码审查器
 */
class CodeReviewer {
    gitService;
    router;
    static VERSION = 'v1.0';
    constructor(gitService, router) {
        this.gitService = gitService;
        this.router = router;
    }
    /**
     * 构建审查提示词
     */
    buildReviewPrompt(diff, level) {
        const levelInstructions = {
            [ReviewLevel.QUICK]: '快速扫描,只关注明显的 bug、安全问题和严重的代码异味',
            [ReviewLevel.STANDARD]: '进行标准的代码审查,包括代码质量、最佳实践、潜在问题',
            [ReviewLevel.DEEP]: '进行深度审查,包括架构设计、性能优化、安全性、可维护性等所有方面',
        };
        return `你是一位资深的代码审查专家。请对以下代码变更进行${levelInstructions[level]}。

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
  ]
}
\`\`\`

请确保输出是有效的 JSON 格式。`;
    }
    /**
     * 解析 AI 返回的审查结果
     */
    parseReviewResult(content) {
        try {
            // 尝试提取 JSON
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                content.match(/{[\s\S]*}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(jsonStr);
            }
            // 如果没有 JSON,尝试解析文本
            return this.parseTextReview(content);
        }
        catch (error) {
            console.warn('Failed to parse review result:', error);
            return {
                score: 70,
                summary: content.substring(0, 200),
                issues: [],
                strengths: [],
                recommendations: [],
            };
        }
    }
    /**
     * 解析文本格式的审查结果
     */
    parseTextReview(content) {
        const issues = [];
        const strengths = [];
        const recommendations = [];
        // 简单的文本解析逻辑
        const lines = content.split('\n');
        let currentSection = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('问题') || trimmed.includes('Issue')) {
                currentSection = 'issues';
            }
            else if (trimmed.includes('优点') || trimmed.includes('Strength')) {
                currentSection = 'strengths';
            }
            else if (trimmed.includes('建议') || trimmed.includes('Recommend')) {
                currentSection = 'recommendations';
            }
            else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const item = trimmed.substring(1).trim();
                if (currentSection === 'strengths') {
                    strengths.push(item);
                }
                else if (currentSection === 'recommendations') {
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
        };
    }
    /**
     * 执行代码审查
     */
    async review(level = ReviewLevel.STANDARD, staged = true) {
        const diff = await this.gitService.getDiff();
        const diffContent = staged ? diff.staged : diff.unstaged;
        if (!diffContent) {
            throw new Error('No changes to review');
        }
        const files = staged ? diff.files.staged : diff.files.unstaged;
        // Guardrail: Deep review 模式下文件数量保护
        if (level === ReviewLevel.DEEP && files.length > 20) {
            throw new Error('Deep review is not recommended for more than 20 files.\n' +
                'Please use "--level standard" or review specific files using "--file".');
        }
        if (!this.router) {
            throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
        }
        const prompt = this.buildReviewPrompt(diffContent, level);
        const taskConfig = {
            type: types_1.TaskType.CODE_REVIEW,
            description: 'Review code changes',
        };
        const routingConfig = {
            strategy: 'auto',
        };
        const routingResult = await this.router.route(taskConfig, routingConfig);
        console.log(chalk_1.default.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
        console.log(chalk_1.default.gray(`📋 理由: ${routingResult.reason}\n`));
        const execution = await this.router.executeTask(routingResult.adapter, prompt, taskConfig);
        if (!execution.success || !execution.content) {
            throw new Error('Failed to perform code review');
        }
        const parsed = this.parseReviewResult(execution.content);
        return {
            score: parsed.score || 70,
            summary: parsed.summary || '审查完成',
            issues: parsed.issues || [],
            strengths: parsed.strengths || [],
            recommendations: parsed.recommendations || [],
            filesReviewed: files.length,
        };
    }
    /**
     * 审查特定文件
     */
    async reviewFile(filePath, level = ReviewLevel.STANDARD) {
        const diff = await this.gitService.getFileDiff(filePath, true);
        if (!diff) {
            throw new Error(`No changes in file: ${filePath}`);
        }
        if (!this.router) {
            throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
        }
        const prompt = this.buildReviewPrompt(diff, level);
        const taskConfig = {
            type: types_1.TaskType.CODE_REVIEW,
            description: `Review file: ${filePath}`,
        };
        const routingConfig = {
            strategy: 'auto',
        };
        const routingResult = await this.router.route(taskConfig, routingConfig);
        console.log(chalk_1.default.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
        console.log(chalk_1.default.gray(`📋 理由: ${routingResult.reason}\n`));
        const execution = await this.router.executeTask(routingResult.adapter, prompt, taskConfig);
        if (!execution.success || !execution.content) {
            throw new Error('Failed to perform code review');
        }
        const parsed = this.parseReviewResult(execution.content);
        return {
            score: parsed.score || 70,
            summary: parsed.summary || '审查完成',
            issues: parsed.issues || [],
            strengths: parsed.strengths || [],
            recommendations: parsed.recommendations || [],
            filesReviewed: 1,
        };
    }
}
exports.CodeReviewer = CodeReviewer;
//# sourceMappingURL=CodeReviewer.js.map