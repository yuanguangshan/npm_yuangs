"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = exports.RetryableError = exports.GitWorkflowError = void 0;
exports.withRetry = withRetry;
exports.isRetryableError = isRetryableError;
exports.formatError = formatError;
exports.createRetryableAIAdapter = createRetryableAIAdapter;
exports.identifyErrorType = identifyErrorType;
exports.getSuggestion = getSuggestion;
const chalk_1 = __importDefault(require("chalk"));
class GitWorkflowError extends Error {
    code;
    recoverable;
    constructor(message, code, recoverable = true) {
        super(message);
        this.code = code;
        this.recoverable = recoverable;
        this.name = 'GitWorkflowError';
    }
}
exports.GitWorkflowError = GitWorkflowError;
class RetryableError extends Error {
    attempt;
    maxAttempts;
    constructor(message, attempt, maxAttempts) {
        super(message);
        this.attempt = attempt;
        this.maxAttempts = maxAttempts;
        this.name = 'RetryableError';
    }
}
exports.RetryableError = RetryableError;
const DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    onRetry: () => { },
    shouldRetry: () => true
};
/**
 * 可重试的异步函数包装器
 */
async function withRetry(fn, options = {}) {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
function isRetryableError(error) {
    if (!error)
        return false;
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
    if (message.includes('git') && (message.includes('lock') ||
        message.includes('busy'))) {
        return true;
    }
    return false;
}
/**
 * 格式化错误消息
 */
function formatError(error, context) {
    const parts = [];
    if (context) {
        parts.push(chalk_1.default.red(`[${context}]`));
    }
    if (error.name && error.name !== 'Error') {
        parts.push(chalk_1.default.yellow(error.name));
    }
    if (error.message) {
        parts.push(error.message);
    }
    if (error.code) {
        parts.push(chalk_1.default.gray(`(code: ${error.code})`));
    }
    return parts.join(' ');
}
/**
 * 创建带有重试的 AI 调用包装器
 */
function createRetryableAIAdapter(fn, options) {
    return (async (...args) => {
        return withRetry(() => fn(...args), {
            ...options,
            shouldRetry: (error) => isRetryableError(error)
        });
    });
}
/**
 * 错误类型
 */
var ErrorType;
(function (ErrorType) {
    ErrorType["NETWORK"] = "NETWORK";
    ErrorType["TIMEOUT"] = "TIMEOUT";
    ErrorType["GIT"] = "GIT";
    ErrorType["FILESYSTEM"] = "FILESYSTEM";
    ErrorType["VALIDATION"] = "VALIDATION";
    ErrorType["PERMISSION"] = "PERMISSION";
    ErrorType["UNKNOWN"] = "UNKNOWN";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
/**
 * 识别错误类型
 */
function identifyErrorType(error) {
    if (!error)
        return ErrorType.UNKNOWN;
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
function getSuggestion(error) {
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
//# sourceMappingURL=ErrorHandler.js.map