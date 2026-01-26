"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
const child_process_1 = require("child_process");
const ContextManager_1 = require("./ContextManager");
/**
 * 基础模型适配器抽象类
 * 提供通用的功能实现
 */
class BaseAdapter {
    // 会话ID，用于上下文管理
    sessionId = 'default';
    /**
     * 设置会话ID
     */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    /**
     * 获取会话ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * 构建带上下文的完整prompt
     */
    buildPromptWithContext(prompt, includeContext = true) {
        if (!includeContext) {
            return prompt;
        }
        // 获取最近的对话历史
        const recentMessages = ContextManager_1.contextManager.getRecentMessages(this.sessionId, 5);
        if (recentMessages.length === 0) {
            return prompt;
        }
        // 构建带历史的prompt
        let fullPrompt = '以下是之前的对话历史:\n\n';
        for (const msg of recentMessages) {
            const roleLabel = msg.role === 'user' ? '用户' : '助手';
            fullPrompt += `${roleLabel}: ${msg.content}\n\n`;
        }
        fullPrompt += `现在用户的新问题是:\n${prompt}`;
        return fullPrompt;
    }
    /**
     * 保存对话到上下文
     */
    saveToContext(userPrompt, assistantResponse) {
        ContextManager_1.contextManager.addUserMessage(this.sessionId, userPrompt);
        ContextManager_1.contextManager.addAssistantMessage(this.sessionId, assistantResponse);
    }
    /**
     * 检查 CLI 命令是否可用
     */
    async checkCommand(command) {
        return new Promise((resolve) => {
            const child = (0, child_process_1.spawn)('command', ['-v', command]);
            child.on('close', (code) => {
                resolve(code === 0);
            });
            child.on('error', () => {
                resolve(false);
            });
        });
    }
    /**
     * 使用 spawn 执行命令（支持流式输出和自动转义）
     * @param command 要执行的命令
     * @param args 命令参数数组
     * @param timeout 超时时间（毫秒）
     * @param onChunk 流式输出回调函数
     */
    async runSpawnCommand(command, args, timeout = 30000, onChunk) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(command, args);
            let stdout = '';
            let stderr = '';
            let timeoutId = null;
            let isResolved = false;
            // 设置超时
            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        child.kill();
                        reject(new Error(`命令执行超时 (${timeout}ms)`));
                    }
                }, timeout);
            }
            // 实时监听标准输出
            child.stdout.on('data', (data) => {
                const str = data.toString();
                stdout += str;
                // 如果提供了 onChunk 回调，且输出不是 JSON 格式，则实时回调
                if (onChunk && !this.isJsonOutput(str)) {
                    onChunk(str);
                }
            });
            // 监听标准错误输出
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            // 进程关闭事件
            child.on('close', (code) => {
                if (timeoutId)
                    clearTimeout(timeoutId);
                if (isResolved)
                    return;
                isResolved = true;
                if (code === 0) {
                    resolve({ stdout, stderr });
                }
                else {
                    // 有些 CLI 即使成功也可能输出 warning 到 stderr
                    // 如果有 stdout 输出，认为执行成功
                    if (stdout.trim()) {
                        resolve({ stdout, stderr });
                    }
                    else {
                        reject(new Error(`命令执行失败 (exit code ${code}): ${stderr || stdout}`));
                    }
                }
            });
            // 进程错误事件
            child.on('error', (err) => {
                if (timeoutId)
                    clearTimeout(timeoutId);
                if (isResolved)
                    return;
                isResolved = true;
                reject(new Error(`命令执行失败: ${err.message}`));
            });
        });
    }
    /**
     * 判断字符串是否像是 JSON 格式
     */
    isJsonOutput(str) {
        const trimmed = str.trim();
        return trimmed.startsWith('{') || trimmed.startsWith('[');
    }
    /**
     * 提取 JSON 内容（处理 CLI 输出中的干扰日志）
     * @param output CLI 输出字符串
     * @returns 提取的 JSON 字符串，如果没有找到则返回原字符串
     */
    extractJsonContent(output) {
        try {
            // 查找第一个 { 和最后一个 } 之间的内容
            const firstBrace = output.indexOf('{');
            const lastBrace = output.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                return output.substring(firstBrace, lastBrace + 1);
            }
            // 如果没有找到，尝试查找数组格式
            const firstBracket = output.indexOf('[');
            const lastBracket = output.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                return output.substring(firstBracket, lastBracket + 1);
            }
            return output;
        }
        catch {
            return output;
        }
    }
    /**
     * 测量执行时间
     */
    async measureExecutionTime(fn) {
        const start = Date.now();
        const result = await fn();
        const executionTime = Date.now() - start;
        return { result, executionTime };
    }
    /**
     * 是否可用（默认检查健康状态）
     */
    async isAvailable() {
        return this.healthCheck();
    }
    /**
     * 创建成功结果
     */
    createSuccessResult(content, executionTime, metadata) {
        return {
            modelName: this.name,
            success: true,
            content,
            executionTime,
            metadata,
        };
    }
    /**
     * 创建失败结果
     */
    createErrorResult(error, executionTime) {
        return {
            modelName: this.name,
            success: false,
            error,
            executionTime,
        };
    }
}
exports.BaseAdapter = BaseAdapter;
//# sourceMappingURL=BaseAdapter.js.map