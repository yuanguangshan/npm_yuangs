import { ConversationContext, Message } from './types';
/**
 * 上下文管理器
 * 负责管理对话历史，支持多轮对话
 * 支持本地文件持久化，解决CLI工具进程退出导致的上下文丢失问题
 */
export declare class ContextManager {
    private contexts;
    private defaultMaxMessages;
    private defaultMaxTokens;
    private storagePath;
    constructor();
    /**
     * 创建或获取会话上下文
     */
    getOrCreateContext(sessionId: string): ConversationContext;
    /**
     * 添加用户消息
     */
    addUserMessage(sessionId: string, content: string): void;
    /**
     * 添加助手消息
     */
    addAssistantMessage(sessionId: string, content: string): void;
    /**
     * 获取格式化的对话历史（用于附加到 prompt）
     */
    getFormattedHistory(sessionId: string, includeSystemPrompt?: string): string;
    /**
     * 获取上下文的最近N条消息
     */
    getRecentMessages(sessionId: string, count: number): Message[];
    /**
     * 清除会话上下文
     */
    clearContext(sessionId: string): void;
    /**
     * 修剪上下文（保持在限制范围内）
     */
    private trimContext;
    /**
     * 估算消息的token数量
     */
    private estimateTokens;
    /**
     * 设置默认最大消息数
     */
    setDefaultMaxMessages(max: number): void;
    /**
     * 设置默认最大token数
     */
    setDefaultMaxTokens(max: number): void;
    /**
     * 获取所有活跃会话ID
     */
    getActiveSessions(): string[];
    /**
     * 获取会话统计信息
     */
    getSessionStats(sessionId: string): {
        messageCount: number;
        estimatedTokens: number;
        firstMessage?: Date;
        lastMessage?: Date;
    } | null;
    /**
     * 保存上下文到本地文件（持久化）
     * 每次修改上下文时自动调用
     */
    private saveContext;
    /**
     * 从本地文件加载上下文（恢复持久化数据）
     * 在构造函数中调用
     */
    private loadContext;
    /**
     * 清空所有上下文并删除持久化文件
     */
    clearAllContexts(): void;
    /**
     * 获取上下文存储路径
     */
    getStoragePath(): string;
}
export declare const contextManager: ContextManager;
