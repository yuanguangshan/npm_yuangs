/**
 * 错误追踪器 (Error Tracker)
 * -----------------------
 * 跟踪工具执行过程中的错误，防止重复尝试相同的失败操作
 *
 * 功能：
 * 1. 记录工具执行失败的详细信息
 * 2. 检测重复的失败模式
 * 3. 提供错误历史查询
 * 4. 生成错误报告和建议
 */

import { randomUUID } from 'crypto';
import { FileStorage } from '../utils/storage';

/**
 * 错误记录接口
 */
export interface ErrorRecord {
  id: string;
  timestamp: number;
  toolName: string;
  parameters: any;
  errorType: string;
  errorMessage: string;
  attemptCount: number;
  lastAttempt: number;
  similarErrors: string[]; // 相似错误的 ID 列表
  context?: {
    mode: string;
    model?: string;
    userInput?: string;
  };
}

/**
 * 错误模式接口
 */
export interface ErrorPattern {
  pattern: string;
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  errorIds: string[];
  suggestedFix?: string;
}

/**
 * 序列化数据结构
 */
interface ErrorTrackerData {
  errors: ErrorRecord[];
  patterns: ErrorPattern[];
}

/**
 * 错误追踪器类
 */
export class ErrorTracker {
  private static errors: Map<string, ErrorRecord> = new Map();
  private static errorPatterns: Map<string, ErrorPattern> = new Map();
  private static maxHistorySize = 1000;
  private static storage = FileStorage.forYuangs<ErrorTrackerData>('error-tracker.json');
  private static initialized = false;

  /**
   * 懒加载持久化数据
   */
  private static ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;

    const data = this.storage.read();
    if (!data) return;

    for (const record of data.errors || []) {
      this.errors.set(record.id, record);
    }
    for (const pattern of data.patterns || []) {
      this.errorPatterns.set(pattern.pattern, pattern);
    }
  }

  /**
   * 保存到磁盘
   */
  private static persist(): void {
    const data: ErrorTrackerData = {
      errors: Array.from(this.errors.values()),
      patterns: Array.from(this.errorPatterns.values()),
    };
    this.storage.write(data);
  }

  /**
   * 记录工具执行错误
   */
  static recordError(
    toolName: string,
    parameters: any,
    errorMessage: string,
    context?: { mode: string; model?: string; userInput?: string }
  ): ErrorRecord {
    this.ensureInitialized();
    // 生成错误指纹（用于检测重复）
    const fingerprint = this.generateFingerprint(toolName, parameters, errorMessage);

    // 检查是否已存在相同错误
    const existing = this.findSimilarError(toolName, parameters, errorMessage);

    let record: ErrorRecord;

    if (existing) {
      // 更新现有记录
      existing.attemptCount++;
      existing.lastAttempt = Date.now();
      existing.similarErrors.push(fingerprint);
      record = existing;
    } else {
      // 创建新记录
      record = {
        id: randomUUID(),
        timestamp: Date.now(),
        toolName,
        parameters: JSON.parse(JSON.stringify(parameters)), // 深拷贝
        errorType: this.classifyError(errorMessage),
        errorMessage,
        attemptCount: 1,
        lastAttempt: Date.now(),
        similarErrors: [fingerprint],
        context
      };

      this.errors.set(record.id, record);

      // 清理旧记录
      if (this.errors.size > this.maxHistorySize) {
        this.cleanupOldRecords();
      }
    }

    // 更新错误模式
    this.updateErrorPatterns(record);
    this.persist();

    return record;
  }

  /**
   * 检查是否应该阻止执行（防止重复错误）
   */
  static shouldBlockExecution(
    toolName: string,
    parameters: any,
    maxRetries: number = 3
  ): { blocked: boolean; reason?: string; existingError?: ErrorRecord } {
    this.ensureInitialized();
    const existing = this.findSimilarError(toolName, parameters, '');

    if (existing) {
      // 对于 BUFFER_OVERFLOW 错误，立即阻止（重试不会有效）
      if (existing.errorType === 'BUFFER_OVERFLOW') {
        return {
          blocked: true,
          reason: `工具 ${toolName} 遇到输出过大错误（BUFFER_OVERFLOW）。重试不会有效。建议：\n1. 使用更具体的搜索模式\n2. 限制搜索范围（使用 file_pattern）\n3. 增大 max_results 参数`,
          existingError: existing
        };
      }

      // 对于其他错误，达到重试次数后阻止
      if (existing.attemptCount >= maxRetries) {
        return {
          blocked: true,
          reason: `工具 ${toolName} 已连续失败 ${existing.attemptCount} 次。建议：\n1. 检查参数是否正确\n2. 尝试不同的工具\n3. 修改任务策略`,
          existingError: existing
        };
      }
    }

    return { blocked: false };
  }

  /**
   * 查找相似错误
   */
  private static findSimilarError(
    toolName: string,
    parameters: any,
    errorMessage: string
  ): ErrorRecord | undefined {
    for (const record of this.errors.values()) {
      if (record.toolName === toolName) {
        // 对于 search_in_files，比较关键参数
        if (toolName === 'search_in_files') {
          const currentPattern = parameters.pattern || '';
          const recordPattern = record.parameters.pattern || '';
          const currentFilePattern = parameters.file_pattern || parameters.path || '';
          const recordFilePattern = record.parameters.file_pattern || record.parameters.path || '';

          // 如果搜索模式相同，认为是相似错误
          if (currentPattern === recordPattern && currentFilePattern === recordFilePattern) {
            return record;
          }
        } else {
          // 其他工具使用精确参数匹配
          const paramFingerprint = JSON.stringify(parameters);
          const recordParamFingerprint = JSON.stringify(record.parameters);
          if (paramFingerprint === recordParamFingerprint) {
            return record;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * 生成错误指纹
   */
  private static generateFingerprint(
    toolName: string,
    parameters: any,
    errorMessage: string
  ): string {
    const normalizedMessage = errorMessage
      .replace(/\d+/g, 'N') // 替换数字
      .replace(/['"][^'"]*['"]/g, 'STR') // 替换字符串
      .toLowerCase();

    return `${toolName}:${normalizedMessage}`;
  }

  /**
   * 分类错误类型
   */
  private static classifyError(errorMessage: string): string {
    const lower = errorMessage.toLowerCase();

    if (lower.includes('enoent') || lower.includes('no such file')) return 'FILE_NOT_FOUND';
    if (lower.includes('eacces') || lower.includes('permission')) return 'PERMISSION_DENIED';
    if (lower.includes('syntax') || lower.includes('parse')) return 'SYNTAX_ERROR';
    if (lower.includes('network') || lower.includes('econn')) return 'NETWORK_ERROR';
    if (lower.includes('timeout') || lower.includes('etimed')) return 'TIMEOUT';
    if (lower.includes('unknown tool')) return 'UNKNOWN_TOOL';
    if (lower.includes('capability') || lower.includes('requires')) return 'CAPABILITY_ERROR';
    if (lower.includes('maxbuffer') || lower.includes('max_buffer') || lower.includes('buffer')) return 'BUFFER_OVERFLOW';

    return 'UNKNOWN';
  }

  /**
   * 更新错误模式
   */
  private static updateErrorPatterns(record: ErrorRecord): void {
    const patternKey = `${record.toolName}:${record.errorType}`;
    const pattern = this.errorPatterns.get(patternKey);

    if (pattern) {
      pattern.count++;
      pattern.lastOccurrence = record.timestamp;
      pattern.errorIds.push(record.id);
    } else {
      this.errorPatterns.set(patternKey, {
        pattern: patternKey,
        count: 1,
        firstOccurrence: record.timestamp,
        lastOccurrence: record.timestamp,
        errorIds: [record.id],
        suggestedFix: this.suggestFix(record.errorType)
      });
    }
  }

  /**
   * 根据错误类型建议修复方案
   */
  private static suggestFix(errorType: string): string {
    const fixes: Record<string, string> = {
      FILE_NOT_FOUND: '检查文件路径是否正确，或使用 list_files 确认文件存在',
      PERMISSION_DENIED: '检查文件权限，或尝试使用不同的工具/方式',
      SYNTAX_ERROR: '检查命令语法，参考工具文档',
      NETWORK_ERROR: '检查网络连接，稍后重试',
      TIMEOUT: '增加超时时间，或简化请求',
      UNKNOWN_TOOL: '使用 list_files 查看可用工具列表',
      CAPABILITY_ERROR: '当前模型能力不足，尝试使用更基础的工具',
      BUFFER_OVERFLOW: '搜索结果过多，建议：1. 使用更具体的搜索模式 2. 限制搜索范围（使用 file_pattern）3. 增大 max_results 参数'
    };

    return fixes[errorType] || '检查输入参数和执行环境';
  }

  /**
   * 清理旧记录
   */
  private static cleanupOldRecords(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时

    for (const [id, record] of this.errors.entries()) {
      if (now - record.timestamp > maxAge) {
        this.errors.delete(id);
      }
    }
    this.persist();
  }

  /**
   * 获取错误统计
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByTool: Record<string, number>;
    errorsByType: Record<string, number>;
    commonPatterns: Array<{ pattern: string; count: string; suggestedFix: string }>;
  } {
    this.ensureInitialized();
    const errorsByTool: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    for (const record of this.errors.values()) {
      errorsByTool[record.toolName] = (errorsByTool[record.toolName] || 0) + 1;
      errorsByType[record.errorType] = (errorsByType[record.errorType] || 0) + 1;
    }

    // 获取最常见的错误模式
    const commonPatterns = Array.from(this.errorPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([key, pattern]) => ({
        pattern: key,
        count: pattern.count.toString(),
        suggestedFix: pattern.suggestedFix || '无建议'
      }));

    return {
      totalErrors: this.errors.size,
      errorsByTool,
      errorsByType,
      commonPatterns
    };
  }

  /**
   * 清除所有错误记录
   */
  static clear(): void {
    this.errors.clear();
    this.errorPatterns.clear();
    this.storage.delete();
  }

  /**
   * 获取特定工具的错误历史
   */
  static getToolHistory(toolName: string): ErrorRecord[] {
    return Array.from(this.errors.values())
      .filter(record => record.toolName === toolName)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}
