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

        // 验证 diff 格式的基本有效性
        if (!this.validateDiffFormat(diff)) {
            return { files: [], isBreaking: false, overallSummary: '无效的 diff 格式' };
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

    /**
     * 验证 diff 格式的基本有效性
     */
    private static validateDiffFormat(diff: string): boolean {
        // 检查是否包含基本的 diff 标识符
        return diff.includes('diff --git');
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

    /**
     * 解析文件路径，优先使用 --- / +++ 行
     */
    private static extractFilePaths(header: string, sourceLine?: string, targetLine?: string): { sourcePath?: string, targetPath?: string } {
        // 优先使用 --- / +++ 行来获取路径
        if (targetLine && targetLine !== '+++ /dev/null') {
            const targetMatch = targetLine.match(/^\+\+\+ (a\/)?(.+)$/);
            if (targetMatch) {
                // targetMatch[2] 是去掉 a/ 或 b/ 前缀的实际路径
                return { targetPath: targetMatch[2] };
            }
        }

        if (sourceLine && sourceLine !== '--- /dev/null') {
            const sourceMatch = sourceLine.match(/^--- (a\/)?(.+)$/);
            if (sourceMatch) {
                // sourceMatch[2] 是去掉 a/ 或 b/ 前缀的实际路径
                return { sourcePath: sourceMatch[2] };
            }
        }

        // 回退到使用 diff --git 行
        const pathMatch = header.match(/diff --git (?:a\/)?(.+?) (?:b\/)?(.+?)$/);
        if (pathMatch) {
            // 提取并清理路径，移除 a/ 和 b/ 前缀
            const sourcePath = pathMatch[1].replace(/^[ab]\//, '');
            const targetPath = pathMatch[2].replace(/^[ab]\//, '');
            return { sourcePath, targetPath };
        }

        return { sourcePath: 'unknown', targetPath: 'unknown' };
    }

    private static analyzeFileBlock(block: string): FileSemanticDiff | null {
        const lines = block.split('\n');

        // 查找 diff header、source 和 target 行
        const headerLine = lines.find(l => l.startsWith('diff --git '));
        const targetLine = lines.find(l => l.startsWith('+++ '));
        const sourceLine = lines.find(l => l.startsWith('--- '));

        if (!headerLine) return null;

        // 使用改进的路径提取方法
        const { targetPath, sourcePath } = this.extractFilePaths(headerLine, sourceLine, targetLine);

        // 优先使用 targetPath，如果不存在则使用 sourcePath（适用于删除文件的情况）
        const filePath = targetPath || sourcePath || 'unknown';

        const extension = filePath.split('.').pop()?.toLowerCase();
        const changes: SemanticChange[] = [];

        // 目前主要针对 TS/JS 进行正则分析
        if (['ts', 'js', 'tsx', 'jsx'].includes(extension || '')) {
            this.analyzeTSJSChanges(lines, changes);
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
