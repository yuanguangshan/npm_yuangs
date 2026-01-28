import { GitService } from './GitService';
import { runLLM } from '../../agent/llm';
import { DEFAULT_AI_MODEL } from './constants';
import { SemanticDiffEngine } from './semantic/SemanticDiffEngine';
import chalk from 'chalk';

export interface CommitGroup {
    id: string;
    title: string;
    files: string[];
    description: string;
    suggestedMessage: string;
}

export interface SmartCommitPlan {
    groups: CommitGroup[];
    remainingFiles: string[];
}

export class SmartCommitManager {
    constructor(private gitService: GitService) { }

    /**
     * 分析工作区变更并生成分步提交计划
     */
    async planCommits(model: string = DEFAULT_AI_MODEL): Promise<SmartCommitPlan> {
        const root = await this.gitService.getRepoRoot();
        const status = await this.gitService.execSafe('status --porcelain');

        if (!status) {
            return { groups: [], remainingFiles: [] };
        }

        const changedFiles = status.split('\n')
            .filter(line => line.length > 3)
            .map(line => ({
                path: line.substring(3).trim(),
                status: line.substring(0, 2).trim()
            }));

        if (changedFiles.length === 0) {
            return { groups: [], remainingFiles: [] };
        }

        // 获取每个文件的语义摘要，帮助 AI 分组
        const fileSummaries = await Promise.all(changedFiles.map(async (file) => {
            try {
                const diff = await this.gitService.getFileDiff(file.path, false);
                const semantic = SemanticDiffEngine.analyze(diff || '');
                return {
                    path: file.path,
                    status: file.status,
                    summary: semantic.overallSummary,
                    details: semantic.files[0]?.changes.map(c => `${c.type} ${c.category}: ${c.name}`).join(', ') || '逻辑代码修改'
                };
            } catch (e) {
                return { path: file.path, status: file.status, summary: '无法分析', details: '' };
            }
        }));

        const prompt = {
            system: `你是一个 Git 专家。用户的当前工作区有很多未提交的变更。
你的任务是将这些变更归类为逻辑上独立的“提交组”（Commit Groups）。
例如：UI 相关的改动分为一组，核心逻辑修复分为一组，配置更新分为一组。
对于每一组，请提供：
1. Group Title (短标题)
2. Files (该组包含的文件路径列表)
3. Suggested Message (符合 Conventional Commits 规范的提交消息)

请以 JSON 格式输出：
{
  "groups": [
    {
      "title": "...",
      "files": ["...", "..."],
      "suggestedMessage": "feat/fix/...: ..."
    }
  ]
}

规则：
- **不要**漏掉任何文件（除非文件完全无关，则不放入组中）。
- 确保路径与输入完全一致。
- 逻辑相关的变更必须在一起。`,
            messages: [
                {
                    role: 'user' as const,
                    content: `变更文件列表及摘要：\n${JSON.stringify(fileSummaries, null, 2)}`
                }
            ]
        };

        try {
            const response = await runLLM({ prompt, model, stream: false });
            // 尝试解析 JSON (可能需要清理 markdown)
            const cleanText = response.rawText.replace(/```json|```/g, '').trim();
            const plan = JSON.parse(cleanText);

            // 找出漏掉的文件
            const plannedFiles = new Set(plan.groups.flatMap((g: any) => g.files));
            const remainingFiles = changedFiles.map(f => f.path).filter(p => !plannedFiles.has(p));

            return {
                groups: plan.groups.map((g: any, index: number) => ({
                    ...g,
                    id: (index + 1).toString(),
                    description: g.title
                })),
                remainingFiles
            };
        } catch (e) {
            // 回退策略：所有文件放一组
            return {
                groups: [{
                    id: '1',
                    title: '所有变更',
                    files: changedFiles.map(f => f.path),
                    description: '自动归类的未分组变更',
                    suggestedMessage: 'chore: updated multiple files'
                }],
                remainingFiles: []
            };
        }
    }

    /**
     * 执行特定的提交组
     */
    async executeCommitGroup(group: CommitGroup): Promise<string> {
        // 1. 强制 stage 组内文件
        await this.gitService.stageFiles(group.files);

        // 2. 执行提交
        const result = await this.gitService.commit(group.suggestedMessage);
        return result;
    }
}
