import chalk from 'chalk';

export class GitWorkflowError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly recoverable: boolean = true
    ) {
        super(message);
        this.name = 'GitWorkflowError';
    }
}

export class RetryableError extends Error {
    constructor(
        message: string,
        public readonly attempt: number,
        public readonly maxAttempts: number
    ) {
        super(message);
        this.name = 'RetryableError';
    }
}

export type RetryCondition = (error: any, attempt: number) => boolean;

export interface RetryOptions {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (error: any, attempt: number) => void;
    shouldRetry?: RetryCondition;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    onRetry: () => {},
    shouldRetry: () => true
};

/**
 * 可重试的异步函数包装器
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // 检查是否应该重试
            if (attempt >= opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
                throw error;
            }
            
            // 计算延迟时间（支持指数退避）
            const delay = opts.backoff 
                ? opts.delay * Math.pow(2, attempt - 1) 
                : opts.delay;
            
            // 调用重试回调
            if (opts.onRetry) {
                opts.onRetry(error, attempt);
            }
            
            // 等待
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    
    // 网络相关错误
    if (message.includes('network') || 
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('econnreset') ||
        message.includes('etimedout')) {
        return true;
    }
    
    // HTTP 状态码
    if (error.statusCode) {
        return error.statusCode >= 500 || error.statusCode === 429;
    }
    
    // Git 相关错误
    if (message.includes('git') && (
        message.includes('lock') ||
        message.includes('busy')
    )) {
        return true;
    }
    
    return false;
}

/**
 * 格式化错误消息
 */
export function formatError(error: any, context?: string): string {
    const parts: string[] = [];
    
    if (context) {
        parts.push(chalk.red(`[${context}]`));
    }
    
    if (error.name && error.name !== 'Error') {
        parts.push(chalk.yellow(error.name));
    }
    
    if (error.message) {
        parts.push(error.message);
    }
    
    if (error.code) {
        parts.push(chalk.gray(`(code: ${error.code})`));
    }
    
    return parts.join(' ');
}

/**
 * 创建带有重试的 AI 调用包装器
 */
export function createRetryableAIAdapter<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: RetryOptions
): T {
    return (async (...args: any[]) => {
        return withRetry(() => fn(...args), {
            ...options,
            shouldRetry: (error) => isRetryableError(error)
        });
    }) as T;
}

/**
 * 错误类型
 */
export enum ErrorType {
    NETWORK = 'NETWORK',
    TIMEOUT = 'TIMEOUT',
    GIT = 'GIT',
    FILESYSTEM = 'FILESYSTEM',
    VALIDATION = 'VALIDATION',
    PERMISSION = 'PERMISSION',
    UNKNOWN = 'UNKNOWN'
}

/**
 * 识别错误类型
 */
export function identifyErrorType(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('econn')) {
        return ErrorType.NETWORK;
    }
    
    if (message.includes('timeout') || message.includes('etimedout')) {
        return ErrorType.TIMEOUT;
    }
    
    if (message.includes('git')) {
        return ErrorType.GIT;
    }
    
    if (message.includes('enoent') || message.includes('eacces')) {
        return ErrorType.FILESYSTEM;
    }
    
    if (message.includes('permission') || message.includes('eacces')) {
        return ErrorType.PERMISSION;
    }
    
    if (error.name === 'ValidationError') {
        return ErrorType.VALIDATION;
    }
    
    return ErrorType.UNKNOWN;
}

/**
 * 根据错误类型提供解决建议
 */
export function getSuggestion(error: any): string | null {
    const type = identifyErrorType(error);
    
    switch (type) {
        case ErrorType.NETWORK:
            return '请检查网络连接，稍后重试';
        case ErrorType.TIMEOUT:
            return '请求超时，请稍后重试';
        case ErrorType.GIT:
            return '请检查 Git 仓库状态，确保没有锁定';
        case ErrorType.FILESYSTEM:
            return '请检查文件路径和权限';
        case ErrorType.PERMISSION:
            return '请检查文件访问权限';
        default:
            return null;
    }
}
