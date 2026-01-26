import { ConversationContext, Message } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 上下文管理器
 * 负责管理对话历史，支持多轮对话
 * 支持本地文件持久化，解决CLI工具进程退出导致的上下文丢失问题
 */
export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private defaultMaxMessages = 10; // 默认保留最近10条消息
  private defaultMaxTokens = 4000; // 默认最大token数（粗略估算）
  private storagePath: string;

  constructor() {
    // 存储路径：~/.yuangs/context.json
    const yuangsDir = path.join(os.homedir(), '.yuangs');
    
    // 确保目录存在
    if (!fs.existsSync(yuangsDir)) {
      try {
        fs.mkdirSync(yuangsDir, { recursive: true });
      } catch (e) {
        console.warn('无法创建上下文目录:', e);
      }
    }
    
    this.storagePath = path.join(yuangsDir, 'context.json');
    
    // 初始化时加载持久化的上下文
    this.loadContext();
  }

  /**
   * 创建或获取会话上下文
   */
  getOrCreateContext(sessionId: string): ConversationContext {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        sessionId,
        messages: [],
        maxMessages: this.defaultMaxMessages,
        maxTokens: this.defaultMaxTokens,
      });
    }
    return this.contexts.get(sessionId)!;
  }

  /**
   * 添加用户消息
   */
  addUserMessage(sessionId: string, content: string): void {
    const context = this.getOrCreateContext(sessionId);
    context.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });
    this.trimContext(context);
    this.saveContext(); // 持久化
  }

  /**
   * 添加助手消息
   */
  addAssistantMessage(sessionId: string, content: string): void {
    const context = this.getOrCreateContext(sessionId);
    context.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
    });
    this.trimContext(context);
    this.saveContext(); // 持久化
  }

  /**
   * 获取格式化的对话历史（用于附加到 prompt）
   */
  getFormattedHistory(sessionId: string, includeSystemPrompt?: string): string {
    const context = this.getOrCreateContext(sessionId);
    
    let formatted = '';
    
    if (includeSystemPrompt) {
      formatted += `System: ${includeSystemPrompt}\n\n`;
    }
    
    for (const msg of context.messages) {
      const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
      formatted += `${roleLabel}: ${msg.content}\n\n`;
    }
    
    return formatted.trim();
  }

  /**
   * 获取上下文的最近N条消息
   */
  getRecentMessages(sessionId: string, count: number): Message[] {
    const context = this.getOrCreateContext(sessionId);
    return context.messages.slice(-count);
  }

  /**
   * 清除会话上下文
   */
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
    this.saveContext(); // 持久化
  }

  /**
   * 修剪上下文（保持在限制范围内）
   */
  private trimContext(context: ConversationContext): void {
    // 按消息数量限制
    if (context.maxMessages && context.messages.length > context.maxMessages) {
      context.messages = context.messages.slice(-context.maxMessages);
    }

    // 按token数量限制（粗略估算：1个汉字≈2tokens，1个英文单词≈1.3tokens）
    if (context.maxTokens) {
      let totalTokens = this.estimateTokens(context.messages);
      
      while (totalTokens > context.maxTokens && context.messages.length > 1) {
        // 移除最早的消息
        context.messages.shift();
        totalTokens = this.estimateTokens(context.messages);
      }
    }
  }

  /**
   * 估算消息的token数量
   */
  private estimateTokens(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      // 粗略估算：
      // - 汉字: 1字符 ≈ 2 tokens
      // - 英文: 1字符 ≈ 0.25 tokens (平均单词长度4-5)
      const chineseChars = (msg.content.match(/[\u4e00-\u9fa5]/g) || []).length;
      const otherChars = msg.content.length - chineseChars;
      
      total += chineseChars * 2 + otherChars * 0.25;
    }
    return Math.ceil(total);
  }

  /**
   * 设置默认最大消息数
   */
  setDefaultMaxMessages(max: number): void {
    this.defaultMaxMessages = max;
  }

  /**
   * 设置默认最大token数
   */
  setDefaultMaxTokens(max: number): void {
    this.defaultMaxTokens = max;
  }

  /**
   * 获取所有活跃会话ID
   */
  getActiveSessions(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * 获取会话统计信息
   */
  getSessionStats(sessionId: string): {
    messageCount: number;
    estimatedTokens: number;
    firstMessage?: Date;
    lastMessage?: Date;
  } | null {
    const context = this.contexts.get(sessionId);
    if (!context || context.messages.length === 0) {
      return null;
    }

    return {
      messageCount: context.messages.length,
      estimatedTokens: this.estimateTokens(context.messages),
      firstMessage: context.messages[0]?.timestamp,
      lastMessage: context.messages[context.messages.length - 1]?.timestamp,
    };
  }

  /**
   * 保存上下文到本地文件（持久化）
   * 每次修改上下文时自动调用
   */
  private saveContext(): void {
    try {
      // 将 Map 转换为普通对象以便序列化
      const data: Record<string, ConversationContext> = {};
      
      for (const [sessionId, context] of this.contexts.entries()) {
        data[sessionId] = context;
      }
      
      // 写入文件
      fs.writeFileSync(
        this.storagePath, 
        JSON.stringify(data, null, 2),
        'utf8'
      );
    } catch (error) {
      // 静默失败，不影响主流程
      console.warn('⚠️  上下文保存失败:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * 从本地文件加载上下文（恢复持久化数据）
   * 在构造函数中调用
   */
  private loadContext(): void {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return; // 文件不存在，使用空上下文
      }
      
      const content = fs.readFileSync(this.storagePath, 'utf8');
      const data: Record<string, any> = JSON.parse(content);
      
      // 恢复 Map 结构，并处理 Date 对象的反序列化
      for (const [sessionId, context] of Object.entries(data)) {
        // 将 timestamp 字符串转换回 Date 对象
        if (context.messages && Array.isArray(context.messages)) {
          context.messages.forEach((msg: any) => {
            if (msg.timestamp) {
              msg.timestamp = new Date(msg.timestamp);
            }
          });
        }
        
        this.contexts.set(sessionId, context as ConversationContext);
      }
      
    } catch (error) {
      // 解析失败，使用空上下文
      console.warn('⚠️  上下文加载失败，将使用空上下文:', error instanceof Error ? error.message : error);
      this.contexts.clear();
    }
  }

  /**
   * 清空所有上下文并删除持久化文件
   */
  clearAllContexts(): void {
    this.contexts.clear();
    
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath);
      }
    } catch (error) {
      console.warn('⚠️  删除上下文文件失败:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * 获取上下文存储路径
   */
  getStoragePath(): string {
    return this.storagePath;
  }
}

// 导出单例实例
export const contextManager = new ContextManager();
