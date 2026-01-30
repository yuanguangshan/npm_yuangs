/**
 * Git 命令工具函数
 */

/**
 * LLM 输出清理策略
 */
export enum CleanStrategy {
    /** 保守模式：仅清理明确的 Markdown fence */
    CONSERVATIVE = 'conservative',
    /** 宽松模式：清理 fence 和常见对话式前缀/后缀 */
    LENIENT = 'lenient',
}

/**
 * 清理 LLM 输出中的格式化标记
 * 
 * 适用场景：
 * - LLM 返回的内容被包裹在 Markdown 代码块中（```markdown ... ```）
 * - LLM 添加了对话式前缀（如"好的"、"这是"）或后缀（如"希望这对你有帮助"）
 * 
 * 限制：
 * - 仅处理 Markdown fence 和简单的对话式文本
 * - 不处理其他格式异常（如 JSON、XML 包裹等）
 * - 假设内容主体是有效的 Markdown 文本
 * 
 * 未来扩展：
 * - 可添加 JSON/XML 格式的检测和清理
 * - 可添加更多对话式模式的识别
 * - 可支持自定义清理规则
 * 
 * @param content LLM 原始输出
 * @param strategy 清理策略（默认：保守模式）
 * @returns 清理后的内容
 * 
 * @example
 * ```typescript
 * // 保守模式（默认）
 * cleanLLMOutput('```markdown\n# Title\n```') // => '# Title'
 * 
 * // 宽松模式
 * cleanLLMOutput('好的，这是内容\n# Title\n希望有帮助', CleanStrategy.LENIENT)
 * // => '# Title'
 * ```
 */
export function cleanLLMOutput(
    content: string,
    strategy: CleanStrategy = CleanStrategy.CONSERVATIVE
): string {
    let cleaned = content.trim();

    // 检测并移除 Markdown fence
    const hasOpeningFence = /^```(markdown|md)?\s*\n/i.test(cleaned);
    const hasClosingFence = /\n\s*```$/.test(cleaned);

    if (hasOpeningFence || hasClosingFence) {
        // 仅在存在 fence 时进行清理
        cleaned = cleaned.replace(/^```(markdown|md)?\s*\n/i, '');
        cleaned = cleaned.replace(/\n\s*```$/, '');
    }

    // 宽松模式：额外清理对话式前缀和后缀
    if (strategy === CleanStrategy.LENIENT) {
        // 移除常见的对话式前缀（如"好的"、"这是"、"以下是"等）
        cleaned = cleaned.replace(/^(好的[，,。.]?|这是|以下是|为您生成|已生成)[^\n]*\n+/i, '');

        // 移除常见的对话式后缀（如"希望这对你有帮助"等）
        cleaned = cleaned.replace(/\n+(希望|祝|如有|还有)[^\n]*$/i, '');
    }

    return cleaned.trim();
}

/**
 * 对文件列表进行去重
 * 
 * 用于合并 staged 和 unstaged 文件列表时避免重复计数
 * 
 * @param files 文件路径数组
 * @returns 去重后的文件路径数组
 * 
 * @example
 * ```typescript
 * const staged = ['src/a.ts', 'src/b.ts'];
 * const unstaged = ['src/b.ts', 'src/c.ts'];
 * deduplicateFiles([...staged, ...unstaged])
 * // => ['src/a.ts', 'src/b.ts', 'src/c.ts']
 * ```
 */
export function deduplicateFiles(files: string[]): string[] {
    return Array.from(new Set(files));
}

/**
 * 获取 Capability Level 的显示名称
 * 
 * 提供 fallback 处理，避免枚举变更破坏输出
 * 
 * @param level Capability Level 枚举值
 * @returns 显示名称
 * 
 * @example
 * ```typescript
 * getCapabilityLevelDisplay(4) // => 'SEMANTIC'
 * getCapabilityLevelDisplay(999) // => 'UNKNOWN(999)'
 * ```
 */
export function getCapabilityLevelDisplay(level: number): string {
    const levelNames: Record<number, string> = {
        0: 'NONE',
        1: 'TEXT',
        2: 'LINE',
        3: 'STRUCTURAL',
        4: 'SEMANTIC',
    };

    return levelNames[level] || `UNKNOWN(${level})`;
}
