import {
    SemanticDiffResult,
    FileSemanticDiff,
    SemanticChange,
    ChangeType,
    SemanticCategory
} from './types';

/**
 * SemanticDiffEngine: 启发式语义差异分析引擎
 * 目前采用正则匹配方案进行快速分析。
 * 注意：由于基于正则，在处理复杂嵌套、多行声明或注释干扰时可能存在误判。
 * 未来演进方向：接入 TypeScript Compiler API 进行 AST 级分析。
 */
export class SemanticDiffEngine {
    /**
     * 解析 Git Diff 输出并提取语义变更
     */
    public static analyze(diff: string): SemanticDiffResult {
        if (!diff || typeof diff !== 'string') {
            return { files: [], isBreaking: false, overallSummary: '无变更内容或格式错误' };
        }

        const fileBlocks = this.splitDiffIntoFiles(diff);
        const fileDiffs: FileSemanticDiff[] = [];

        for (const block of fileBlocks) {
            const fileDiff = this.analyzeFileBlock(block);
            if (fileDiff) {
                fileDiffs.push(fileDiff);
            }
        }

        const isBreaking = fileDiffs.some(f => f.changes.some(c => c.isBreaking));

        return {
            files: fileDiffs,
            isBreaking,
            overallSummary: this.generateOverallSummary(fileDiffs)
        };
    }

    private static splitDiffIntoFiles(diff: string): string[] {
        const blocks: string[] = [];
        const lines = diff.split('\n');
        let currentBlock: string[] = [];

        for (const line of lines) {
            if (line.startsWith('diff --git ')) {
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock.join('\n'));
                }
                currentBlock = [line];
            } else if (currentBlock.length > 0) {
                currentBlock.push(line);
            }
        }
        if (currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'));
        }

        return blocks;
    }

    private static analyzeFileBlock(block: string): FileSemanticDiff | null {
        const lines = block.split('\n');

        let filePath = 'unknown';
        const targetLine = lines.find(l => l.startsWith('+++ '));
        const sourceLine = lines.find(l => l.startsWith('--- '));

        if (targetLine && targetLine !== '+++ /dev/null') {
            filePath = targetLine.startsWith('+++ b/') ? targetLine.substring(6) : targetLine.substring(4);
        } else if (sourceLine && sourceLine !== '--- /dev/null') {
            filePath = sourceLine.startsWith('--- a/') ? sourceLine.substring(6) : sourceLine.substring(4);
        } else {
            const header = lines.find(l => l.startsWith('diff --git '));
            if (!header) return null;
            const pathMatch = header.match(/b\/(.+)$/);
            filePath = pathMatch ? pathMatch[1] : 'unknown';
        }

        const extension = filePath.split('.').pop()?.toLowerCase();
        const changes: SemanticChange[] = [];

        // 目前主要针对 TS/JS 进行正则分析
        if (['ts', 'js', 'tsx', 'jsx'].includes(extension || '')) {
            this.analyzeTSJSChanges(lines, changes);
        }

        // 如果路径是 /dev/null 说明是彻底删除文件
        if (filePath === '/dev/null') {
            const sourceLine = lines.find(l => l.startsWith('--- a/'));
            if (sourceLine) filePath = sourceLine.substring(6);
        }

        return {
            path: filePath,
            changes,
            summary: this.generateFileSummary(changes)
        };
    }

    private static analyzeTSJSChanges(lines: string[], changes: SemanticChange[]): void {
        // 匹配函数定义的正则 (启发式)
        const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/;
        const arrowFuncRegex = /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?(?:\(?.*?\)?)\s*=>/;
        const classRegex = /(?:export\s+)?class\s+([a-zA-Z0-9_]+)/;
        const interfaceRegex = /(?:export\s+)?interface\s+([a-zA-Z0-9_]+)/;

        for (const line of lines) {
            // 只分析新增(+)或删除(-)行，排除 diff header 标记行
            if (!line.startsWith('+') && !line.startsWith('-')) continue;
            if (line.startsWith('+++') || line.startsWith('---')) continue;

            const content = line.substring(1).trim();

            // 跳过单行注释
            if (content.startsWith('//') || content.startsWith('/*')) continue;

            const type = line.startsWith('+') ? ChangeType.ADDITION : ChangeType.DELETION;
            let match;

            if (match = content.match(funcRegex) || content.match(arrowFuncRegex)) {
                changes.push({
                    type,
                    category: SemanticCategory.FUNCTION,
                    name: match[1],
                    isBreaking: type === ChangeType.DELETION
                });
            } else if (match = content.match(classRegex)) {
                changes.push({
                    type,
                    category: SemanticCategory.CLASS,
                    name: match[1],
                    isBreaking: type === ChangeType.DELETION
                });
            } else if (match = content.match(interfaceRegex)) {
                changes.push({
                    type,
                    category: SemanticCategory.INTERFACE,
                    name: match[1],
                    isBreaking: type === ChangeType.DELETION
                });
            }
        }
    }

    private static generateFileSummary(changes: SemanticChange[]): string {
        if (changes.length === 0) return '代码逻辑变更';
        const addCount = changes.filter(c => c.type === ChangeType.ADDITION).length;
        const delCount = changes.filter(c => c.type === ChangeType.DELETION).length;
        return `修改了 ${changes.length} 个结构化组件 (${addCount} 新增, ${delCount} 移除)`;
    }

    private static generateOverallSummary(files: FileSemanticDiff[]): string {
        const totalChanges = files.reduce((sum, f) => sum + f.changes.length, 0);
        const breakingFiles = files.filter(f => f.changes.some(c => c.isBreaking)).length;

        let summary = `分析了 ${files.length} 个文件，共检测到 ${totalChanges} 处关键语法节点变更。`;
        if (breakingFiles > 0) {
            summary += ` 🚨 注意：其中 ${breakingFiles} 个文件包含可能影响 API 兼容性的变更。`;
        }
        return summary;
    }
}
