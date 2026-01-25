/**
 * 命令边界探测器
 * 
 * 职责:
 * - 从字符流中提取完整命令
 * - 只在 Enter 键时触发治理
 * 
 * 设计原则:
 * - 不分析字符
 * - 不分析 stdout
 * - 只在换行符时治理
 */
export class InputBuffer {
  private buffer = '';

  /**
   * 推入字符块
   * 
   * @param chunk 输入字符
   * @returns 如果检测到完整命令,返回命令字符串;否则返回 null
   */
  push(chunk: string): string | null {
    this.buffer += chunk;

    // 唯一治理触发点: 检测到换行符
    if (chunk.includes('\n') || chunk.includes('\r')) {
      const cmd = this.buffer.trim();
      this.buffer = '';
      
      // 空命令不触发治理
      return cmd.length > 0 ? cmd : null;
    }

    return null;
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = '';
  }

  /**
   * 获取当前缓冲区内容 (用于调试)
   */
  peek(): string {
    return this.buffer;
  }

  /**
   * 检查是否有未处理的内容
   */
  hasContent(): boolean {
    return this.buffer.length > 0;
  }
}
