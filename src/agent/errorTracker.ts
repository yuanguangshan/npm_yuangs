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
 * 错误追踪器类
 */
export class ErrorTracker {
  private static errors: Map<string, ErrorRecord> = new Map();
  private static errorPatterns: Map<string, ErrorPattern> = new Map();
  private static maxHistorySize = 1000;

  /**
   * 记录工具执行错误
   */
  static recordError(
    toolName: string,
    parameters: any,
    errorMessage: string,
    context?: { mode: string; model?: string; userInput?: string }
  ): ErrorRecord {
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
    const existing = this.findSimilarError(toolName, parameters, '');

    if (existing && existing.attemptCount >= maxRetries) {
      return {
        blocked: true,
        reason: `工具 ${toolName} 已连续失败 ${existing.attemptCount} 次。建议：\n1. 检查参数是否正确\n2. 尝试不同的工具\n3. 修改任务策略`,
        existingError: existing
      };
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
    const paramFingerprint = JSON.stringify(parameters);

    for (const record of this.errors.values()) {
      if (record.toolName === toolName) {
        // 检查参数是否相似
        const recordParamFingerprint = JSON.stringify(record.parameters);
        if (paramFingerprint === recordParamFingerprint) {
          return record;
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
      CAPABILITY_ERROR: '当前模型能力不足，尝试使用更基础的工具'
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
