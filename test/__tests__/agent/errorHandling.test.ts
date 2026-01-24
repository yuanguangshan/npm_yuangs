// @ts-nocheck
import {
  withRetry,
  withAlternatives,
  isRetryableError,
  generateErrorExplanation,
  createAlternativeStrategy
} from '../../../src/agent/errorHandling';

describe('errorHandling', () => {
  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const error = new Error('network connection failed');
      const config = {
        retryableErrors: ['network', 'timeout', '503']
      };
      expect(isRetryableError(error, config)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('request timeout after 30s');
      const config = {
        retryableErrors: ['network', 'timeout', '503']
      };
      expect(isRetryableError(error, config)).toBe(true);
    });

    it('should identify 503 errors as retryable', () => {
      const error = new Error('Service temporarily unavailable (503)');
      const config = {
        retryableErrors: ['network', 'timeout', '503']
      };
      expect(isRetryableError(error, config)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      const error = new Error('Rate limit exceeded (429)');
      const config = {
        retryableErrors: ['rate limit', '429']
      };
      expect(isRetryableError(error, config)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const error = new Error('authentication failed');
      const config = {
        retryableErrors: ['network', 'timeout', '503']
      };
      expect(isRetryableError(error, config)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const error = new Error('NETWORK ERROR');
      const config = {
        retryableErrors: ['network']
      };
      expect(isRetryableError(error, config)).toBe(true);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockOperation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      let attempts = 0;
      const mockOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('network timeout');
        }
        return 'success after retry';
      });

      const result = await withRetry(mockOperation, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success after retry');
      expect(result.attempts).toBe(2);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(
        new Error('persistent network error')
      );

      const result = await withRetry(mockOperation, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(3);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail immediately on non-retryable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(
        new Error('authentication failed')
      );

      const result = await withRetry(mockOperation, {
        maxAttempts: 3,
        retryableErrors: ['network', 'timeout']
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should record total duration', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockOperation);

      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
      expect(typeof result.totalDuration).toBe('number');
    });
  });

  describe('withAlternatives', () => {
    it('should succeed with primary strategy', async () => {
      const primary = jest.fn().mockResolvedValue('primary success');
      const alternatives = [];

      const result = await withAlternatives(primary, alternatives);

      expect(result.success).toBe(true);
      expect(result.data).toBe('primary success');
      expect(result.fallbackUsed).toBe(false);
      expect(primary).toHaveBeenCalledTimes(1);
    });

    it('should try alternatives when primary fails', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('primary failed'));
      const alternative1 = jest.fn().mockResolvedValue('alternative success');
      const alternative2 = jest.fn().mockResolvedValue('alternative 2 success');

      const alternatives = [
        createAlternativeStrategy('alt1', 'description 1', alternative1),
        createAlternativeStrategy('alt2', 'description 2', alternative2)
      ];

      const result = await withAlternatives(primary, alternatives, {
        maxAttempts: 1
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('alternative success');
      expect(result.fallbackUsed).toBe(true);
      expect(primary).toHaveBeenCalledTimes(1);
      expect(alternative1).toHaveBeenCalledTimes(1);
      expect(alternative2).not.toHaveBeenCalled();
    });

    it('should fail when all alternatives fail', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('primary failed'));
      const alternative1 = jest.fn().mockRejectedValue(new Error('alt1 failed'));
      const alternative2 = jest.fn().mockRejectedValue(new Error('alt2 failed'));

      const alternatives = [
        createAlternativeStrategy('alt1', 'description 1', alternative1),
        createAlternativeStrategy('alt2', 'description 2', alternative2)
      ];

      const result = await withAlternatives(primary, alternatives, {
        maxAttempts: 1
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.fallbackUsed).toBe(true);
    });

    it('should accumulate attempts across all strategies', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('failed'));
      const alternative = jest.fn().mockRejectedValue(new Error('failed'));

      const alternatives = [
        createAlternativeStrategy('alt', 'desc', alternative)
      ];

      const result = await withAlternatives(primary, alternatives, {
        maxAttempts: 2
      });

      expect(result.attempts).toBe(4); // primary: 2 attempts + alternative: 2 attempts
    });
  });

  describe('generateErrorExplanation', () => {
    it('should explain network errors', () => {
      const error = new Error('network connection failed');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('网络连接失败');
      expect(explanation).toContain('1. 网络连接是否正常');
      expect(explanation).toContain('2. 防火墙设置');
      expect(explanation).toContain('3. 代理配置');
    });

    it('should explain timeout errors', () => {
      const error = new Error('request timeout after 30s');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('请求超时');
      expect(explanation).toContain('网络延迟');
      expect(explanation).toContain('服务器响应慢');
    });

    it('should explain rate limit errors', () => {
      const error = new Error('API rate limit exceeded (429)');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('API调用频率超限');
      expect(explanation).toContain('稍后重试');
      expect(explanation).toContain('升级API计划');
    });

    it('should explain 503 errors', () => {
      const error = new Error('Service temporarily unavailable (503)');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('服务暂时不可用');
      expect(explanation).toContain('服务器可能正在维护');
      expect(explanation).toContain('过载');
    });

    it('should explain 429 errors', () => {
      const error = new Error('Too Many Requests (429)');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('请求过多');
      expect(explanation).toContain('速率限制');
      expect(explanation).toContain('等待一段时间后重试');
    });

    it('should explain authentication errors', () => {
      const error = new Error('Authentication failed');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('认证失败');
      expect(explanation).toContain('API密钥');
      expect(explanation).toContain('认证凭证');
    });

    it('should explain context length errors', () => {
      const error = new Error('Context length exceeded');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('上下文长度超限');
      expect(explanation).toContain('减少输入内容');
      expect(explanation).toContain('使用更短的Prompt');
    });

    it('should include context in explanation', () => {
      const error = new Error('network error');
      const context = 'While downloading file: https://example.com/file.txt';
      const explanation = generateErrorExplanation(error, context);

      expect(explanation).toContain('上下文: ' + context);
    });

    it('should provide default explanation for unknown errors', () => {
      const error = new Error('unknown error occurred');
      const explanation = generateErrorExplanation(error);

      expect(explanation).toContain('unknown error occurred');
      expect(explanation).toContain('可能原因');
      expect(explanation).toContain('建议');
    });
  });

  describe('createAlternativeStrategy', () => {
    it('should create valid alternative strategy', () => {
      const execute = jest.fn().mockResolvedValue('result');
      const strategy = createAlternativeStrategy('test', 'test description', execute);

      expect(strategy.name).toBe('test');
      expect(strategy.description).toBe('test description');
      expect(strategy.execute).toBe(execute);
    });

    it('should execute strategy function', async () => {
      const execute = jest.fn().mockResolvedValue('executed');
      const strategy = createAlternativeStrategy('test', 'desc', execute);

      const result = await strategy.execute();

      expect(result).toBe('executed');
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });
});
