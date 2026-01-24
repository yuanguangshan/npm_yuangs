/**
 * 动态Prompt生成器
 * 根据运行时状态动态注入Prompt片段
 */
export interface DynamicContext {
    gitContext?: string;
    techStack?: string[];
    lastError?: string;
    errorRecovery?: string;
}
/**
 * 检测Git上下文（增强版，支持子目录检测）
 */
export declare function detectGitContext(): Promise<string | null>;
/**
 * 检测技术栈（使用Promise.all并发检测，提升性能）
 */
export declare function detectTechStack(): Promise<string[]>;
/**
 * 生成技术栈指导
 */
export declare function generateTechStackGuidance(stacks: string[]): string;
/**
 * 生成错误恢复指导
 */
export declare function generateErrorRecovery(lastError: string): string;
/**
 * 构建动态上下文
 */
export declare function buildDynamicContext(lastError?: string, includeTechStack?: boolean): Promise<DynamicContext>;
/**
 * 将动态上下文注入到Prompt
 */
export declare function injectDynamicContext(basePrompt: string, context: DynamicContext): string;
