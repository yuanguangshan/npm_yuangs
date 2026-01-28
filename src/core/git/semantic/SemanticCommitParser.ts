import { GitService } from '../GitService';
import { SemanticDiffEngine } from './SemanticDiffEngine';
import { SemanticCommitExplanation, HistoryExplanationResult } from './historyTypes';
import { runLLM } from '../../../agent/llm';
import { DEFAULT_AI_MODEL } from '../constants';
import { ChangeType } from './types';

export class SemanticCommitParser {
    constructor(private gitService: GitService) { }

    /**
     * 分析最近的提交历史并生成语义解释
     */
    async parseHistory(count: number = 5, model: string = DEFAULT_AI_MODEL): Promise<HistoryExplanationResult> {
        const commits = await this.gitService.getRecentCommits(count);
        const explanations: SemanticCommitExplanation[] = [];

        for (const commit of commits) {
            const { diff } = await this.gitService.getCommitDiff(commit.hash);
            const structuralChanges = SemanticDiffEngine.analyze(diff || '');

            // 启发式判断影响等级
            let impactLevel: SemanticCommitExplanation['impactLevel'] = 'low';
            if (structuralChanges.isBreaking) {
                impactLevel = 'breaking';
            } else if (structuralChanges.files.length > 5 || structuralChanges.files.some(f => f.changes.length > 3)) {
                impactLevel = 'high';
            } else if (structuralChanges.files.length > 2 || structuralChanges.files.some(f => f.changes.length > 0)) {
                impactLevel = 'medium';
            }

            // 使用 AI 生成语义摘要
            const semanticSummary = await this.generateSemanticSummary(commit, structuralChanges, model);

            explanations.push({
                ...commit,
                originalMessage: commit.message,
                semanticSummary,
                structuralChanges,
                impactLevel
            });
        }

        const overallSummary = await this.generateOverallHistorySummary(explanations, model);

        return {
            commits: explanations,
            overallSummary
        };
    }

    private async generateSemanticSummary(commit: any, structural: any, model: string): Promise<string> {
        const structuralDesc = structural.files.map((f: any) => {
            const changes = f.changes.map((c: any) => `${c.type === ChangeType.ADDITION ? '新增' : '删除'} ${c.category}: ${c.name}`).join(', ');
            return `- ${f.path}: ${changes || '非组件类代码变更'}`;
        }).join('\n');

        const prompt = {
            system: '你是一个资深技术专家。请结合 Git Commit Message 和识别出的代码结构化变更（函数、类、接口等），用一句话总结该提交的真实技术意图。',
            messages: [
                {
                    role: 'user' as const,
                    content: `原始消息: ${commit.message}\n结构化变更:\n${structuralDesc || '无明显结构化组件变更'}`
                }
            ]
        };

        try {
            const response = await runLLM({ prompt, model, stream: false });
            return response.rawText.trim();
        } catch (e) {
            return '无法生成语义摘要';
        }
    }

    private async generateOverallHistorySummary(explanations: SemanticCommitExplanation[], model: string): Promise<string> {
        const historyData = explanations.map(e => `- [${e.impactLevel.toUpperCase()}] ${e.semanticSummary}`).join('\n');

        const prompt = {
            system: '请总结以下最近的提交历史，描述该项目目前正处于什么样的开发阶段或趋势。',
            messages: [
                {
                    role: 'user' as const,
                    content: `历史摘要列表:\n${historyData}`
                }
            ]
        };

        try {
            const response = await runLLM({ prompt, model, stream: false });
            return response.rawText.trim();
        } catch (e) {
            return '无法生成整体历史总结';
        }
    }
}
