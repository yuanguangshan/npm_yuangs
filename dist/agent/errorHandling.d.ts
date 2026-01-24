/**
 * 错误处理和重试机制
 * 智能处理LLM调用失败，提供自动重试和替代方案
 */
export interface RetryConfig {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: string[];
}
export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
    lastError?: Error;
    fallbackUsed?: boolean;
}
export interface AlternativeStrategy<T> {
    name: string;
    description: string;
    execute: () => Promise<T>;
}
/**
 * 自动重试执行器
 */
export declare function withRetry<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<RetryResult<T>>;
/**
 * 带替代方案的执行器
 */
export declare function withAlternatives<T>(primary: () => Promise<T>, alternatives: AlternativeStrategy<T>[], config?: Partial<RetryConfig>): Promise<RetryResult<T>>;
/**
 * 生成错误解释
 */
export declare function generateErrorExplanation(error: Error, context?: string): string;
/**
 * 创建替代策略
 */
export declare function createAlternativeStrategy<T>(name: string, description: string, execute: () => Promise<T>): AlternativeStrategy<T>;
