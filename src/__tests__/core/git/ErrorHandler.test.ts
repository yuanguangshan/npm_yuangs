import { describe, it, expect } from '@jest/globals';
import {
    withRetry,
    isRetryableError,
    formatError,
    getSuggestion,
    identifyErrorType,
    ErrorType
} from '../../../core/git/ErrorHandler';

describe('ErrorHandler', () => {
    describe('isRetryableError', () => {
        it('should identify network errors as retryable', () => {
            const networkError = new Error('Network connection failed');
            expect(isRetryableError(networkError)).toBe(true);
        });

        it('should identify timeout errors as retryable', () => {
            const timeoutError = new Error('Request timeout');
            expect(isRetryableError(timeoutError)).toBe(true);
        });

        it('should identify 5xx errors as retryable', () => {
            const error: any = new Error('Internal server error');
            error.statusCode = 500;
            expect(isRetryableError(error)).toBe(true);
        });

        it('should identify 429 errors as retryable', () => {
            const error: any = new Error('Too many requests');
            error.statusCode = 429;
            expect(isRetryableError(error)).toBe(true);
        });

        it('should not identify 4xx errors as retryable', () => {
            const error: any = new Error('Not found');
            error.statusCode = 404;
            expect(isRetryableError(error)).toBe(false);
        });

        it('should not identify validation errors as retryable', () => {
            const validationError = new Error('Invalid input');
            expect(isRetryableError(validationError)).toBe(false);
        });
    });

    describe('withRetry', () => {
        it('should succeed on first attempt', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                return 'success';
            };
            
            const result = await withRetry(fn, { maxAttempts: 3 });
            expect(result).toBe('success');
            expect(attempts).toBe(1);
        });

        it('should retry on retryable error', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Network timeout');
                }
                return 'success';
            };
            
            const result = await withRetry(fn, {
                maxAttempts: 3,
                shouldRetry: isRetryableError
            });
            
            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });

        it('should throw on non-retryable error', async () => {
            const fn = async () => {
                throw new Error('Validation failed');
            };
            
            await expect(withRetry(fn, {
                maxAttempts: 3,
                shouldRetry: isRetryableError
            })).rejects.toThrow('Validation failed');
        });

        it('should call onRetry callback', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Network timeout');
                }
                return 'success';
            };
            
            const onRetryCalls: any[] = [];
            const result = await withRetry(fn, {
                maxAttempts: 3,
                shouldRetry: isRetryableError,
                onRetry: (error, attempt) => {
                    onRetryCalls.push({ error: error.message, attempt });
                }
            });
            
            expect(result).toBe('success');
            expect(onRetryCalls).toHaveLength(1);
            expect(onRetryCalls[0]).toEqual({
                error: 'Network timeout',
                attempt: 1
            });
        });

        it('should support exponential backoff', async () => {
            let attempts = 0;
            const timestamps: number[] = [];
            
            const fn = async () => {
                timestamps.push(Date.now());
                attempts++;
                if (attempts < 3) {
                    throw new Error('Network timeout');
                }
                return 'success';
            };
            
            await withRetry(fn, {
                maxAttempts: 3,
                delay: 100,
                backoff: true,
                shouldRetry: isRetryableError
            });
            
            expect(timestamps).toHaveLength(3);
            const delay1 = timestamps[1] - timestamps[0];
            const delay2 = timestamps[2] - timestamps[1];
            
            expect(delay2).toBeGreaterThan(delay1);
        });
    });

    describe('identifyErrorType', () => {
        it('should identify network errors', () => {
            const error = new Error('Network connection failed');
            expect(identifyErrorType(error)).toBe(ErrorType.NETWORK);
        });

        it('should identify timeout errors', () => {
            const error = new Error('Request timeout');
            expect(identifyErrorType(error)).toBe(ErrorType.TIMEOUT);
        });

        it('should identify Git errors', () => {
            const error = new Error('git: command failed');
            expect(identifyErrorType(error)).toBe(ErrorType.GIT);
        });

        it('should identify filesystem errors', () => {
            const error = new Error('ENOENT: no such file');
            expect(identifyErrorType(error)).toBe(ErrorType.FILESYSTEM);
        });

        it('should identify permission errors', () => {
            const error = new Error('Permission denied');
            expect(identifyErrorType(error)).toBe(ErrorType.PERMISSION);
        });

        it('should return UNKNOWN for unrecognized errors', () => {
            const error = new Error('Unknown error');
            expect(identifyErrorType(error)).toBe(ErrorType.UNKNOWN);
        });
    });

    describe('formatError', () => {
        it('should format error with context', () => {
            const error: any = new Error('Something went wrong');
            error.code = 'ERR_001';
            
            const formatted = formatError(error, 'Test context');
            expect(formatted).toContain('Test context');
            expect(formatted).toContain('Something went wrong');
            expect(formatted).toContain('code: ERR_001');
        });

        it('should format error without context', () => {
            const error = new Error('Something went wrong');
            const formatted = formatError(error);
            expect(formatted).toBe('Something went wrong');
        });

        it('should include error name if different from Error', () => {
            const error = new TypeError('Invalid type');
            const formatted = formatError(error);
            expect(formatted).toContain('TypeError');
            expect(formatted).toContain('Invalid type');
        });
    });

    describe('getSuggestion', () => {
        it('should return suggestion for network errors', () => {
            const error = new Error('Network connection failed');
            const suggestion = getSuggestion(error);
            expect(suggestion).toBe('请检查网络连接，稍后重试');
        });

        it('should return suggestion for timeout errors', () => {
            const error = new Error('Request timeout');
            const suggestion = getSuggestion(error);
            expect(suggestion).toBe('请求超时，请稍后重试');
        });

        it('should return suggestion for Git errors', () => {
            const error = new Error('git: command failed');
            const suggestion = getSuggestion(error);
            expect(suggestion).toBe('请检查 Git 仓库状态，确保没有锁定');
        });

        it('should return suggestion for filesystem errors', () => {
            const error = new Error('ENOENT: no such file');
            const suggestion = getSuggestion(error);
            expect(suggestion).toBe('请检查文件路径和权限');
        });

        it('should return suggestion for permission errors', () => {
            const error = new Error('Permission denied');
            const suggestion = getSuggestion(error);
            expect(suggestion).toBe('请检查文件访问权限');
        });

        it('should return null for unknown errors', () => {
            const error = new Error('Unknown error');
            const suggestion = getSuggestion(error);
            expect(suggestion).toBeNull();
        });
    });
});
