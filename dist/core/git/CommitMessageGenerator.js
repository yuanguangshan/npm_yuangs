"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitMessageGenerator = void 0;
const types_1 = require("../modelRouter/types");
/**
 * 智能 Commit Message 生成器
 */
class CommitMessageGenerator {
    gitService;
    router;
    constructor(gitService, router) {
        this.gitService = gitService;
        this.router = router;
    }
    /**
     * 分析 diff 获取统计信息
     */
    analyzeDiff(diff) {
        const lines = diff.split('\n');
        let insertions = 0;
        let deletions = 0;
        const files = new Set();
        for (const line of lines) {
            if (line.startsWith('+++') || line.startsWith('---')) {
                const match = line.match(/[ab]\/(.*)/);
                if (match && match[1] !== '/dev/null') {
                    files.add(match[1]);
                }
            }
            else if (line.startsWith('+') && !line.startsWith('+++')) {
                insertions++;
            }
            else if (line.startsWith('-') && !line.startsWith('---')) {
                deletions++;
            }
        }
        return { insertions, deletions, files };
    }
    /**
     * 构建 AI 提示词
     */
    buildPrompt(diff, config) {
        const stats = this.analyzeDiff(diff);
        let projectContext = '';
        try {
            // 尝试获取简单的项目上下文（这里做轻量尝试，不阻塞）
            const cwd = process.cwd();
            const path = require('path');
            const fs = require('fs');
            const pkgPath = path.join(cwd, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                projectContext = `
## 项目上下文
- 项目名称: ${pkg.name || 'unknown'}
- 项目描述: ${pkg.description || 'none'}
`;
            }
        }
        catch (e) {
            // 忽略读取错误
        }
        let prompt = `你是一个专业的 Git commit message 生成助手。请根据以下代码变更生成符合规范的 commit message。
${projectContext}

## 变更统计
- 文件数: ${stats.files.size}
- 新增行: ${stats.insertions}
- 删除行: ${stats.deletions}

## 代码变更
\`\`\`diff
${diff.substring(0, 8000)} ${diff.length > 8000 ? '\n... (内容过长,已截断)' : ''}
\`\`\`

## 要求
1. 使用 Conventional Commits 规范
2. 格式: <type>(<scope>): <subject>
3. type 可选: feat, fix, docs, style, refactor, perf, test, chore
4. subject 使用中文,简洁明了(不超过50字)
5. ${config.detailed ? '需要包含详细的 body 说明,解释变更的原因和影响' : '只需要生成简洁的标题即可'}
${config.type ? `6. 必须使用 type: ${config.type}` : ''}
${config.scope ? `7. 必须使用 scope: ${config.scope}` : ''}

## 输出格式
请直接输出 commit message,不要有任何额外解释。
${config.detailed ? '如果有 body,用空行分隔 subject 和 body。' : ''}`;
        return prompt;
    }
    /**
     * 使用 AI 生成 commit message
     */
    async generateWithAI(diff, config = {}) {
        if (!this.router) {
            throw new Error('ModelRouter not configured');
        }
        const prompt = this.buildPrompt(diff, config);
        const taskConfig = {
            type: types_1.TaskType.CODE_GENERATION,
            description: 'Generate git commit message',
        };
        const routingConfig = {
            strategy: 'auto',
        };
        const result = await this.router.route(taskConfig, routingConfig);
        const execution = await this.router.executeTask(result.adapter, prompt, taskConfig);
        if (!execution.success || !execution.content) {
            throw new Error('Failed to generate commit message');
        }
        return execution.content.trim();
    }
    /**
     * 生成基于规则的 commit message (fallback)
     */
    generateRuleBased(diff, config) {
        const stats = this.analyzeDiff(diff);
        const files = Array.from(stats.files);
        // 智能推断 type
        let type = config.type || 'chore';
        if (files.some(f => f.includes('test'))) {
            type = 'test';
        }
        else if (files.some(f => f.match(/\.(md|txt)$/))) {
            type = 'docs';
        }
        else if (stats.insertions > stats.deletions * 2) {
            type = 'feat';
        }
        else if (stats.deletions > stats.insertions) {
            type = 'refactor';
        }
        // 智能推断 scope
        const scope = config.scope || this.inferScope(files);
        // 生成 subject
        const subject = this.generateSubject(files, stats);
        return `${type}${scope ? `(${scope})` : ''}: ${subject}`;
    }
    /**
     * 推断变更范围
     */
    inferScope(files) {
        if (files.length === 0)
            return '';
        // 提取第一级目录作为 scope
        const dirs = files
            .map(f => f.split('/')[0])
            .filter(d => d !== 'src' && d !== 'test');
        const uniqueDirs = [...new Set(dirs)];
        if (uniqueDirs.length === 1) {
            return uniqueDirs[0];
        }
        return '';
    }
    /**
     * 生成 subject
     */
    generateSubject(files, stats) {
        if (files.length === 1) {
            const fileName = files[0].split('/').pop()?.replace(/\.[^.]+$/, '');
            return `更新 ${fileName}`;
        }
        if (files.length <= 3) {
            return `更新 ${files.map(f => f.split('/').pop()).join(', ')}`;
        }
        return `更新 ${files.length} 个文件 (+${stats.insertions}/-${stats.deletions})`;
    }
    /**
     * 生成完整的 commit message
     */
    async generate(config = {}) {
        const { GitContextAggregator } = await Promise.resolve().then(() => __importStar(require('./GitContextAggregator')));
        const aggregator = new GitContextAggregator(this.gitService);
        const ctx = await aggregator.collect();
        // 使用统一的 Policy 校验
        aggregator.ensureStaged(ctx);
        const diffContent = ctx.diff.staged || '';
        const stats = this.analyzeDiff(diffContent);
        let message;
        try {
            // 优先使用 AI 生成
            if (this.router) {
                message = await this.generateWithAI(diffContent, config);
            }
            else {
                message = this.generateRuleBased(diffContent, config);
            }
        }
        catch (error) {
            console.warn('AI generation failed, falling back to rule-based:', error);
            message = this.generateRuleBased(diffContent, config);
        }
        // 分离 title 和 body
        const parts = message.split('\n\n');
        const title = parts[0];
        const body = parts.slice(1).join('\n\n');
        return {
            title,
            body: body || undefined,
            full: message,
            summary: {
                filesChanged: stats.files.size,
                insertions: stats.insertions,
                deletions: stats.deletions,
            },
        };
    }
}
exports.CommitMessageGenerator = CommitMessageGenerator;
//# sourceMappingURL=CommitMessageGenerator.js.map