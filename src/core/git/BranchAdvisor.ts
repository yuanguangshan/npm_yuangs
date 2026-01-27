import { GitService } from './GitService';
import { ModelRouter } from '../modelRouter/ModelRouter';
import { TaskConfig, TaskType } from '../modelRouter/types';

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
    branchList: string[]; // 简化版，只传名字，避免 token 过多
}

/**
 * 分支建议结果
 */
export interface BranchSuggestion {
    action: 'stay' | 'switch' | 'create';
    reason: string;
    targetBranch?: string; // for switch
    newBranch?: {          // for create
        name: string;
        from: string;
        type: 'feature' | 'fix' | 'chore' | 'docs' | 'refactor' | 'test';
    };
    confidence: number; // 0-1
}

/**
 * AI 分支顾问
 */
export class BranchAdvisor {
    constructor(
        private gitService: GitService,
        private router: ModelRouter
    ) { }

    /**
     * 获取分支建议
     */
    async suggest(): Promise<BranchSuggestion> {
        const context = await this.collectContext();
        const prompt = this.buildPrompt(context);

        const taskConfig: TaskConfig = {
            type: TaskType.ANALYSIS,
            description: 'Analyze git context for branch suggestion',
        };

        // 优先使用 smart 模型进行决策
        const routingConfig = {
            strategy: 'auto' as any,
        };

        const result = await this.router.route(taskConfig, routingConfig);
        const execution = await this.router.executeTask(
            result.adapter,
            prompt,
            taskConfig
        );

        return this.parseResponse(execution.content || '{}');
    }

    private async collectContext(): Promise<BranchSuggestContext> {
        const [branchInfo, status, diff, commits] = await Promise.all([
            this.gitService.getBranches(),
            this.gitService.getStatusSummary(),
            this.gitService.getDiff(), // 获取文件名
            this.gitService.getRecentCommits(3) // 最近 3 条够了
        ]);

        return {
            currentBranch: branchInfo.current,
            workingTree: {
                modified: status.modified,
                added: status.added,
                deleted: status.deleted,
                untracked: status.untracked,
                isClean: status.modified === 0 && status.added === 0 && status.deleted === 0 && status.untracked === 0
            },
            stagedFiles: diff.files.staged,
            unstagedFiles: diff.files.unstaged,
            recentCommits: commits.map(c => ({
                message: c.message,
                date: c.date
            })),
            branchList: branchInfo.all.slice(0, 20) // 限制数量防止 token 爆炸
        };
    }

    private buildPrompt(ctx: BranchSuggestContext): string {
        return `你是一位资深的软件工程专家，擅长 Git 工作流管理。
请根据以下 Git 仓库的当前状态，分析并给出**最合理的分支操作建议**。

## 决策选项 (三选一)
1. **stay**:   当前工作区变更与当前分支主题一致，建议继续在此分支开发。
2. **switch**: 当前变更明显属于另一个已有分支的任务范围，建议切换。
3. **create**: 当前变更代表一个新的独立功能或修复，且当前分支不适合直接提交（如 main 分支），建议新建。

---

## 当前上下文

### 1. 当前位置
- 分支: ${ctx.currentBranch}

### 2. 工作区状态
- Clean: ${ctx.workingTree.isClean}
- 统计: +${ctx.workingTree.added} / ~${ctx.workingTree.modified} / -${ctx.workingTree.deleted} / ?${ctx.workingTree.untracked}

### 3. 具体变更文件
**已暂存 (Staged):**
${ctx.stagedFiles.join('\n') || '(none)'}

**未暂存 (Unstaged):**
${ctx.unstagedFiles.join('\n') || '(none)'}

### 4. 最近提交历史
${ctx.recentCommits.map(c => `- ${c.date.split(' ')[0]}: ${c.message}`).join('\n')}

### 5. 已有分支列表 (部分)
${ctx.branchList.join(', ')}

---

## 判断原则 (Priority High -> Low)
1. **主分支保护**: 如果当前在 protected 分支 (main/master/develop) 且有 feature/fix 级变更 -> **必须建议 create**。
2. **主题一致性**: 如果变更文件与当前分支名强相关 (e.g. 分支叫 fix-auth, 变更为 auth.ts) -> **建议 stay**。
3. **混合变更风险**: 如果暂存区混合了多个不相关的改动 -> **建议 create** (提示拆分)。
4. **已有分支匹配**: 如果变更内容明显对应某个已有分支 -> **建议 switch**。

---

## 输出格式 (Strict JSON)
只输出 JSON，不要 Markdown 代码块，不要额外文字。

示例:
{
  "action": "create",
  "reason": "当前在 main 分支进行了功能开发，且变更涉及 git 核心模块，建议创建独立 feature 分支。",
  "newBranch": {
    "name": "feature/git-core-enhancement",
    "from": "main",
    "type": "feature"
  },
  "confidence": 0.95
}
`;
    }

    private isValidSuggestion(x: any): x is BranchSuggestion {
        if (!x || typeof x !== 'object') return false;
        if (!['stay', 'switch', 'create'].includes(x.action)) return false;
        if (typeof x.reason !== 'string') return false;
        if (typeof x.confidence !== 'number') return false;

        if (x.action === 'create') {
            return !!(x.newBranch && typeof x.newBranch.name === 'string');
        }

        if (x.action === 'switch') {
            return typeof x.targetBranch === 'string';
        }

        return true;
    }

    private parseResponse(content: string): BranchSuggestion {
        try {
            // 尝试清理 markdown 标记
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);

            if (!this.isValidSuggestion(parsed)) {
                console.warn('AI response failed validation:', parsed);
                return { action: 'stay', reason: 'AI 建议格式不合法，已自动回退', confidence: 0 };
            }

            // 语义校验 (Schema Guard)
            let action = parsed.action;
            let reason = parsed.reason;
            let confidence = parsed.confidence;

            if (action === 'create') {
                if (!parsed.newBranch || !parsed.newBranch.name) {
                    console.warn('AI suggested create but missing branch name, falling back to stay');
                    action = 'stay';
                    reason = 'AI 建议创建分支但未提供名称，建议重新评估或手动操作';
                    confidence = 0;
                }
            }

            if (action === 'switch') {
                if (!parsed.targetBranch) {
                    console.warn('AI suggested switch but missing target branch, falling back to stay');
                    action = 'stay';
                    reason = 'AI 建议切换分支但未提供目标，建议重新评估';
                    confidence = 0;
                }
            }

            return {
                action,
                reason,
                targetBranch: parsed.targetBranch,
                newBranch: parsed.newBranch,
                confidence
            };
        } catch (e) {
            console.warn('Failed to parse AI suggestion:', e);
            // Fallback
            return {
                action: 'stay',
                reason: '无法解析 AI 建议，保持当前状态最安全',
                confidence: 0
            };
        }
    }
}
