"use strict";
/**
 * 错误处理和重试机制
 * 智能处理LLM调用失败，提供自动重试和替代方案
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
exports.withAlternatives = withAlternatives;
exports.generateErrorExplanation = generateErrorExplanation;
exports.createAlternativeStrategy = createAlternativeStrategy;
const DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
        'network',
        'timeout',
        'rate limit',
        'ECONNRESET',
        'ETIMEDOUT',
        '503',
        '502',
        '429',
        'ENOTFOUND',
    ],
};
/**
 * 指数退避延迟计算
 */
function calculateBackoffDelay(attempt, config) {
    const delay = Math.min(config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1), config.maxDelay);
    // 添加随机抖动（±25%）
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.max(0, delay + jitter);
}
/**
 * 判断错误是否可重试
 */
function isRetryableError(error, config) {
    // Safely extract error message
    let errorMessage = '';
    if (typeof error.message === 'string') {
        errorMessage = error.message;
    }
    else if (typeof error === 'string') {
        errorMessage = error;
    }
    const lowerMessage = errorMessage.toLowerCase();
    return config.retryableErrors.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
}
/**
 * 自动重试执行器
 */
async function withRetry(operation, config = {}) {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError;
    let attempts = 0;
    const startTime = Date.now();
    while (attempts < finalConfig.maxAttempts) {
        attempts++;
        try {
            const result = await operation();
            const totalDuration = Date.now() - startTime;
            return {
                success: true,
                data: result,
                attempts,
                totalDuration,
            };
        }
        catch (error) {
            lastError = error;
            // 如果不可重试或达到最大尝试次数，直接失败
            if (!isRetryableError(lastError, finalConfig) ||
                attempts >= finalConfig.maxAttempts) {
                break;
            }
            // 计算延迟并等待
            const delay = calculateBackoffDelay(attempts, finalConfig);
            // Safely extract error message for logging
            const errorMsg = typeof lastError.message === 'string' ? lastError.message : String(lastError);
            console.log(`[重试] 第${attempts}次尝试失败: ${errorMsg}, ${delay.toFixed(0)}ms后重试...`);
            await sleep(delay);
        }
    }
    const totalDuration = Date.now() - startTime;
    return {
        success: false,
        error: lastError,
        attempts,
        totalDuration,
        lastError,
    };
}
/**
 * 带替代方案的执行器
 */
async function withAlternatives(primary, alternatives, config = {}) {
    // 先尝试主要策略（带重试）
    const primaryResult = await withRetry(primary, config);
    if (primaryResult.success) {
        return primaryResult;
    }
    // 主策略失败，尝试替代方案
    console.log(`[替代方案] 主策略失败，尝试${alternatives.length}个替代方案...`);
    for (const alternative of alternatives) {
        console.log(`[替代方案] 尝试: ${alternative.name} - ${alternative.description}`);
        try {
            const data = await alternative.execute();
            return {
                success: true,
                data,
                attempts: primaryResult.attempts + 1,
                totalDuration: primaryResult.totalDuration,
                fallbackUsed: true,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error && typeof error.message === 'string'
                ? error.message
                : String(error);
            console.log(`[替代方案] ${alternative.name} 失败: ${errorMsg}`);
        }
    }
    // 所有方案都失败
    return {
        success: false,
        error: new Error('所有执行方案均失败'),
        attempts: primaryResult.attempts + alternatives.length,
        totalDuration: primaryResult.totalDuration,
        lastError: primaryResult.lastError,
        fallbackUsed: true,
    };
}
/**
 * 生成错误解释
 */
function generateErrorExplanation(error, context = '') {
    const explanations = {
        network: '网络连接失败。请检查：1. 网络连接是否正常 2. 防火墙设置 3. 代理配置',
        timeout: '请求超时。可能原因：1. 网络延迟 2. 服务器响应慢 3. 请求处理时间过长',
        'rate limit': 'API调用频率超限。请稍后重试，或考虑升级API计划以获得更高的速率限制',
        'econnreset': '连接被重置。可能是网络不稳定或服务器暂时不可用',
        'etimedout': '连接超时。请检查网络连接和服务器状态',
        '503': '服务暂时不可用。服务器可能正在维护或过载，请稍后重试',
        '502': '网关错误。服务器返回了无效的响应，请稍后重试',
        '429': '请求过多。超过了API的速率限制，请等待一段时间后重试',
        'enotfound': '主机未找到。请检查：1. 域名拼写 2. DNS配置 3. 网络连接',
        'authentication': '认证失败。请检查API密钥或认证凭证',
        'authorization': '授权失败。您可能没有执行此操作的权限',
        'invalid request': '请求无效。请检查请求格式和参数',
        'context length': '上下文长度超限。请减少输入内容或使用更短的Prompt',
    };
    // Safely extract error message
    let errorMessage = '';
    if (typeof error.message === 'string') {
        errorMessage = error.message;
    }
    else if (typeof error === 'string') {
        errorMessage = error;
    }
    const lowerMessage = errorMessage.toLowerCase();
    // 查找匹配的错误解释
    for (const [key, explanation] of Object.entries(explanations)) {
        if (errorMessage.includes(key.toLowerCase())) {
            return `❌ 错误类型: ${key}\n${explanation}${context ? '\n\n上下文: ' + context : ''}`;
        }
    }
    // 默认解释
    return `❌ 错误: ${errorMessage}\n\n可能原因：\n1. 网络连接问题\n2. API服务异常\n3. 请求格式错误\n4. 认证授权问题\n\n建议：\n1. 检查网络连接\n2. 查看API文档\n3. 确认API密钥正确\n4. 稍后重试${context ? '\n\n上下文: ' + context : ''}`;
}
/**
 * 睡眠函数
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * 创建替代策略
 */
function createAlternativeStrategy(name, description, execute) {
    return {
        name,
        description,
        execute
    };
}
//# sourceMappingURL=errorHandling.js.map