export declare class GitWorkflowError extends Error {
    readonly code: string;
    readonly recoverable: boolean;
    constructor(message: string, code: string, recoverable?: boolean);
}
export declare class RetryableError extends Error {
    readonly attempt: number;
    readonly maxAttempts: number;
    constructor(message: string, attempt: number, maxAttempts: number);
}
export type RetryCondition = (error: any, attempt: number) => boolean;
export interface RetryOptions {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (error: any, attempt: number) => void;
    shouldRetry?: RetryCondition;
}
/**
 * 可重试的异步函数包装器
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * 判断错误是否可重试
 */
export declare function isRetryableError(error: any): boolean;
/**
 * 格式化错误消息
 */
export declare function formatError(error: any, context?: string): string;
/**
 * 创建带有重试的 AI 调用包装器
 */
export declare function createRetryableAIAdapter<T extends (...args: any[]) => Promise<any>>(fn: T, options?: RetryOptions): T;
/**
 * 错误类型
 */
export declare enum ErrorType {
    NETWORK = "NETWORK",
    TIMEOUT = "TIMEOUT",
    GIT = "GIT",
    FILESYSTEM = "FILESYSTEM",
    VALIDATION = "VALIDATION",
    PERMISSION = "PERMISSION",
    UNKNOWN = "UNKNOWN"
}
/**
 * 识别错误类型
 */
export declare function identifyErrorType(error: any): ErrorType;
/**
 * 根据错误类型提供解决建议
 */
export declare function getSuggestion(error: any): string | null;
